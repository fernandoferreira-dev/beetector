#include <DHT.h>
#define DHT_PIN D1

DHT dht(DHT_PIN, DHT11);

void setup() {
  Serial.begin(115200);
  delay(1500);
  dht.begin();
}

void loop() {
  // O DHT11 precisa de pelo menos 1s entre leituras
  delay(2000);

  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (isnan(h) || isnan(t)) {
    Serial.println("Erro de leitura. Verifica as ligações (S -> D1, V -> 3V3, G -> GND).");
    return;
  }

  Serial.printf("Temperatura: %.1f C | Humidade: %.0f %%\n", t, h);
}
