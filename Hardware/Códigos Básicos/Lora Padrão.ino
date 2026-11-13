#include <RadioLib.h>
#include <SPI.h>
#include <Preferences.h>

// Pinos do Wio-SX1262 no XIAO ESP32S3 (módulo encaixado no conector B2B)
#define LORA_SCK    7
#define LORA_MISO   8
#define LORA_MOSI   9
#define LORA_CS     41   // NSS
#define LORA_RST    42
#define LORA_DIO1   39
#define LORA_BUSY   40
#define LORA_RXEN   38   // RF-SW

//Inicialização do Rádio e LoRaWAN
SPIClass loraSPI(FSPI);
SX1262 radio = new Module(LORA_CS, LORA_DIO1, LORA_RST, LORA_BUSY, loraSPI);

const LoRaWANBand_t region = EU868;
LoRaWANNode node(&radio, &region);

Preferences store;

//Credenciais de Acesso ao TTN
uint64_t joinEUI = 0x0000000000000000;
uint64_t devEUI  = 0x70B3D57ED0079CA6;

uint8_t appKey[] = { 0x3D, 0xD6, 0x96, 0x4A, 0x3B, 0x9D, 0x5F, 0x96,
                     0x7F, 0xE9, 0x27, 0x54, 0x87, 0x16, 0xA1, 0x09 };
uint8_t nwkKey[] = { 0x3D, 0xD6, 0x96, 0x4A, 0x3B, 0x9D, 0x5F, 0x96,
                     0x7F, 0xE9, 0x27, 0x54, 0x87, 0x16, 0xA1, 0x09 };

const uint32_t UPLINK_INTERVAL_MS = 600000;  // 10 min
const uint32_t JOIN_RETRY_MS      = 30000;   // 30 s

//Função ppara guardar nonces
void saveNonces() {
  store.putBytes("nonces", node.getBufferNonces(), RADIOLIB_LORAWAN_NONCES_BUF_SIZE);
}

void setup() {
  Serial.begin(115200);
  delay(2000);

  loraSPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_CS);

  // Inicia o rádio SX1262
  int16_t state = radio.begin(868.0, 125.0, 9, 7, RADIOLIB_LORAWAN_LORA_SYNC_WORD, 10, 8, 1.8);
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

  // Configura o node OTAA
  state = node.beginOTAA(joinEUI, devEUI, nwkKey, appKey);
  Serial.printf("beginOTAA: %d\n", state);

  // Restaura os DevNonces guardados (RadioLib >= 7.0)
  store.begin("radiolib");
  if (store.isKey("nonces")) {
    uint8_t buf[RADIOLIB_LORAWAN_NONCES_BUF_SIZE];
    store.getBytes("nonces", buf, RADIOLIB_LORAWAN_NONCES_BUF_SIZE);
    state = node.setBufferNonces(buf);
    Serial.printf("setBufferNonces: %d\n", state);
  }
}

void loop() {
  //Verifica se o Nó está ativado
  if (!node.isActivated()) 
  {
    Serial.println("A tentar join...");
    int16_t state = node.activateOTAA();
    Serial.printf("activateOTAA: %d\n", state);

    saveNonces();
    //Caso falhe, tenta denovo em 30 segundos
    if (!node.isActivated()) {
      Serial.printf("Join falhou, nova tentativa em %lu s\n", JOIN_RETRY_MS / 1000);
      delay(JOIN_RETRY_MS);
      return;
    }
    Serial.println("Join bem-sucedido!");
  }

  //Envio de dados com o Uplink
  uint8_t payload[] = { 0x01, 0x02 };
  int16_t state = node.sendReceive(payload, sizeof(payload));
  Serial.printf("sendReceive: %d\n", state);

  saveNonces();
  // Guarda novos nonces e entre em 10 minutos de espera
  delay(UPLINK_INTERVAL_MS);
}