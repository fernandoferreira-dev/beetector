#include <DHT.h>
#include <ESP_I2S.h>
#include <NimBLEDevice.h>
#include <math.h>

// Pinos
#define DHT_PIN D1   // GPIO1  Sinal do KS0034
#define BEAM_PIN D2  // GPIO2  fio amarelo do recetor breakbeam
#define I2S_SCK D8
#define I2S_WS D9
#define I2S_SD D10

#define LED_R1 D0  // LED Vermelho
#define LED_G1 D3  // LED Verde
#define LED_R2 D4  // LED Vermelho
#define LED_G2 D5  // LED Verde

// BLE
#define SERVICE_UUID "7a1c0001-5b1e-4f3a-9d2e-3c6b8f0a1d10"
#define CHAR_UUID "7a1c0002-5b1e-4f3a-9d2e-3c6b8f0a1d10"
#define BLE_NAME "XIAO-C6-Sensores"

const float LIM_SILENCIO = -65.0;     // dBFS abaixo disto = sem sinal
const float DELTA_ATIVA = 8.0;        // dB acima da base = atividade
const float DELTA_ALARME = 15.0;      // dB acima da base, sustentado (~1 s)
const float DELTA_ALARME_ALTA = 8.0;  // idem, com muita energia aguda
const float LIM_ALTA = 0.35;          // fração de energia em 700-2000 Hz
const float FREQ_SEM_RAINHA = 350.0;  // Hz: zumbido dominante acima disto

DHT dht(DHT_PIN, DHT11);
I2SClass i2s;
NimBLECharacteristic* dataChar = nullptr;

// Áudio
const int FS = 16000;
const int N = 1024;  // 64 ms por bloco
int32_t samples[N];
float x[N];
float janela[N];

enum Estado { SEM_SINAL,
              CALMA,
              ATIVA,
              SEM_RAINHA,
              ALARME };
const char* nomes[] = { "SEM_SINAL", "CALMA", "ATIVA", "SEM_RAINHA?", "ALARME" };

struct Features {
  float nivel;
  float freqDom;
  float rAlta;
};

float nivelRapido = -100, nivelLento = -100, nivelBase = -100;
float freqS = 0, rAltaS = 0;
int aquecimento = 0;

Estado estadoAtual = SEM_SINAL, candidato = SEM_SINAL;
int contador = 0;

// ----- Breakbeam (interrupção) -----
volatile uint16_t beamCount = 0;
volatile uint32_t ultimoBeamUs = 0;

void IRAM_ATTR isrBeam() {
  uint32_t t = micros();
  if (t - ultimoBeamUs > 3000) {  // filtro anti-ruído de 3 ms
    beamCount++;
    ultimoBeamUs = t;
  }
}

// Envio e leitura DHT
unsigned long lastSend = 0;
unsigned long lastDhtRead = 0;
unsigned long lastLedUpdate = 0;  // Controlo de tempo para os LEDs
float ultimaTemp = NAN;
float ultimaHum = NAN;
float micDbPeak = -120.0;

class ServerCB : public NimBLEServerCallbacks {
  void onConnect(NimBLEServer* s, NimBLEConnInfo& info) override {
    Serial.println("Gateway ligado");
  }
  void onDisconnect(NimBLEServer* s, NimBLEConnInfo& info, int reason) override {
    Serial.printf("Gateway desligado (motivo %d), a anunciar de novo\n", reason);
  }
};

// Potência na frequência f (algoritmo de Goertzel)
float goertzel(float f) {
  float c = 2.0f * cosf(2.0f * PI * f / FS);
  float s1 = 0, s2 = 0;
  for (int i = 0; i < N; i++) {
    float s0 = x[i] + c * s1 - s2;
    s2 = s1;
    s1 = s0;
  }
  return (s1 * s1 + s2 * s2 - c * s1 * s2) / ((float)N * N);
}

