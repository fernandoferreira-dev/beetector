#include <RadioLib.h>
#include <SPI.h>
#include <Preferences.h>
#include <NimBLEDevice.h>

// PINOS
#define LORA_SCK    7
#define LORA_MISO   8
#define LORA_MOSI   9
#define LORA_CS     41   // NSS
#define LORA_RST    42
#define LORA_DIO1   39
#define LORA_BUSY   40
#define LORA_RXEN   38   // RF-SW

#define BTN_SCAN    4    // INPUT_PULLUP, outro terminal ao GND (procurar / cancelar)
#define BTN_OK      5    // INPUT_PULLUP, outro terminal ao GND (aceitar)

#ifndef LED_BUILTIN
#define LED_BUILTIN 21
#endif
#define LED_PAIR        LED_BUILTIN
#define LED_ACTIVE_LOW  1          // LED do XIAO ESP32-S3 acende com nivel baixo

// LORAWAN
SPIClass loraSPI(FSPI);
SX1262 radio = new Module(LORA_CS, LORA_DIO1, LORA_RST, LORA_BUSY, loraSPI);

const LoRaWANBand_t region = EU868;
LoRaWANNode node(&radio, &region);

Preferences store;        // sessao LoRaWAN (namespace "radiolib")
Preferences hivesStore;   // lista de colmeias (namespace "hives"), separada para nao ser apagada com store.clear()

uint64_t joinEUI = 0x0000000000000000;
uint64_t devEUI  = 0x70B3D57ED0079CA6;

uint8_t appKey[] = { 0x3D, 0xD6, 0x96, 0x4A, 0x3B, 0x9D, 0x5F, 0x96,
                     0x7F, 0xE9, 0x27, 0x54, 0x87, 0x16, 0xA1, 0x09 };
uint8_t nwkKey[] = { 0x3D, 0xD6, 0x96, 0x4A, 0x3B, 0x9D, 0x5F, 0x96,
                     0x7F, 0xE9, 0x27, 0x54, 0x87, 0x16, 0xA1, 0x09 };
                                    
const uint32_t UPLINK_INTERVAL_MS = 60000;//900000  // 15 min entre uplinks normais
const uint32_t ALARM_MIN_GAP_MS   = 300000;  // minimo 5 min entre uplinks de alarme
const uint32_t JOIN_RETRY_MS      = 30000;   // 30 s entre tentativas de join
const uint32_t NODATA_RETRY_MS    = 30000;   // 30 s: so volta a TESTAR se ja ha dados (nao envia nada sem dados)

// BLE / COLMEIAS
#define SERVICE_UUID "7a1c0001-5b1e-4f3a-9d2e-3c6b8f0a1d10"
#define CHAR_UUID    "7a1c0002-5b1e-4f3a-9d2e-3c6b8f0a1d10"

#define MAX_HIVES        8
#define MAX_CONT         3           // ate este numero de colmeias: ligacao continua; acima: rotacao
#define REC_SIZE         11          // bytes por colmeia no uplink
const uint32_t POLL_STEP_MS   = 15000;  // (modo rotacao) intervalo entre leituras
const uint32_t PAIR_SCAN_MS   = 60000;  // duracao da procura
const uint32_t PAIR_ACCEPT_MS = 30000;  // tempo para carregar em ACEITAR
const int      PAIR_RSSI_MIN  = -100;   // sobe para -60/-70 quando o sinal estiver bom

// Parte persistente (guardada em flash)
struct HiveId {
  char    addr[18];   // "aa:bb:cc:dd:ee:ff"
  uint8_t type;       // tipo de endereco BLE
};
HiveId hiveIds[MAX_HIVES];
int nHives = 0;

// Parte em RAM (estado desde o ultimo uplink)
struct HiveRt {
  int16_t  temp10;
  uint8_t  hum;
  uint16_t beamCount;
  int8_t   soundMax;
  uint8_t  worst;
  uint8_t  last;
  uint16_t freq;
  bool     have;
  bool     alarm;
  uint8_t  fails;
};
HiveRt rt[MAX_HIVES];
portMUX_TYPE dataMux = portMUX_INITIALIZER_UNLOCKED;   // as notificacoes chegam noutra task

void resetRt(int i) {
  rt[i] = {0x7FFF, 0xFF, 0, -128, 0, 0, 0, false, false, 0};
}

