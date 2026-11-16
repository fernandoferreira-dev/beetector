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

const uint32_t UPLINK_INTERVAL_MS = 900000;  // 15 min
const uint32_t ALARM_MIN_GAP_MS   = 300000;  // mínimo 5 min entre uplinks de alarme
const uint32_t JOIN_RETRY_MS      = 30000;   // 30 s
const uint32_t NODATA_RETRY_MS    = 30000;   // 30 s (sem dados BLE)

// BLE
#define SERVICE_UUID "7a1c0001-5b1e-4f3a-9d2e-3c6b8f0a1d10"
#define CHAR_UUID    "7a1c0002-5b1e-4f3a-9d2e-3c6b8f0a1d10"

struct SensorData {
  int16_t  temp10;
  uint8_t  hum;
  uint16_t beamCount;
};

portMUX_TYPE dataMux = portMUX_INITIALIZER_UNLOCKED;
SensorData latest = {0x7FFF, 0xFF, 0};
int8_t soundMax = -128;
bool haveData = false;

uint8_t  estadoWorst = 0;
uint8_t  estadoUlt   = 0;
uint16_t freqUlt     = 0;
volatile bool alarmePendente = false;
uint32_t ultimoUplinkAt = 0;

NimBLEClient* bleClient = nullptr;
NimBLEAddress targetAddr;
volatile bool foundTarget = false;

class ClientCB : public NimBLEClientCallbacks {
  void onConnect(NimBLEClient* pClient) override {
    Serial.println("Cliente ligado ao servidor");
  }
  void onDisconnect(NimBLEClient* pClient, int reason) override {
    Serial.printf("Desligado do sensor (motivo %d)\n", reason);
  }
} clientCB;

void notifyCB(NimBLERemoteCharacteristic* chr, uint8_t* d, size_t len, bool isNotify) {
  if (len < 7) return;
  int16_t t10 = (int16_t)(d[0] | (d[1] << 8));
  int8_t sound = (int8_t)d[3];
  uint16_t beams = (uint16_t)(d[4] | (d[5] << 8));

  bool novoFw = (len >= 11);
  uint8_t est = 0;
  uint16_t freq = 0;

  portENTER_CRITICAL(&dataMux);
  est  = novoFw ? d[7] : estadoUlt;
  freq = novoFw ? (uint16_t)(d[9] | (d[10] << 8)) : freqUlt;

  latest.temp10 = t10;
  latest.hum = d[2];
  latest.beamCount = beams;
  if (sound > soundMax) soundMax = sound;
  if (est > estadoWorst) estadoWorst = est;
  if (est == 4 && estadoUlt != 4) alarmePendente = true;
  estadoUlt = est;
  freqUlt = freq;
  haveData = true;
  portEXIT_CRITICAL(&dataMux);

  Serial.printf("T=%.1f C  H=%u %%  som=%d dBFS  beam=%u  estado=%u  %u Hz\n",
                t10 / 10.0f, d[2], sound, beams, est, freq);
}

class ScanCB : public NimBLEScanCallbacks {
  void onResult(const NimBLEAdvertisedDevice* dev) override {
    if (dev->isAdvertisingService(NimBLEUUID(SERVICE_UUID))) {
      Serial.printf("Sensor encontrado: %s (RSSI %d)\n",
                    dev->getAddress().toString().c_str(), dev->getRSSI());
      targetAddr = dev->getAddress();
      foundTarget = true;
      NimBLEDevice::getScan()->stop();
    }
  }
} scanCB;

