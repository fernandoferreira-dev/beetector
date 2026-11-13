#define BEAM_PIN D2
const unsigned long DEBOUNCE_MS = 20;

bool estado = false;          
bool ultimoLido = false;      
unsigned long tMudanca = 0;   
unsigned long contagem = 0;   
unsigned long ultimoResumo = 0;

void setup() {
  Serial.begin(115200);
  delay(1500);
  pinMode(BEAM_PIN, INPUT_PULLUP);
  estado = ultimoLido = (digitalRead(BEAM_PIN) == LOW);
  Serial.printf("Estado inicial: %s\n", estado ? "INTERROMPIDO" : "livre");
}

void loop() {
  bool lido = (digitalRead(BEAM_PIN) == LOW);
  // Debounce
  if (lido != ultimoLido) {
    ultimoLido = lido;
    tMudanca = millis();
  }
  if ((millis() - tMudanca) > DEBOUNCE_MS && lido != estado) {
    estado = lido;
    if (estado) {
      contagem++;
      Serial.printf("[%lu ms] Feixe INTERROMPIDO (total: %lu)\n", millis(), contagem);
    } else {
      Serial.printf("[%lu ms] Feixe restabelecido\n", millis());
    }
  }

  // 5 em 5 segundos
  if (millis() - ultimoResumo >= 5000) {
    ultimoResumo = millis();
    Serial.printf("-- Estado: %s | Interrupções: %lu\n",
                  estado ? "INTERROMPIDO" : "livre", contagem);
  }
}