// Ligacoes continuas (modo ate MAX_CONT colmeias)
NimBLEClient* cli[MAX_HIVES] = {nullptr};
uint32_t nextConnAt[MAX_HIVES] = {0};
uint8_t  connFails[MAX_HIVES] = {0};

bool isContinuo() { return nHives <= MAX_CONT; }

// Modos de emparelhamento
enum Modo { NORMAL, PROCURA, CANDIDATO };
Modo modo = NORMAL;
uint32_t modoAte = 0;

volatile bool candFound = false;
char    candAddr[18] = "";
uint8_t candType = 0;
int     candRssi = 0;
volatile int seenRssi = 0;   // ultimo C6 visto (diagnostico)

uint32_t nextPollAt = 0;
int pollIdx = 0;

// Botoes
bool scanLast = false, okLast = false;
uint32_t scanT = 0, okT = 0;
uint32_t bothSince = 0;

bool edge(uint8_t pin, bool &last, uint32_t &t) {   // true uma vez por pressao (com debounce)
  bool now = (digitalRead(pin) == LOW);
  if (now != last && millis() - t > 30) {
    last = now;
    t = millis();
    return now;
  }
  return false;
}

bool due(uint32_t t) { return (int32_t)(millis() - t) >= 0; }

// LED
void ledSet(bool on) {
  digitalWrite(LED_PAIR, LED_ACTIVE_LOW ? !on : on);
}

void piscar(int n) {
  for (int i = 0; i < n; i++) { ledSet(true); delay(120); ledSet(false); delay(120); }
}

void atualizarLed() {
  switch (modo) {
    case NORMAL:    ledSet(false); break;
    case PROCURA:   ledSet((millis() % 300) < 150); break;   // pisca rapido
    case CANDIDATO: ledSet(true); break;                     // fixo: carrega ACEITAR
  }
}

// Dados recebidos de uma colmeia
void processarPacote(int i, const uint8_t* d, size_t len) {
  if (i < 0 || i >= MAX_HIVES || len < 7) return;

  int16_t  t10   = (int16_t)(d[0] | (d[1] << 8));
  int8_t   sound = (int8_t)d[3];
  uint16_t beams = (uint16_t)(d[4] | (d[5] << 8));
  bool novoFw = (len >= 11);
  uint8_t est;
  uint16_t freq;

  portENTER_CRITICAL(&dataMux);
  HiveRt &h = rt[i];
  est  = novoFw ? d[7] : h.last;
  freq = novoFw ? (uint16_t)(d[9] | (d[10] << 8)) : h.freq;

  h.temp10 = t10;
  h.hum = d[2];
  h.beamCount = beams;
  if (sound > h.soundMax) h.soundMax = sound;
  if (est > h.worst) h.worst = est;
  if (est == 4 && h.last != 4) h.alarm = true;
  h.last = est;
  h.freq = freq;
  h.have = true;
  h.fails = 0;
  portEXIT_CRITICAL(&dataMux);

  Serial.printf("[BLE %d] T=%.1f C  H=%u %%  som=%d dBFS  beam=%u  estado=%u  %u Hz\n",
                i, t10 / 10.0f, d[2], sound, beams, est, freq);
}

// Ligacao continua
void fecharLigacao(int i) {
  if (!cli[i]) return;
  if (cli[i]->isConnected()) {
    cli[i]->disconnect();
    delay(100);
  }
  NimBLEDevice::deleteClient(cli[i]);
  cli[i] = nullptr;
}

bool ligarContinuo(int i) {
  fecharLigacao(i);

  NimBLEAddress addr(std::string(hiveIds[i].addr), hiveIds[i].type);
  NimBLEClient* c = NimBLEDevice::createClient();
  c->setConnectionParams(12, 12, 0, 400);   // timeout de supervisao 4 s (tolera sinal fraco)
  c->setConnectTimeout(5000);

  if (!c->connect(addr)) {
    Serial.printf("[BLE %d] falha ao ligar a %s (erro %d)\n", i, hiveIds[i].addr, c->getLastError());
    NimBLEDevice::deleteClient(c);
    return false;
  }

  NimBLERemoteService* svc = c->getService(SERVICE_UUID);
  NimBLERemoteCharacteristic* chr = svc ? svc->getCharacteristic(CHAR_UUID) : nullptr;
  bool ok = chr && chr->canNotify() &&
            chr->subscribe(true, [i](NimBLERemoteCharacteristic*, uint8_t* d, size_t len, bool) {
              processarPacote(i, d, len);
            });

  if (!ok) {
    Serial.printf("[BLE %d] servico/caracteristica invalidos\n", i);
    c->disconnect();
    delay(100);
    NimBLEDevice::deleteClient(c);
    return false;
  }

  cli[i] = c;
  Serial.printf("[BLE %d] ligado e subscrito (%s)\n", i, hiveIds[i].addr);
  return true;
}

