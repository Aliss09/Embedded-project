#include <ArduinoJson.h>
#include <SPI.h>
#include <DHT.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <nRF24L01.h>
#include <RF24.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <MFRC522.h>

// led
#define homeLed 22
#define outdoorLed 2

struct MessageState
{
  char pos[8];
  char state[16];
};

// ldr
#define ldr 35

// pir
#define trigPin 27
#define echoPin 26

// rfid
#define SS_PIN 15
#define RST_PIN 25

MFRC522 mfrc522(SS_PIN, RST_PIN);

MFRC522::MIFARE_Key key;

MFRC522::StatusCode status;

// nrf
#define CE_PIN 4
#define CSN_PIN 5

RF24 radio(CE_PIN, CSN_PIN);

const byte address[6] = "hello";

TaskHandle_t TaskSensorRead;

void writeMessageToCard(int blockNum, String message)
{
  byte blockData[16]; // Temporary byte array to store message

  // Convert String to byte array (16 bytes max)
  for (byte i = 0; i < 16; i++)
  {
    if (i < message.length())
    {
      blockData[i] = message[i];
    }
    else
    {
      blockData[i] = ' ';
    }
  }

  /* Authenticating the desired data block for write access using Key A */
  status = mfrc522.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A, blockNum, &key, &(mfrc522.uid));
  if (status != MFRC522::STATUS_OK)
  {
    Serial.print("Authentication failed for Write: ");
    Serial.println(mfrc522.GetStatusCodeName(status));
    return;
  }
  else
  {
    Serial.println("Authentication success for Write");
  }

  /* Write data to the block */
  status = mfrc522.MIFARE_Write(blockNum, blockData, 16);
  if (status != MFRC522::STATUS_OK)
  {
    Serial.print("Writing to Block failed: ");
    Serial.println(mfrc522.GetStatusCodeName(status));
    return;
  }
  else
  {
    Serial.println("Data was written to Block successfully");
  }
}

String readMessageFromCard(int blockNum)
{
  /* Authenticating the desired data block for Read access using Key A */
  status = mfrc522.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A, blockNum, &key, &(mfrc522.uid));

  if (status != MFRC522::STATUS_OK)
  {
    Serial.print("Authentication failed for Read: ");
    Serial.println(mfrc522.GetStatusCodeName(status));
    return "";
  }
  else
  {
    Serial.println("Authentication success for Read");
  }

  byte bufferLen = 18;
  byte readBlockData[18];

  /* Reading data from the Block */
  status = mfrc522.MIFARE_Read(blockNum, readBlockData, &bufferLen);
  if (status != MFRC522::STATUS_OK)
  {
    Serial.print("Reading failed: ");
    Serial.println(mfrc522.GetStatusCodeName(status));
    return "";
  }
  else
  {
    Serial.println("Block was read successfully");
  }

  /* Print the data read from block */
  Serial.print("\nData in Block ");
  Serial.print(blockNum);
  Serial.print(": ");
  String name = "";
  for (int j = 0; j < 16; j++)
  {
    name += (char)readBlockData[j];
  }
  name.trim();
  return name;
}

