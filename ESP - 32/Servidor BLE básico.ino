#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <BLE2902.h>

#include <Arduino.h>

//UUIDs do Serviço e a Características
#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"


BLEServer* pServer = NULL;
BLECharacteristic* pCharacteristic = NULL;
bool dispositivoConectado = false;
uint32_t value = 0;

class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    dispositivoConectado = true;
    Serial.println("Dispositivo Conectado!");
  };

  void onDisconnect(BLEServer* pServer) {
    dispositivoConectado = false;
    Serial.println("Dispositivo Desconectado!");
    pServer->startAdvertising();
  };
};

void setup() {
  Serial.begin(115200);

  //Iniciar o BLE
  BLEDevice::init("Connector-XIAOC6");

  //Criar servidor BLE
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  //Criar dispositivo BLE
  BLEService* pService = pServer->createService(SERVICE_UUID);

  //Criar uma caracteristica BLE com Notificador e Leitura
  pCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ 
    | BLECharacteristic::PROPERTY_NOTIFY
  );


  //Descritor para Notificações
  pCharacteristic->addDescriptor(new BLE2902());

  //Começar o Serviço
  pService->start();

  BLEAdvertising * pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);  //Ajuda com a conexão
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();

  Serial.println("Servidor BLE a correr!");
}

void loop() {
  if(dispositivoConectado) {
    //Data payload
    String dataToSend = "Count: " + String(value++);

    //Atualizar valor da caracteristica e Notifica o client
    pCharacteristic->setValue(dataToSend.c_str());
    pCharacteristic->notify();

    Serial.print("Dados Enviados: ");
    Serial.println(dataToSend);

    delay(2000);
  }
}