bool analisar(Features& f) {
  size_t bytes = i2s.readBytes((char*)samples, sizeof(samples));
  if (bytes / sizeof(int32_t) < (size_t)N) return false;

  double soma = 0;
  for (int i = 0; i < N; i++) soma += (samples[i] >> 8);
  float media = soma / N;

  double energia = 0;
  for (int i = 0; i < N; i++) {
    float v = (samples[i] >> 8) - media;
    energia += (double)v * v;
    x[i] = v * janela[i];
  }
  float rms = sqrt(energia / N);
  if (rms < 1) rms = 1;
  f.nivel = 20.0f * log10f(rms / 8388608.0f);

  // Banda do zumbido (100-600 Hz)
  float pBaixa = 0, pMax = 0, fMax = 0;
  for (float fr = 100; fr <= 600; fr += 25) {
    float p = goertzel(fr);
    pBaixa += p;
    if (p > pMax) {
      pMax = p;
      fMax = fr;
    }
  }
  // Banda aguda (700-2000 Hz)
  float pAlta = 0;
  for (float fr = 700; fr <= 2000; fr += 100) pAlta += goertzel(fr);

  f.freqDom = fMax;
  f.rAlta = pAlta / (pAlta + pBaixa + 1e-12f);
  return true;
}

Estado classificar() {
  if (nivelLento < LIM_SILENCIO) return SEM_SINAL;
  float acima = nivelLento - nivelBase;
  if (acima > DELTA_ALARME || (rAltaS > LIM_ALTA && acima > DELTA_ALARME_ALTA)) return ALARME;
  if (acima > DELTA_ATIVA && freqS >= FREQ_SEM_RAINHA) return SEM_RAINHA;
  if (acima > DELTA_ATIVA) return ATIVA;
  return CALMA;
}

// Otimização: Executado de forma não-bloqueante a cada 30 ms
void atualizarLeds(Estado e) {
  unsigned long t = millis();
  if (t - lastLedUpdate < 30) return;  // Limita a ~33 atualizações por segundo
  lastLedUpdate = t;

  bool r1 = false, g1 = false, r2 = false, g2 = false;
  switch (e) {
    case SEM_SINAL: g2 = (t % 3000) < 80; break;
    case CALMA:
      g1 = true;
      g2 = true;
      break;
    case ATIVA:
      g1 = true;
      g2 = (t % 1000) < 500;
      break;
    case SEM_RAINHA: r1 = r2 = (t % 1000) < 500; break;
    case ALARME:
      r1 = (t % 250) < 125;
      r2 = !r1;
      break;
  }
  digitalWrite(LED_R1, r1);
  digitalWrite(LED_G1, g1);
  digitalWrite(LED_R2, r2);
  digitalWrite(LED_G2, g2);
}