bool connectToSensor() {
  NimBLEScan* scan = NimBLEDevice::getScan();
  if (scan->isScanning()) {
    scan->stop();
  }
  delay(200); // Dar tempo ao controlador BLE para estabilizar após parar o scan

  if (bleClient != nullptr) {
    NimBLEDevice::deleteClient(bleClient);
    bleClient = nullptr;
  }

  bleClient = NimBLEDevice::createClient();
  bleClient->setClientCallbacks(&clientCB, false);
  bleClient->setConnectionParams(12, 12, 0, 150);
  bleClient->setConnectTimeout(10000);

  if (!bleClient->connect(targetAddr)) {
    int err = bleClient->getLastError();
    Serial.printf("[BLE] Falha ao ligar ao sensor (erro %d)\n", err);
    NimBLEDevice::deleteClient(bleClient);
    bleClient = nullptr;
    delay(500);
    return false;
  }

  NimBLERemoteService* svc = bleClient->getService(SERVICE_UUID);
  NimBLERemoteCharacteristic* chr = svc ? svc->getCharacteristic(CHAR_UUID) : nullptr;
  if (!chr || !chr->canNotify() || !chr->subscribe(true, notifyCB)) {
    Serial.println("Serviço/característica inválidos");
    bleClient->disconnect();
    NimBLEDevice::deleteClient(bleClient);
    bleClient = nullptr;
    return false;
  }

  Serial.println("Ligado e subscrito às notificações");
  return true;
}

void bleTask() {
  if (bleClient && bleClient->isConnected()) return;

  if (foundTarget) {
    foundTarget = false;
    connectToSensor();
    return;
  }

  NimBLEScan* scan = NimBLEDevice::getScan();
  if (!scan->isScanning()) {
    Serial.println("A procurar o sensor...");
    scan->start(5000, false, true); // Scan de 5 s em vez de infinito (0)
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

  radio.tcxoVoltage = RadioLibTCXOVoltage_t::Voltage1V8;

  ConfigLoRa_t cfg;
  cfg.frequency       = RADIOLIB_UNIT_MEGA(868);
  cfg.bandwidth       = RADIOLIB_UNIT_KILO(125);
  cfg.spreadingFactor = 9;
  cfg.codingRate      = 7;
  cfg.syncWord        = RADIOLIB_LORAWAN_LORA_SYNC_WORD;
  cfg.power           = 14; // Aumentado para 14 dBm (máximo permitido em EU868)
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
    store.clear();
  }

  // BLE (cliente)
  NimBLEDevice::init("XIAO-S3-Gateway");
  NimBLEDevice::setPower(9);
  NimBLEScan* scan = NimBLEDevice::getScan();
  scan->setScanCallbacks(&scanCB, false);
  scan->setActiveScan(true);
  scan->setInterval(160);
  scan->setWindow(80);
}

void loop() {
  bleTask();

  // Join não bloqueante
  if (!node.isActivated()) {
    if (!due(nextJoinAt)) { delay(50); return; }

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

  bool alarme = alarmePendente && (millis() - ultimoUplinkAt > ALARM_MIN_GAP_MS);
  if (!due(nextUplinkAt) && !alarme) { delay(50); return; }

  SensorData snap;
  int8_t sMax;
  bool have;
  uint8_t worst, ult;
  uint16_t freq;
  portENTER_CRITICAL(&dataMux);
  snap = latest;
  sMax = soundMax;
  have = haveData;
  worst = estadoWorst;
  ult = estadoUlt;
  freq = freqUlt;
  portEXIT_CRITICAL(&dataMux);

  if (!have) {
    Serial.println("Sem dados BLE novos, uplink adiado");
    nextUplinkAt = millis() + NODATA_RETRY_MS;
    return;
  }

  uint8_t payload[8];
  payload[0] = snap.temp10 & 0xFF;
  payload[1] = (snap.temp10 >> 8) & 0xFF;
  payload[2] = snap.hum;
  payload[3] = (uint8_t)sMax;
  payload[4] = snap.beamCount & 0xFF;
  payload[5] = (snap.beamCount >> 8) & 0xFF;
  payload[6] = (worst & 0x0F) | ((ult & 0x0F) << 4);
  payload[7] = (uint8_t)min(255, (int)(freq / 4));

  int16_t state = node.sendReceive(payload, sizeof(payload));
  Serial.printf("sendReceive: %d (pior=%u, ultimo=%u, %u Hz)%s\n",
                state, worst, ult, freq, alarme ? " [ALARME]" : "");

  portENTER_CRITICAL(&dataMux);
  soundMax = -128;
  estadoWorst = estadoUlt;
  alarmePendente = false;
  haveData = false;
  portEXIT_CRITICAL(&dataMux);

  ultimoUplinkAt = millis();
  nextUplinkAt = millis() + UPLINK_INTERVAL_MS;
}