void handleSensorTask(void *pvParameters)
{
  for (;;)
  {
    float ldrValue = analogRead(ldr);

    // Timing for home LED
    static unsigned long previousMillis = 0;
    unsigned long currentMillis = millis();

    static unsigned long previousMillisSend = 0;
    unsigned long currentMillisSend = millis();

    // Turn off home LED after 10 seconds of no PIR activity
    if (currentMillis - previousMillis >= 10000)
    {
      digitalWrite(homeLed, LOW);
    }

    // Ultrasonic Sensor Handling
    long duration, distance;
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);
    duration = pulseIn(echoPin, HIGH);
    distance = (duration / 2) * 0.0343;

    if (distance < 35)
    {
      digitalWrite(homeLed, HIGH);
      previousMillis = currentMillis;
    }

    if (ldrValue < 100)
    {
      digitalWrite(outdoorLed, HIGH);
    }
    else
    {
      digitalWrite(outdoorLed, LOW);
    }

    // Send data to the NRF24L01
    if (currentMillisSend - previousMillisSend >= 5000)
    {
      previousMillisSend = currentMillisSend;

      MessageState outdoor;
      MessageState indoor;

      if (digitalRead(outdoorLed))
      {
        strcpy(outdoor.pos, "Outdoor");
        strcpy(outdoor.state, "ON");
      }
      else
      {
        strcpy(outdoor.pos, "Outdoor");
        strcpy(outdoor.state, "OFF");
      }

      if (digitalRead(homeLed))
      {
        strcpy(indoor.pos, "Indoor");
        strcpy(indoor.state, "ON");
      }
      else
      {
        strcpy(indoor.pos, "Indoor");
        strcpy(indoor.state, "OFF");
      }

      radio.write(&outdoor, sizeof(outdoor));
      delay(1000);
      radio.write(&indoor, sizeof(indoor));

      Serial.println("Data sent to NRF24L01");
    }

    // Add a short delay for stability (non-blocking delay is preferred)
    delay(200); // Consider removing this and using `millis()` for all timing
  }
}

void setup()
{
  // put your setup code here, to run once:
  Serial.begin(115200);

  pinMode(ldr, INPUT);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(homeLed, OUTPUT);
  pinMode(outdoorLed, OUTPUT);

  SPI.begin(18, 19, 23);

  // Initialize MFRC522
  mfrc522.PCD_Init();

  mfrc522.PCD_DumpVersionToSerial();

  // Initialize NRF24L01
  if (!radio.begin())
  {
    Serial.println("NRF24L01 initialization failed!");
  }

  // Set communication settings
  radio.openWritingPipe(address); // Set the TX address to match the receiver
  radio.setPALevel(RF24_PA_LOW);  // Set power level
  radio.stopListening();          // Set to transmitter mode

  xTaskCreatePinnedToCore(
      handleSensorTask, // Task function
      "Sensor Task",    // Name of the task
      10000,            // Stack size
      NULL,             // Parameters to pass
      1,                // Task priority
      &TaskSensorRead,  // Task handle
      1                 // Core to run the task (1 for user tasks)
  );

  // Set all keys to default 0xFF
  for (byte i = 0; i < 6; i++)
  {
    key.keyByte[i] = 0xFF;
  }
}

void loop()
{

  static unsigned long lastResetTime = 0;
  if (millis() - lastResetTime > 1000)
  { // Reset every 60 seconds
    // Serial.println("Resetting RFID module...");
    mfrc522.PCD_Init();
    lastResetTime = millis();
  }

  if (!mfrc522.PICC_IsNewCardPresent())
  {
    return;
  }
  /* Select one of the cards */
  if (!mfrc522.PICC_ReadCardSerial())
  {
    return; // Restart the loop if no card is detected
  }
  Serial.print("\n");
  Serial.println("**Card Detected**");

  /* Print UID of the Card */
  Serial.print(F("Card UID:"));
  for (byte i = 0; i < mfrc522.uid.size; i++)
  {
    Serial.print(mfrc522.uid.uidByte[i] < 0x10 ? " 0" : " ");
    Serial.print(mfrc522.uid.uidByte[i], HEX);
  }
  Serial.print("\n");

  /* Write message to the card */
  // writeMessageToCard(4, "John Smith");

  String name = readMessageFromCard(4);

  Serial.println(name);

  if (name != "")
  {
    MessageState nameState;
    strncpy(nameState.pos, "Name", sizeof(nameState.pos) - 1);           // Ensure no buffer overflow
    strncpy(nameState.state, name.c_str(), sizeof(nameState.state) - 1); // Copy the name to state

    nameState.pos[sizeof(nameState.pos) - 1] = '\0';     // Null-terminate
    nameState.state[sizeof(nameState.state) - 1] = '\0'; // Null-terminate

    radio.write(&nameState, sizeof(nameState)); // Send message

    Serial.println("Message sent!");
    Serial.println(name);

    // halt
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();

    delay(500);
  }
}