void manterLigacoes() {
  if (!isContinuo() || modo != NORMAL) return;

  // Deteta ligacoes perdidas
  for (int i = 0; i < nHives; i++) {
    if (cli[i] && !cli[i]->isConnected()) {
      Serial.printf("[BLE %d] ligacao perdida, a religar\n", i);
      fecharLigacao(i);
      nextConnAt[i] = millis() + 1000;
    }
  }

  // Uma tentativa de ligacao por iteracao (para os botoes continuarem a responder)
  for (int i = 0; i < nHives; i++) {
    if (cli[i] || !due(nextConnAt[i])) continue;
    if (ligarContinuo(i)) {
      connFails[i] = 0;
    } else {
      if (connFails[i] < 5) connFails[i]++;
      nextConnAt[i] = millis() + (2000UL << connFails[i]);   // 4 s, 8 s ... ate 64 s
    }
    return;
  }
}

void aplicarModoLigacao() {            // chamar sempre que a lista muda
  if (!isContinuo()) {
    for (int i = 0; i < MAX_HIVES; i++) fecharLigacao(i);
  }
  for (int i = 0; i < MAX_HIVES; i++) { nextConnAt[i] = 0; connFails[i] = 0; }
  Serial.printf("[BLE] modo: %s\n", isContinuo() ? "ligacao continua" : "rotacao");
}

// Modo rotacao
bool lerUmaVez(int i) {
  NimBLEAddress addr(std::string(hiveIds[i].addr), hiveIds[i].type);

  NimBLEClient* c = NimBLEDevice::createClient();
  c->setConnectionParams(12, 12, 0, 400);
  c->setConnectTimeout(3000);

  bool ok = false;
  if (c->connect(addr)) {
    NimBLERemoteService* svc = c->getService(SERVICE_UUID);
    NimBLERemoteCharacteristic* chr = svc ? svc->getCharacteristic(CHAR_UUID) : nullptr;
    if (chr && chr->canRead()) {
      NimBLEAttValue v = chr->readValue();
      if (v.size() >= 7) {
        processarPacote(i, v.data(), v.size());
        ok = true;
      } else {
        Serial.printf("[BLE %d] ainda sem dados\n", i);
      }
    } else {
      Serial.printf("[BLE %d] servico/caracteristica invalidos\n", i);
    }
    c->disconnect();
    delay(100);
  } else {
    Serial.printf("[BLE %d] falha ao ligar a %s (erro %d)\n", i, hiveIds[i].addr, c->getLastError());
  }
  NimBLEDevice::deleteClient(c);

  if (!ok && rt[i].fails < 255) rt[i].fails++;
  return ok;
}

bool lerColmeia(int i) {              // ate 3 tentativas
  for (int tentativa = 1; tentativa <= 3; tentativa++) {
    if (lerUmaVez(i)) return true;
    if (tentativa < 3) delay(500);
  }
  return false;
}

void pollColmeias() {
  if (isContinuo() || nHives == 0 || !due(nextPollAt)) return;
  if (pollIdx >= nHives) pollIdx = 0;
  lerColmeia(pollIdx);
  pollIdx = (pollIdx + 1) % nHives;
  nextPollAt = millis() + POLL_STEP_MS;
}

// Lista de colmeias
bool inAllow(const char* a) {
  for (int i = 0; i < nHives; i++) if (strcmp(hiveIds[i].addr, a) == 0) return true;
  return false;
}

void saveHives() {
  hivesStore.putUChar("n", (uint8_t)nHives);
  hivesStore.putBytes("list", hiveIds, sizeof(HiveId) * nHives);
}

