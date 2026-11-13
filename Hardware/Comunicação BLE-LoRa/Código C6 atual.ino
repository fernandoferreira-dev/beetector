#include <DHT.h>
#include <ESP_I2S.h>
#include <NimBLEDevice.h>

// Pinos
#define DHT_PIN   D1    // GPIO1  pino Sinal do KS0034
#define BEAM_PIN  D2    // GPIO2  fio amarelo do recetor breakbeam
#define I2S_SCK   D8    // GPIO19
#define I2S_WS    D9    // GPIO20
#define I2S_SD    D10   // GPIO18

// BLE 
#define SERVICE_UUID "7a1c0001-5b1e-4f3a-9d2e-3c6b8f0a1d10"
#define CHAR_UUID    "7a1c0002-5b1e-4f3a-9d2e-3c6b8f0a1d10"
#define BLE_NAME     "XIAO-C6-Sensores"

DHT dht(DHT_PIN, DHT11);
I2SClass i2s;
NimBLECharacteristic* dataChar = nullptr;

// Estado
bool beamBroken = false;
uint16_t beamCount = 0;
unsigned long lastSend = 0;
float micDbPeak = -120.0;

const int NUM_SAMPLES = 256;
int32_t samples[NUM_SAMPLES];

class ServerCB : public NimBLEServerCallbacks {
  void onConnect(NimBLEServer* s, NimBLEConnInfo& info) override {
    Serial.println("Gateway ligado");
  }
  void onDisconnect(NimBLEServer* s, NimBLEConnInfo& info, int reason) override {
    Serial.printf("Gateway desligado (motivo %d), a anunciar de novo\n", reason);
  }
};

float lerMicDbfs() {
  size_t bytes = i2s.readBytes((char *)samples, sizeof(samples));
  int n = bytes / sizeof(int32_t);
  if (n == 0) return -120.0;

  double soma = 0;
  for (int i = 0; i < n; i++) soma += (samples[i] >> 8);
  double media = soma / n;

  double energia = 0;
  for (int i = 0; i < n; i++) {
    double v = (samples[i] >> 8) - media;
    energia += v * v;
  }
  double rms = sqrt(energia / n);
  if (rms < 1) rms = 1;
  return 20.0 * log10(rms / 8388608.0);
}

void setup() {
  Serial.begin(115200);
  delay(1500);

  // Antena do C6
  pinMode(3, OUTPUT);
  digitalWrite(3, LOW);
  delay(100);
  pinMode(14, OUTPUT);
  digitalWrite(14, LOW);

  dht.begin();
  pinMode(BEAM_PIN, INPUT_PULLUP);

  i2s.setPins(I2S_SCK, I2S_WS, -1, I2S_SD);
  if (!i2s.begin(I2S_MODE_STD, 16000, I2S_DATA_BIT_WIDTH_32BIT,
                 I2S_SLOT_MODE_MONO, I2S_STD_SLOT_LEFT)) {
    Serial.println("ERRO: falha ao iniciar I2S");
  }

  // BLE
  NimBLEDevice::init(BLE_NAME);
  NimBLEServer* server = NimBLEDevice::createServer();
  server->setCallbacks(new ServerCB());
  server->advertiseOnDisconnect(true);

  NimBLEService* svc = server->createService(SERVICE_UUID);
  dataChar = svc->createCharacteristic(CHAR_UUID,
                                       NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY);
  svc->start();

  NimBLEAdvertising* adv = NimBLEDevice::getAdvertising();
  adv->addServiceUUID(SERVICE_UUID);
  adv->enableScanResponse(true);
  adv->start();
  Serial.println("A anunciar...");
}

void loop() {
  // Breakbeam
  bool broken = (digitalRead(BEAM_PIN) == LOW);
  if (broken != beamBroken) {
    beamBroken = broken;
    if (beamBroken) {
      beamCount++;
      Serial.printf("Feixe INTERROMPIDO (total: %u)\n", beamCount);
    } else {
      Serial.println("Feixe restabelecido");
    }
  }

  // Microfone
  float db = lerMicDbfs();
  if (db > micDbPeak) micDbPeak = db;

  // A cada 2s lê 
  if (millis() - lastSend >= 2000) {
    lastSend = millis();
    float h = dht.readHumidity();
    float t = dht.readTemperature();

    int16_t t10 = isnan(t) ? 0x7FFF : (int16_t)lroundf(t * 10.0f);
    uint8_t hum = isnan(h) ? 0xFF : (uint8_t)lroundf(h);
    int8_t sound = (int8_t)constrain((int)lroundf(micDbPeak), -120, 0);

    uint8_t pkt[7];
    pkt[0] = t10 & 0xFF;
    pkt[1] = (t10 >> 8) & 0xFF;
    pkt[2] = hum;
    pkt[3] = (uint8_t)sound;
    pkt[4] = beamCount & 0xFF;
    pkt[5] = (beamCount >> 8) & 0xFF;
    pkt[6] = beamBroken ? 1 : 0;

    dataChar->setValue(pkt, sizeof(pkt));
    dataChar->notify();
    // notify()
    bool ligado = NimBLEDevice::getServer()->getConnectedCount() > 0;

    Serial.println("----------------------------");
    if (isnan(h) || isnan(t)) Serial.println("DHT11: erro de leitura");
    else Serial.printf("Temperatura: %.1f C | Humidade: %.0f %%\n", t, h);
    Serial.printf("Som (pico): %d dBFS\n", sound);
    Serial.printf("Breakbeam: %s | Interrupções: %u\n",
                  beamBroken ? "INTERROMPIDO" : "livre", beamCount);
    Serial.printf("BLE: %s\n", ligado ? "gateway ligado, dados enviados" : "a espera do gateway (não conectado)");

    micDbPeak = -120.0;
  }
}