void processarAudio() {
  Features f;
  if (!analisar(f)) return;

  if (f.nivel > micDbPeak) micDbPeak = f.nivel;

  if (aquecimento < 30) {  // ignora ~2 s iniciais (estalido do I2S)
    aquecimento++;
    nivelRapido = nivelLento = nivelBase = f.nivel;
    freqS = f.freqDom;
    rAltaS = f.rAlta;
    return;
  }

  nivelRapido += 0.30f * (f.nivel - nivelRapido);
  nivelLento += 0.05f * (f.nivel - nivelLento);
  freqS += 0.05f * (f.freqDom - freqS);  // Correção do operador em falta
  rAltaS += 0.05f * (f.rAlta - rAltaS);

  Estado novo = classificar();

  // Base: desce depressa, sobe devagar (mais devagar ainda em alarme)
  float k = (f.nivel < nivelBase) ? 0.02f
                                  : (estadoAtual == ALARME ? 0.0001f : 0.0005f);
  nivelBase += k * (f.nivel - nivelBase);  // Correção do operador em falta

  // Histerese
  if (novo == estadoAtual) {
    contador = 0;
  } else {
    if (novo != candidato) {
      candidato = novo;
      contador = 0;
    }
    contador++;
    int necessario = (novo == ALARME) ? 8 : 40;
    if (contador >= necessario) {
      estadoAtual = novo;
      contador = 0;
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(1500);

  // Antena externa/RF switch do XIAO ESP32-C6
  pinMode(3, OUTPUT);
  digitalWrite(3, LOW);
  delay(100);
  pinMode(14, OUTPUT);
  digitalWrite(14, LOW);

  // LEDs
  pinMode(LED_R1, OUTPUT);
  pinMode(LED_G1, OUTPUT);
  pinMode(LED_R2, OUTPUT);
  pinMode(LED_G2, OUTPUT);

  // Sensores
  dht.begin();
  pinMode(BEAM_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(BEAM_PIN), isrBeam, FALLING);

  for (int i = 0; i < N; i++)  // janela de Hann
    janela[i] = 0.5f * (1.0f - cosf(2.0f * PI * i / (N - 1)));

  i2s.setPins(I2S_SCK, I2S_WS, -1, I2S_SD);
  if (!i2s.begin(I2S_MODE_STD, FS, I2S_DATA_BIT_WIDTH_32BIT,
                 I2S_SLOT_MODE_MONO, I2S_STD_SLOT_LEFT)) {
    Serial.println("ERRO: falha ao iniciar I2S");
  }

  // BLE
  NimBLEDevice::init(BLE_NAME);
  NimBLEDevice::setPower(9);
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
  adv->setMinInterval(32);
  adv->setMaxInterval(48);
  adv->start();
  Serial.println("A anunciar...");
}

void loop() {
  processarAudio();
  atualizarLeds(estadoAtual);

  // Lê o DHT11 apenas a cada 15 s para não bloquear o buffer I2S com frequência
  if (millis() - lastDhtRead >= 15000 || lastDhtRead == 0) {
    lastDhtRead = millis();
    ultimaHum = dht.readHumidity();
    ultimaTemp = dht.readTemperature();
  }

  // A cada 2 s envia pacote BLE
  if (millis() - lastSend >= 2000) {
    lastSend = millis();

    noInterrupts();
    uint16_t contagem = beamCount;
    interrupts();

    bool beamBroken = (digitalRead(BEAM_PIN) == LOW);

    int16_t t10 = isnan(ultimaTemp) ? 0x7FFF : (int16_t)lroundf(ultimaTemp * 10.0f);
    uint8_t hum = isnan(ultimaHum) ? 0xFF : (uint8_t)lroundf(ultimaHum);
    int8_t sound = (int8_t)constrain((int)lroundf(micDbPeak), -120, 0);
    int8_t nivelL = (int8_t)constrain((int)lroundf(nivelLento), -120, 0);
    uint16_t freq = (uint16_t)lroundf(freqS);

    uint8_t pkt[11];
    pkt[0] = t10 & 0xFF;
    pkt[1] = (t10 >> 8) & 0xFF;
    pkt[2] = hum;
    pkt[3] = (uint8_t)sound;
    pkt[4] = contagem & 0xFF;
    pkt[5] = (contagem >> 8) & 0xFF;
    pkt[6] = beamBroken ? 1 : 0;
    pkt[7] = (uint8_t)estadoAtual;
    pkt[8] = (uint8_t)nivelL;
    pkt[9] = freq & 0xFF;
    pkt[10] = (freq >> 8) & 0xFF;

    dataChar->setValue(pkt, sizeof(pkt));
    dataChar->notify();
    bool ligado = NimBLEDevice::getServer()->getConnectedCount() > 0;

    Serial.println("----------------------------");
    if (isnan(ultimaHum) || isnan(ultimaTemp)) Serial.println("DHT11: erro de leitura");
    else Serial.printf("Temperatura: %.1f C | Humidade: %.0f %%\n", ultimaTemp, ultimaHum);
    Serial.printf("Som: pico %d | lento %.1f | base %.1f dBFS | %.0f Hz | agudos %.2f\n",
                  sound, nivelLento, nivelBase, freqS, rAltaS);
    Serial.printf("Estado: %s\n", nomes[estadoAtual]);
    Serial.printf("Breakbeam: %s | Passagens: %u\n",
                  beamBroken ? "INTERROMPIDO" : "livre", contagem);
    Serial.printf("BLE: %s\n", ligado ? "gateway ligado, dados enviados"
                                      : "a espera do gateway (não conectado)");

    micDbPeak = -120.0;
  }
}