void loadHives() {
  int n = hivesStore.getUChar("n", 0);
  if (n > MAX_HIVES) n = 0;
  if (n > 0 && hivesStore.getBytesLength("list") == sizeof(HiveId) * n) {
    hivesStore.getBytes("list", hiveIds, sizeof(HiveId) * n);
    nHives = n;
  } else {
    nHives = 0;
  }
  for (int i = 0; i < MAX_HIVES; i++) resetRt(i);
  Serial.printf("[HIVES] %d colmeia(s) na lista\n", nHives);
  for (int i = 0; i < nHives; i++) Serial.printf("   %d: %s\n", i, hiveIds[i].addr);
}

void limparHives() {
  for (int i = 0; i < MAX_HIVES; i++) fecharLigacao(i);
  nHives = 0;
  hivesStore.clear();
  for (int i = 0; i < MAX_HIVES; i++) resetRt(i);
  Serial.println("[HIVES] Lista apagada");
}

// Scan
class ScanCB : public NimBLEScanCallbacks {
  void onResult(const NimBLEAdvertisedDevice* dev) override {
    if (modo != PROCURA || candFound) return;
    if (!dev->isAdvertisingService(NimBLEUUID(SERVICE_UUID))) return;
    seenRssi = dev->getRSSI();
    if (dev->getRSSI() < PAIR_RSSI_MIN) return;

    std::string a = dev->getAddress().toString();
    if (inAllow(a.c_str())) return;

    strncpy(candAddr, a.c_str(), sizeof(candAddr) - 1);
    candAddr[sizeof(candAddr) - 1] = 0;
    candType = dev->getAddress().getType();
    candRssi = dev->getRSSI();
    candFound = true;                 // o loop() trata do resto
  }
} scanCB;

void iniciarProcura() {
  if (nHives >= MAX_HIVES) {
    Serial.println("[PAIR] Lista cheia");
    piscar(5);
    return;
  }
  candFound = false;
  seenRssi = 0;
  modo = PROCURA;
  modoAte = millis() + PAIR_SCAN_MS;
  NimBLEScan* scan = NimBLEDevice::getScan();
  scan->stop();
  scan->clearResults();
  scan->start(PAIR_SCAN_MS, false, true);
  Serial.println("[PAIR] A procurar colmeia nova (60 s)...");
}

void terminarModo() {
  NimBLEDevice::getScan()->stop();
  modo = NORMAL;
  candFound = false;
  nextPollAt = 0;
}

void tratarBotoes() {
  // Os dois premidos 5 s: apaga a lista
  if (digitalRead(BTN_SCAN) == LOW && digitalRead(BTN_OK) == LOW) {
    if (!bothSince) bothSince = millis();
    else if (millis() - bothSince > 5000) {
      terminarModo();
      limparHives();
      aplicarModoLigacao();
      piscar(6);
      while (digitalRead(BTN_SCAN) == LOW || digitalRead(BTN_OK) == LOW) delay(10);
      scanLast = okLast = false;
      bothSince = 0;
      return;
    }
  } else {
    bothSince = 0;
  }

  if (edge(BTN_SCAN, scanLast, scanT)) {
    if (modo == NORMAL) {
      iniciarProcura();
    } else {
      Serial.println("[PAIR] Procura cancelada");
      terminarModo();
      piscar(2);
    }
  }

  if (edge(BTN_OK, okLast, okT) && modo == CANDIDATO) {
    if (nHives < MAX_HIVES && !inAllow(candAddr)) {
      strncpy(hiveIds[nHives].addr, candAddr, sizeof(hiveIds[nHives].addr) - 1);
      hiveIds[nHives].addr[sizeof(hiveIds[nHives].addr) - 1] = 0;
      hiveIds[nHives].type = candType;
      resetRt(nHives);
      nHives++;
      saveHives();
      aplicarModoLigacao();
      Serial.printf("[PAIR] Colmeia %s adicionada (%d no total)\n", candAddr, nHives);
      piscar(3);
    }
    terminarModo();
  }

  // Diagnostico: mostra o RSSI do C6 visto durante a procura
  static uint32_t lastSeenPrint = 0;
  if (modo == PROCURA && seenRssi != 0 && millis() - lastSeenPrint > 2000) {
    lastSeenPrint = millis();
    Serial.printf("[PAIR] C6 visto, RSSI %d (minimo %d)\n", (int)seenRssi, PAIR_RSSI_MIN);
  }

  // Encontrou candidato
  if (modo == PROCURA && candFound) {
    NimBLEDevice::getScan()->stop();
    modo = CANDIDATO;
    modoAte = millis() + PAIR_ACCEPT_MS;
    Serial.printf("[PAIR] Encontrado %s (RSSI %d). Carrega ACEITAR (30 s).\n", candAddr, candRssi);
  }

  // Tempo esgotado
  if (modo != NORMAL && (int32_t)(millis() - modoAte) >= 0) {
    Serial.println("[PAIR] Tempo esgotado");
    terminarModo();
  }
}

