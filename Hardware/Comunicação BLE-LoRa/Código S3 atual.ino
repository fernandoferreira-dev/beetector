#include <RadioLib.h>
#include <SPI.h>
#include <Preferences.h>
#include <NimBLEDevice.h>

#define LORA_SCK    7
#define LORA_MISO   8
#define LORA_MOSI   9
#define LORA_CS     41   // NSS
#define LORA_RST    42
#define LORA_DIO1   39
#define LORA_BUSY   40
#define LORA_RXEN   38   // RF-SW

SPIClass loraSPI(FSPI);
SX1262 radio = new Module(LORA_CS, LORA_DIO1, LORA_RST, LORA_BUSY, loraSPI);

const LoRaWANBand_t region = EU868;
LoRaWANNode node(&radio, &region);

Preferences store;

// Credenciais TTN
uint64_t joinEUI = 0x0000000000000000;
uint64_t devEUI  = 0x70B3D57ED0079CA6;

uint8_t appKey[] = { 0x3D, 0xD6, 0x96, 0x4A, 0x3B, 0x9D, 0x5F, 0x96,
                     0x7F, 0xE9, 0x27, 0x54, 0x87, 0x16, 0xA1, 0x09 };
uint8_t nwkKey[] = { 0x3D, 0xD6, 0x96, 0x4A, 0x3B, 0x9D, 0x5F, 0x96,
                     0x7F, 0xE9, 0x27, 0x54, 0x87, 0x16, 0xA1, 0x09 };

const uint32_t UPLINK_INTERVAL_MS = 600000;  // 10 min
const uint32_t JOIN_RETRY_MS      = 30000;   // 30 s
const uint32_t NODATA_RETRY_MS    = 30000;   // 30 s (sem dados BLE)

// ---------- BLE ----------
#define SERVICE_UUID "7a1c0001-5b1e-4f3a-9d2e-3c6b8f0a1d10"
#define CHAR_UUID    "7a1c0002-5b1e-4f3a-9d2e-3c6b8f0a1d10"

struct SensorData {
  int16_t  temp10;
  uint8_t  hum;
  uint16_t beamCount;
};

portMUX_TYPE dataMux = portMUX_INITIALIZER_UNLOCKED;
SensorData latest = {0x7FFF, 0xFF, 0};
int8_t soundMax = -128;      // pico de som desde o último uplink
bool haveData = false;       // chegaram dados novos desde o último uplink?

NimBLEClient* bleClient = nullptr;
NimBLEAddress targetAddr;
volatile bool foundTarget = false;

// Chamada sempre que o C6 envia uma notificação
void notifyCB(NimBLERemoteCharacteristic* chr, uint8_t* d, size_t len, bool isNotify) {
  if (len < 7) return;
  int16_t t10 = (int16_t)(d[0] | (d[1] << 8));
  int8_t sound = (int8_t)d[3];
  uint16_t beams = (uint16_t)(d[4] | (d[5] << 8));

  portENTER_CRITICAL(&dataMux);
  latest.temp10 = t10;
  latest.hum = d[2];
  latest.beamCount = beams;
  if (sound > soundMax) soundMax = sound;
  haveData = true;
  portEXIT_CRITICAL(&dataMux);

  Serial.printf("[BLE] T=%.1f C  H=%u %%  som=%d dBFS  beam=%u\n",
                t10 / 10.0f, d[2], sound, beams);
}

class ScanCB : public NimBLEScanCallbacks {
  void onResult(const NimBLEAdvertisedDevice* dev) override {
    if (dev->isAdvertisingService(NimBLEUUID(SERVICE_UUID))) {
      Serial.printf("[BLE] Sensor encontrado: %s\n", dev->getAddress().toString().c_str());
      targetAddr = dev->getAddress();
      foundTarget = true;
      NimBLEDevice::getScan()->stop();
    }
  }
} scanCB;

bool connectToSensor() {
  if (!bleClient) {
    bleClient = NimBLEDevice::createClient();
    bleClient->setConnectTimeout(10000);  // ms
    // Ligação mais tolerante a falhas de rádio: intervalo 30-60 ms, sem latência,
    // timeout de supervisão de 4 s (unidades: 1.25 ms, 1.25 ms, eventos, 10 ms)
    bleClient->setConnectionParams(24, 48, 0, 400);
  }
  // Espera que o scan pare por completo antes de ligar
  NimBLEScan* scan = NimBLEDevice::getScan();
  for (int i = 0; i < 100 && scan->isScanning(); i++) delay(10);
  delay(100);

  // connect(endereço, deleteAttributes=true, asyncConnect=false, exchangeMTU=false)
  // No NimBLE 2.x a troca de MTU logo no início pode impedir a ligação em alguns
  // ESP32-S3. Os nossos 7 bytes cabem no MTU por defeito (23), não precisa de troca.
  if (!bleClient->connect(targetAddr, true, false, false)) {
    int err = bleClient->getLastError();
    Serial.printf("[BLE] Falha ao ligar ao sensor (erro %d: %s)\n",
                  err, NimBLEUtils::returnCodeToString(err));
    return false;
  }
  NimBLERemoteService* svc = bleClient->getService(SERVICE_UUID);
  NimBLERemoteCharacteristic* chr = svc ? svc->getCharacteristic(CHAR_UUID) : nullptr;
  if (!chr || !chr->canNotify() || !chr->subscribe(true, notifyCB)) {
    Serial.println("[BLE] Serviço/característica inválidos");
    bleClient->disconnect();
    return false;
  }
  Serial.println("[BLE] Ligado e subscrito às notificações");
  return true;
}

