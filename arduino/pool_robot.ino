/*
  Pool Boy Robot - Arduino Nano

  Serial protocol (9600 baud, newline-delimited JSON):

  SENDS (sensor data every 1s):
    {"temperature":25.5,"pH":7.2,"tds":350,"roll":1.2,"pitch":-0.5}

  RECEIVES (commands from website):
    {"cmd":"set_direction","x":0.5,"y":-0.3}
    {"cmd":"stop"}
    {"cmd":"auto_on"}
    {"cmd":"auto_off"}
*/

// ---- Pin definitions (adjust to your wiring) ----
const int MOTOR_LEFT_FWD  = 5;
const int MOTOR_LEFT_BWD  = 6;
const int MOTOR_RIGHT_FWD = 9;
const int MOTOR_RIGHT_BWD = 10;

// Sensor pins (analog)
const int TEMP_PIN = A0;
const int PH_PIN   = A1;
const int TDS_PIN  = A2;

// ---- State ----
bool autoMode = false;
unsigned long lastSensorSend = 0;
const unsigned long SENSOR_INTERVAL = 1000; // 1 second

String inputBuffer = "";

void setup() {
  Serial.begin(9600);

  pinMode(MOTOR_LEFT_FWD, OUTPUT);
  pinMode(MOTOR_LEFT_BWD, OUTPUT);
  pinMode(MOTOR_RIGHT_FWD, OUTPUT);
  pinMode(MOTOR_RIGHT_BWD, OUTPUT);

  stopMotors();
}

void loop() {
  // Read serial commands
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n') {
      handleCommand(inputBuffer);
      inputBuffer = "";
    } else {
      inputBuffer += c;
    }
  }

  // Send sensor data periodically
  if (millis() - lastSensorSend >= SENSOR_INTERVAL) {
    lastSensorSend = millis();
    sendSensorData();
  }

  // Auto roam logic (simple example)
  if (autoMode) {
    autoRoam();
  }
}

// ---- Command handling ----
void handleCommand(String json) {
  json.trim();
  if (json.length() == 0) return;

  if (json.indexOf("\"stop\"") >= 0) {
    stopMotors();
    autoMode = false;
  }
  else if (json.indexOf("\"auto_on\"") >= 0) {
    autoMode = true;
  }
  else if (json.indexOf("\"auto_off\"") >= 0) {
    autoMode = false;
    stopMotors();
  }
  else if (json.indexOf("\"set_direction\"") >= 0) {
    // Parse x and y from JSON
    float x = parseJsonFloat(json, "x");
    float y = parseJsonFloat(json, "y");
    setDirection(x, y);
  }
}

float parseJsonFloat(String json, String key) {
  String search = "\"" + key + "\":";
  int idx = json.indexOf(search);
  if (idx < 0) return 0;
  idx += search.length();
  String val = "";
  while (idx < json.length() && (isDigit(json[idx]) || json[idx] == '.' || json[idx] == '-')) {
    val += json[idx];
    idx++;
  }
  return val.toFloat();
}

// ---- Motor control ----
void setDirection(float x, float y) {
  // x: -1 (left) to 1 (right)
  // y: -1 (forward) to 1 (backward)  -- joystick Y is inverted

  int leftSpeed  = constrain((int)((-y + x) * 255), -255, 255);
  int rightSpeed = constrain((int)((-y - x) * 255), -255, 255);

  setMotor(MOTOR_LEFT_FWD, MOTOR_LEFT_BWD, leftSpeed);
  setMotor(MOTOR_RIGHT_FWD, MOTOR_RIGHT_BWD, rightSpeed);
}

void setMotor(int fwdPin, int bwdPin, int speed) {
  if (speed > 0) {
    analogWrite(fwdPin, speed);
    analogWrite(bwdPin, 0);
  } else if (speed < 0) {
    analogWrite(fwdPin, 0);
    analogWrite(bwdPin, -speed);
  } else {
    analogWrite(fwdPin, 0);
    analogWrite(bwdPin, 0);
  }
}

void stopMotors() {
  analogWrite(MOTOR_LEFT_FWD, 0);
  analogWrite(MOTOR_LEFT_BWD, 0);
  analogWrite(MOTOR_RIGHT_FWD, 0);
  analogWrite(MOTOR_RIGHT_BWD, 0);
}

// ---- Sensor reading ----
void sendSensorData() {
  // Replace with your actual sensor reading code
  float temperature = readTemperature();
  float pH = readPH();
  float tds = readTDS();
  // Add IMU readings if you have a gyroscope/accelerometer
  float roll = 0.0;
  float pitch = 0.0;

  Serial.print("{\"temperature\":");
  Serial.print(temperature, 1);
  Serial.print(",\"pH\":");
  Serial.print(pH, 2);
  Serial.print(",\"tds\":");
  Serial.print(tds, 0);
  Serial.print(",\"roll\":");
  Serial.print(roll, 1);
  Serial.print(",\"pitch\":");
  Serial.print(pitch, 1);
  Serial.println("}");
}

float readTemperature() {
  // Example: LM35 or DS18B20 -- replace with your sensor logic
  int raw = analogRead(TEMP_PIN);
  return (raw * 5.0 / 1024.0) * 100.0; // LM35: 10mV per degree
}

float readPH() {
  // Example: analog pH sensor -- replace with your calibration
  int raw = analogRead(PH_PIN);
  float voltage = raw * 5.0 / 1024.0;
  return 3.5 * voltage; // rough calibration, adjust for your sensor
}

float readTDS() {
  // Example: TDS meter -- replace with your calibration
  int raw = analogRead(TDS_PIN);
  float voltage = raw * 5.0 / 1024.0;
  return (133.42 * voltage * voltage * voltage
        - 255.86 * voltage * voltage
        + 857.39 * voltage) * 0.5;
}

// ---- Auto roam (simple example) ----
void autoRoam() {
  // Simple forward movement -- replace with your own logic
  setDirection(0, -0.5);
}