// LORAWAN: PERSISTENCIA 
void storePersistenceCb(uint8_t* buf, size_t len) {
  size_t n = store.putBytes("lw_persist", buf, len);
  Serial.printf("[LW] guardar persistencia: %u/%u bytes\n", (unsigned)n, (unsigned)len);
}

void restorePersistenceCb(uint8_t* buf, size_t len) {
  bool ok = store.isKey("lw_persist") && store.getBytesLength("lw_persist") == len;
  if (ok) store.getBytes("lw_persist", buf, len);
  Serial.printf("[LW] restaurar persistencia (%u bytes): %s\n", (unsigned)len, ok ? "encontrada" : "nao existe");
}

void storeSessionCb(uint8_t* buf, size_t len) {
  size_t n = store.putBytes("lw_session", buf, len);
  Serial.printf("[LW] guardar sessao: %u/%u bytes\n", (unsigned)n, (unsigned)len);
}

void restoreSessionCb(uint8_t* buf, size_t len) {
  bool ok = store.isKey("lw_session") && store.getBytesLength("lw_session") == len;
  if (ok) store.getBytes("lw_session", buf, len);
  Serial.printf("[LW] restaurar sessao (%u bytes): %s\n", (unsigned)len, ok ? "encontrada" : "nao existe");
}

uint32_t nextJoinAt = 0;
uint32_t nextUplinkAt = 0;
uint32_t ultimoUplinkAt = 0;

// SETUP
void setup() {
  Serial.begin(115200);
  delay(2000);

  pinMode(BTN_SCAN, INPUT_PULLUP);
  pinMode(BTN_OK, INPUT_PULLUP);
  pinMode(LED_PAIR, OUTPUT);
  ledSet(false);

  loraSPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_CS);

  radio.tcxoVoltage = RadioLibTCXOVoltage_t::Voltage1V8;

  ConfigLoRa_t cfg;
  cfg.frequency       = RADIOLIB_UNIT_MEGA(868);
  cfg.bandwidth       = RADIOLIB_UNIT_KILO(125);
  cfg.spreadingFactor = 9;
  cfg.codingRate      = 7;
  cfg.syncWord        = RADIOLIB_LORAWAN_LORA_SYNC_WORD;
  cfg.power           = 14;
  cfg.preambleLength  = 8;
  int16_t state = radio.begin(cfg);
  Serial.printf("radio.begin: %d\n", state);
  if (state != RADIOLIB_ERR_NONE) {
    Serial.println("Falha ao iniciar o radio. Verifica o encaixe do modulo.");
    while (true) delay(1000);
  }

  state = radio.setDio2AsRfSwitch(true);
  Serial.printf("setDio2AsRfSwitch: %d\n", state);
  radio.setRfSwitchPins(LORA_RXEN, RADIOLIB_NC);

  state = radio.setCurrentLimit(140);
  Serial.printf("setCurrentLimit: %d\n", state);

  store.begin("radiolib");
  hivesStore.begin("hives");
  loadHives();
  Serial.printf("[BLE] modo: %s\n", isContinuo() ? "ligacao continua" : "rotacao");

  node.setCallbackStorePersistence(storePersistenceCb);
  node.setCallbackRestorePersistence(restorePersistenceCb);
  node.setCallbackStoreSession(storeSessionCb);
  node.setCallbackRestoreSession(restoreSessionCb);

  state = node.beginOTAA(joinEUI, devEUI, nwkKey, appKey);
  Serial.printf("beginOTAA: %d\n", state);

  state = node.loadBuffers();
  Serial.printf("loadBuffers: %d\n", state);
  if (state != RADIOLIB_ERR_NONE) {
    Serial.println("[LW] Sessao invalida na flash, a limpar...");
    store.clear();   // so apaga a sessao LoRaWAN, a lista de colmeias esta noutro namespace
  }

  // BLE (cliente)
  NimBLEDevice::init("XIAO-S3-Gateway");
  NimBLEDevice::setPower(9);
  NimBLEScan* scan = NimBLEDevice::getScan();
  scan->setScanCallbacks(&scanCB, false);
  scan->setActiveScan(true);
  scan->setDuplicateFilter(0);     // reporta todos os anuncios (RSSI atualizado)
  scan->setInterval(160);
  scan->setWindow(80);
}