// Mantém a ligação BLE: procura o C6 e volta a ligar se cair
void bleTask() {
  if (bleClient && bleClient->isConnected()) return;

  if (foundTarget) {
    foundTarget = false;
    connectToSensor();
    return;
  }
  NimBLEScan* scan = NimBLEDevice::getScan();
  if (!scan->isScanning()) {
    Serial.println("[BLE] A procurar o sensor...");
    scan->start(0, false, true);  // 0 = até encontrar
  }
}

// LoRaWAN
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

bool due(uint32_t t) { return (int32_t)(millis() - t) >= 0; }

void setup() {
  Serial.begin(115200);
  delay(2000);

  loraSPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_CS);

  // RadioLib 8.x: TCXO de 1.8 V definido ANTES do begin(), para a calibração
  // usar o TCXO ativo; os restantes parâmetros vão numa struct ConfigLoRa_t
  radio.tcxoVoltage = RadioLibTCXOVoltage_t::Voltage1V8;

  ConfigLoRa_t cfg;
  cfg.frequency       = RADIOLIB_UNIT_MEGA(868);
  cfg.bandwidth       = RADIOLIB_UNIT_KILO(125);
  cfg.spreadingFactor = 9;
  cfg.codingRate      = 7;
  cfg.syncWord        = RADIOLIB_LORAWAN_LORA_SYNC_WORD;
  cfg.power           = 10;
  cfg.preambleLength  = 8;
  int16_t state = radio.begin(cfg);
  Serial.printf("radio.begin: %d\n", state);
  if (state != RADIOLIB_ERR_NONE) {
    Serial.println("Falha ao iniciar o radio. Verifica o encaixe do modulo.");
    while (true) delay(1000);
  }

  // RF switch: DIO2 controla o TX, RXEN (GPIO38) controla o RX
  state = radio.setDio2AsRfSwitch(true);
  Serial.printf("setDio2AsRfSwitch: %d\n", state);
  radio.setRfSwitchPins(LORA_RXEN, RADIOLIB_NC);

  // Limite de corrente do PA
  state = radio.setCurrentLimit(140);
  Serial.printf("setCurrentLimit: %d\n", state);

  // Flash e callbacks de persistência (RadioLib 8.x)
  // Têm de estar prontos antes de a biblioteca precisar deles
  store.begin("radiolib");
  node.setCallbackStorePersistence(storePersistenceCb);
  node.setCallbackRestorePersistence(restorePersistenceCb);
  node.setCallbackStoreSession(storeSessionCb);
  node.setCallbackRestoreSession(restoreSessionCb);

  // Configura o node OTAA
  state = node.beginOTAA(joinEUI, devEUI, nwkKey, appKey);
  Serial.printf("beginOTAA: %d\n", state);

  // Restaura nonces + sessão guardados na flash (chama os callbacks acima)
  state = node.loadBuffers();
  Serial.printf("loadBuffers: %d\n", state);

  // BLE (cliente)
  NimBLEDevice::init("XIAO-S3-Gateway");
  NimBLEScan* scan = NimBLEDevice::getScan();
  scan->setScanCallbacks(&scanCB, false);
  scan->setActiveScan(true);
  scan->setInterval(100);
  scan->setWindow(80);
}

void loop() {
  bleTask();

  // Join não bloqueante
  if (!node.isActivated()) {
    if (!due(nextJoinAt)) { delay(100); return; }

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

  // Uplink periódico
  if (!due(nextUplinkAt)) { delay(100); return; }

  SensorData snap;
  int8_t sMax;
  bool have;
  portENTER_CRITICAL(&dataMux);
  snap = latest;
  sMax = soundMax;
  have = haveData;
  portEXIT_CRITICAL(&dataMux);

  if (!have) {
    Serial.println("Sem dados BLE novos, uplink adiado");
    nextUplinkAt = millis() + NODATA_RETRY_MS;
    return;
  }

  uint8_t payload[6];
  payload[0] = snap.temp10 & 0xFF;
  payload[1] = (snap.temp10 >> 8) & 0xFF;
  payload[2] = snap.hum;
  payload[3] = (uint8_t)sMax;
  payload[4] = snap.beamCount & 0xFF;
  payload[5] = (snap.beamCount >> 8) & 0xFF;

  int16_t state = node.sendReceive(payload, sizeof(payload));
  Serial.printf("sendReceive: %d\n", state);

  // Novo intervalo
  portENTER_CRITICAL(&dataMux);
  soundMax = -128;
  haveData = false;
  portEXIT_CRITICAL(&dataMux);

  nextUplinkAt = millis() + UPLINK_INTERVAL_MS;
}
