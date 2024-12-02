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

// Firebase credentials
#define API_KEY "AIzaSyB-vryKWHuQhY48O8OmJS2IGG95yYM_edY"                                        // Replace with your project ID
#define DATABASE_URL "https://embeded-c80cb-default-rtdb.asia-southeast1.firebasedatabase.app" // Database Secret / Auth Token


// Firebase objects
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

unsigned long sendDataPrevMillis = 0;
bool signupOK = false;

// WiFi Configuration
const char *WIFI_SSID = "HUAWEI Y9 2019"; 
const char *WIFI_PASSWORD = "84419912";

#define fan 27
#define smokePin 34
#define dhtPin 25

struct MessageState {
    char pos[8];
    char state[16];
};

// Define pins
#define CE_PIN 4
#define CSN_PIN 5

// Create RF24 object
RF24 radio(CE_PIN, CSN_PIN);

// Address for communication (must match the transmitter)
const byte address[6] = "hello";

DHT dht(dhtPin, DHT11);

LiquidCrystal_I2C lcd(0x27, 16, 2);

bool isSmoke = false;
bool isAir = false;
int airTemp = 0;

void sendCardLog(String name) {
  // Server URL
  const char* serverUrl = "https://discord.com/api/webhooks/1309512835604414495/nXPJxTiQlxi5whjqgCuo5V8jt-b_bBOib_P0Z5_sXhcD5USWVtgvnVzxdH7Q0xbHg7nM";

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    JsonDocument doc;

    doc["content"] = name;

    String jsonString;
    serializeJson(doc, jsonString);

    Serial.println(jsonString);

    // Send HTTP POST request
    int httpResponseCode = http.POST(jsonString);
    if (httpResponseCode > 0) {
      Serial.printf("HTTP Response code: %d\n", httpResponseCode);
    } else {
      Serial.printf("Error code: %d\n", httpResponseCode);
    }

    // Print the response
    Serial.println("OK");

    http.end();
  } else {
    Serial.println("WiFi disconnected");
  }
}

void setup() {
  Serial.begin(115200);

  pinMode(fan, OUTPUT);
  pinMode(smokePin, INPUT);
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Air Conditioner");
  
  dht.begin();

  // Initialize NRF24L01
  if (!radio.begin()) {
    Serial.println("NRF24L01 initialization failed!");
  }

  // Set communication settings
  radio.openReadingPipe(0, address); // Open reading pipe 0 with the address
  radio.setPALevel(RF24_PA_LOW);    // Set power level
  radio.startListening();            // Set to receiver mode

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED)
  {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\nConnected to Wi-Fi");
  Serial.println(WiFi.localIP());
  
  // Configure Firebase
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  if (Firebase.signUp(&config, &auth, "", ""))
  {
    Serial.println("signUp OK");
    signupOK = true;
  }
  else
  {
    Serial.printf("%s\n", config.signer.signupError.message.c_str());
  }

  config.token_status_callback = tokenStatusCallback;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

}

void loop() { 
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  int smoke = analogRead(smokePin);

  if (smoke > 1500) {
    digitalWrite(fan, HIGH);
    isSmoke = true;
  } else {
    digitalWrite(fan, LOW);
    isSmoke = false;
  }

  if (radio.available()) {
    Serial.println("Message received!");
    MessageState message;
    radio.read(&message, sizeof(message));

    char pos[8];
    char state[16];

    strcpy(pos, message.pos);
    strcpy(state, message.state);

    if (strcmp(pos, "Outdoor") == 0) {
      if (Firebase.RTDB.setBool(&fbdo, "outdoorLed", strcmp(state, "ON") == 0 ? true : false)) {
        Serial.print("Outdoor: ");
        Serial.println(state);
      }
    } else if (strcmp(pos, "Indoor") == 0) {
      if (Firebase.RTDB.setBool(&fbdo, "indoorLed", strcmp(state, "ON") == 0 ? true : false)) {
        Serial.print("Indoor: ");
        Serial.println(state);
      }
    } else if (strcmp(pos, "Name") == 0) {
      sendCardLog(state);
      Serial.print("Name: ");
      Serial.println(state);
    } else {
      Serial.println("Unknown position received!");
    }
  }

  
  if (Firebase.ready() && signupOK && (millis() - sendDataPrevMillis > 2000 || sendDataPrevMillis == 0))
  {
    sendDataPrevMillis = millis();
    if (Firebase.RTDB.setFloat(&fbdo, "humidity", h))
    {
      // Serial.println("Set humidity OK");
    }
    else
    {
      Serial.println(fbdo.errorReason());
    }

    if (Firebase.RTDB.setFloat(&fbdo, "temperature", t))
    {
      // Serial.println("Set temperature OK");
    }
    else
    {
      Serial.println(fbdo.errorReason());
    }

    if (Firebase.RTDB.setBool(&fbdo, "isSmoke", isSmoke))
    {
      // Serial.println("Set isSmoke OK");
    }
    else
    {
      Serial.println(fbdo.errorReason());
    }

    
  }

  if (Firebase.ready() && signupOK && (millis() - sendDataPrevMillis > 1000 || sendDataPrevMillis == 0))
  {
    if (Firebase.RTDB.getBool(&fbdo, "isAir")) {
      isAir = fbdo.boolData();
        if (isAir) {
          lcd.setCursor(0, 1);
          lcd.print("                ");
          lcd.setCursor(0, 1);
          lcd.print("Temperature: ");
          lcd.setCursor(12, 1);
          lcd.print(airTemp, 1);
        } else {
          lcd.setCursor(0, 1);
          lcd.print("                ");
          lcd.setCursor(0, 1);
          lcd.print("OFF");
      }
    } else {
      Serial.println(fbdo.errorReason());
    }

    if (Firebase.RTDB.getFloat(&fbdo, "airTemp")) {
      airTemp = fbdo.floatData();
      // Serial.println(airTemp);
      lcd.setCursor(0, 0);
      lcd.print(airTemp);
    } else {
      Serial.println(fbdo.errorReason());
    }
  }

  delay(1000);


}