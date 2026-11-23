const int PIN_BATERIA = D0;

const float V_MAX = 4.20;
const float V_MIN = 3.20;

// Fator de correção caso queira calibrar com um multímetro (ex.: 1.00 por defeito)
const float FATOR_CALIBRACAO = 1.00;

float lerTensaoBateria() {
  const int AMOSTRAS = 20;
  uint32_t somaMv = 0;

  for (int i = 0; i < AMOSTRAS; i++) {
    somaMv += analogReadMilliVolts(PIN_BATERIA);
    delay(5);
  }

  float mediaMv = (float)somaMv / AMOSTRAS;
  // Multiplica por 2.0 devido ao divisor de tensão 100k + 100k
  float tensao = ((mediaMv * 2.0) / 1000.0) * FATOR_CALIBRACAO;
  return tensao;
}

int calcularPercentagem(float tensao) {
  float pct = ((tensao - V_MIN) / (V_MAX - V_MIN)) * 100.0;
  if (pct < 0.0) pct = 0.0;
  if (pct > 100.0) pct = 100.0;
  return (int)round(pct);
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  analogReadResolution(12);       // Resolução de 12 bits
  analogSetAttenuation(ADC_11db); // Permite ler até ~3,3 V no pino ADC

  Serial.println("Monitor de bateria 18650 iniciado...");
}

void loop() {
  float tensao = lerTensaoBateria();
  int percentagem = calcularPercentagem(tensao);

  Serial.print("Tensao da bateria: ");
  Serial.print(tensao, 2);
  Serial.print(" V  |  Bateria restante: ");
  Serial.print(percentagem);
  Serial.println(" %");

  delay(2000);
}