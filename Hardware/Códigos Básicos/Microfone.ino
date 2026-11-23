#include <ESP_I2S.h>

#define I2S_SCK D8
#define I2S_WS D9
#define I2S_SD D10

I2SClass i2s;

const int NUM_SAMPLES = 256;
int32_t samples[NUM_SAMPLES];

unsigned long ultimaImpressao = 0;
float picoJanela = -120.0;  // pico (dBFS) na janela de impressão
float somaJanela = 0;       // para a média
int nJanela = 0;

// Devolve o nível RMS do bloco em dBFS (0 = máximo digital, valores negativos)
float lerNivelDbfs() {
  size_t bytes = i2s.readBytes((char *)samples, sizeof(samples));
  int n = bytes / sizeof(int32_t);
  if (n == 0) return -120.0;

  // Os dados são de 24 bits alinhados à esquerda nos 32 bits
  double soma = 0;
  for (int i = 0; i < n; i++) soma += (samples[i] >> 8);
  double media = soma / n;  // remove o offset DC

  double energia = 0;
  for (int i = 0; i < n; i++) {
    double v = (samples[i] >> 8) - media;
    energia += v * v;
  }
  double rms = sqrt(energia / n);
  if (rms < 1) rms = 1;
  return 20.0 * log10(rms / 8388608.0);  // 2^23
}

void setup() {
  Serial.begin(115200);
  delay(1500);
  i2s.setPins(I2S_SCK, I2S_WS, -1, I2S_SD);  // bclk, ws, dout, din
  if (!i2s.begin(I2S_MODE_STD, 16000, I2S_DATA_BIT_WIDTH_32BIT,
                 I2S_SLOT_MODE_MONO, I2S_STD_SLOT_LEFT)) {
    Serial.println("ERRO: falha ao iniciar I2S");
    while (true) delay(1000);
  }
  Serial.println("A ler...");
}

void loop() {
  float db = lerNivelDbfs();
  if (db > picoJanela) picoJanela = db;
  somaJanela += db;
  nJanela++;

  // Imprime 4 vezes por segundo
  if (millis() - ultimaImpressao >= 250) {
    ultimaImpressao = millis();
    float media = somaJanela / nJanela;

    // Barra visual: -80 dBFS (vazio) a -10 dBFS (cheio)
    int barras = constrain((int)((media + 80.0f) / 70.0f * 30.0f), 0, 30);
    char barra[32];
    for (int i = 0; i < 30; i++) barra[i] = (i < barras) ? '#' : '.';
    barra[30] = '\0';

    Serial.printf("Média: %6.1f dBFS | Pico: %6.1f dBFS | %s\n", media, picoJanela, barra);

    picoJanela = -120.0;
    somaJanela = 0;
    nJanela = 0;
  }
}
