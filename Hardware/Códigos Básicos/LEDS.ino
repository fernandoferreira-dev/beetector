const int pins[] = {D0, D1, D2, D3};

void setup() {
  for (int p : pins) pinMode(p, OUTPUT);
}

void loop() {
  for (int p : pins) digitalWrite(p, HIGH);
  delay(500);
  for (int p : pins) digitalWrite(p, LOW);
  delay(500);
}