// LOOP
void loop() {
  tratarBotoes();
  atualizarLed();
  if (modo == NORMAL) {
    manterLigacoes();   // modo continuo
    pollColmeias();     // modo rotacao
  }

  // Join nao bloqueante
  if (!node.isActivated()) {
    if (!due(nextJoinAt)) { delay(20); return; }

    Serial.println("A tentar join...");
    int16_t state = node.activateOTAA();
    Serial.printf("activateOTAA: %d\n", state);

    if (!node.isActivated()) {
      Serial.printf("Join falhou, nova tentativa em %lu s\n", JOIN_RETRY_MS / 1000);
      nextJoinAt = millis() + JOIN_RETRY_MS;
      return;
    }
    Serial.println("Join bem-sucedido!");
  }

  bool alarmeAny = false;
  for (int i = 0; i < nHives; i++) if (rt[i].alarm) alarmeAny = true;
  bool alarme = alarmeAny && (ultimoUplinkAt == 0 || millis() - ultimoUplinkAt > ALARM_MIN_GAP_MS);

  if (!due(nextUplinkAt) && !alarme) { delay(20); return; }

  // Modo rotacao: antes de enviar, le as colmeias que ainda nao tem dados novos
  if (modo == NORMAL && !isContinuo()) {
    for (int i = 0; i < nHives; i++)
      if (!rt[i].have) lerColmeia(i);
  }

  // Copia consistente do estado (as notificacoes chegam noutra task)
  HiveRt snap[MAX_HIVES];
  portENTER_CRITICAL(&dataMux);
  memcpy(snap, rt, sizeof(rt));
  portEXIT_CRITICAL(&dataMux);

  // Junta todas as colmeias com dados num unico uplink
  uint8_t payload[MAX_HIVES * REC_SIZE];
  int len = 0;
  int enviadas = 0;

  for (int i = 0; i < nHives; i++) {
    HiveRt &h = snap[i];
    if (!h.have) continue;

    unsigned b3 = 0, b4 = 0, b5 = 0;
    sscanf(hiveIds[i].addr + 9, "%x:%x:%x", &b3, &b4, &b5);

    uint8_t *p = payload + len;
    p[0]  = h.temp10 & 0xFF;
    p[1]  = (h.temp10 >> 8) & 0xFF;
    p[2]  = h.hum;
    p[3]  = (uint8_t)h.soundMax;
    p[4]  = h.beamCount & 0xFF;
    p[5]  = (h.beamCount >> 8) & 0xFF;
    p[6]  = (h.worst & 0x0F) | ((h.last & 0x0F) << 4);
    p[7]  = (uint8_t)min(255, (int)(h.freq / 4));
    p[8]  = (uint8_t)b3;     // ID da colmeia = ultimos 3 bytes do MAC BLE
    p[9]  = (uint8_t)b4;
    p[10] = (uint8_t)b5;
    len += REC_SIZE;
    enviadas++;
  }

  if (len == 0) {
    Serial.println("Sem dados BLE novos, uplink adiado");
    nextUplinkAt = millis() + NODATA_RETRY_MS;
    return;
  }

  int16_t state = node.sendReceive(payload, len);
  Serial.printf("sendReceive: %d (%d colmeia(s), %d bytes)%s\n",
                state, enviadas, len, alarme ? " [ALARME]" : "");

  portENTER_CRITICAL(&dataMux);
  for (int i = 0; i < nHives; i++) {
    rt[i].soundMax = -128;
    rt[i].worst = rt[i].last;
    rt[i].alarm = false;
    rt[i].have = false;
  }
  portEXIT_CRITICAL(&dataMux);

  ultimoUplinkAt = millis();
  if (ultimoUplinkAt == 0) ultimoUplinkAt = 1;
  nextUplinkAt = millis() + UPLINK_INTERVAL_MS;
}
