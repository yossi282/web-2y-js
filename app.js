const express = require("express");
const mqtt = require('mqtt');
const app = express();
const path = require ('path');
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require('dotenv').config();

app.use(express.static("public"));
app.use(express.json());

let connection;

function handleDatabaseConnection() {
  connection = mysql.createConnection({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS
  });

  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to MySQL:', err);
      setTimeout(handleDatabaseConnection, 2000); // Retry connection after 2 seconds
    } else {
      console.log('Connected to MySQL Database!');
    }
  });

  connection.on('error', (err) => {
    console.error('MySQL connection error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      handleDatabaseConnection(); // Reconnect if connection is lost
    } else {
      throw err;
    }
  });
}

handleDatabaseConnection();

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', email); // Log login attempt
  connection.query('SELECT * FROM userweb WHERE email = ?', [email], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    if (results.length > 0) {
      const user = results[0];
      console.log('User found:', user); // Log user data

      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          console.error('Bcrypt compare error:', err);
          return res.status(500).json({ message: 'Internal server error' });
        }
        if (isMatch) {
          const token = jwt.sign({ id: user.id }, 'secretkey', { expiresIn: '1h' });
          res.json({ message: 'Login successful', token });
        } else {
          console.log('Password mismatch'); // Log password mismatch
          res.status(401).json({ message: 'Invalid credentials' });
        }
      });
    } else {
      console.log('User not found'); // Log user not found
      res.status(401).json({ message: 'Invalid credentials' });
    }
  });
});

app.post('/api/signup', (req, res) => {
  const { email, password } = req.body;
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) throw err;
    connection.query('INSERT INTO userweb (email, password) VALUES (?, ?)', [email, hash], (err, results) => {
      if (err) throw err;
      res.json({ message: 'User registered successfully' });
    });
  });
});

// Variable to store the latest sensor data
let latestSensorData = 'data';
let latestTemperatureData = 'data';
let latestHumidityData = 'data';
let latestGPSData = { latitude: -6.914744, longitude: 107.609810 }; // Initial dummy GPS data

// Connect to the MQTT broker
const mqttClient = mqtt.connect('mqtt://broker.emqx.io:1883');

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  
  mqttClient.subscribe('temperature_yossi', (err) => {
    if (err) {
      console.error('Failed to subscribe to topic "temperature_yossi":', err);
    } else {
      console.log('Subscribed to topic "temperature_yossi"');
    }
  });

  mqttClient.subscribe('humidity_yossi', (err) => {
    if (err) {
      console.error('Failed to subscribe to topic "humidity_yossi":', err);
    } else {
      console.log('Subscribed to topic "humidity_yossi"');
    }
  });

  mqttClient.subscribe('potensiometer_yossi', (err) => {
    if (err) {
      console.error('Failed to subscribe to topic "potensiometer_yossi":', err);
    } else {
      console.log('Subscribed to topic "potensiometer_yossi"');
    }
  });

  mqttClient.subscribe('gps_yossi', (err) => {
    if (err) {
      console.error('Failed to subscribe to topic "gps_yossi":', err);
    } else {
      console.log('Subscribed to topic "gps_yossi"');
    }
  });
});

mqttClient.on('message', (topic, message) => {
  if (topic === 'temperature_yossi') {
    console.log(`Received message from ${topic}: ${message.toString()}`);
    latestTemperatureData = message.toString();
  } else if (topic === 'humidity_yossi') {
    console.log(`Received message from ${topic}: ${message.toString()}`);
    latestHumidityData = message.toString();
  } else if (topic === 'potensiometer_yossi') {
    console.log(`Received message from ${topic}: ${message.toString()}`);
    latestSensorData = message.toString();
  } else if (topic === 'gps_yossi') {
    console.log(`Received message from ${topic}: ${message.toString()}`);
    latestGPSData = JSON.parse(message.toString());
  }
});

mqttClient.on('error', (err) => {
  console.error('MQTT connection error:', err);
});

// Simulasi data GPS
setInterval(() => {
  latestGPSData.latitude += 0.0001; // Simulate latitude change
  latestGPSData.longitude += 0.0001; // Simulate longitude change

  // Publish simulated GPS data to MQTT topic
  mqttClient.publish('gps_yossi', JSON.stringify(latestGPSData), (err) => {
    if (err) {
      console.error('Error publishing GPS data:', err);
    } else {
      console.log('Simulated GPS data published successfully');
    }
  });
}, 5000); // Update every 5 seconds

app.post('/publish', (req, res) => {
  const { topic, message } = req.body;
  console.log(`Received request to publish topic: ${topic}, message: ${message}`);

  mqttClient.publish(topic, message, (err) => {
    if (err) {
      console.error('Error publishing message:', err);
      res.status(500).send('Error publishing message');
    } else {
      console.log('Message published successfully');
      res.send('Message published successfully');
    }
  });
});

// Route to get the latest sensor data
app.get('/sensor-data', (req, res) => {
  res.json({ data: latestSensorData });
});

app.get('/sensor-data2', (req, res) => {
  res.json({ temperature: latestTemperatureData, humidity: latestHumidityData });
});

// Route to get the latest GPS data
app.get('/gps-data', (req, res) => {
  res.json(latestGPSData);
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "public/home.html"));
});

app.get("/kalkulator", (req, res) => {
  res.sendFile(path.join(__dirname, "public/kalkulator.html"));
});

app.get("/monitor", (req, res) => {
  res.sendFile(path.join(__dirname, "public/monitor.html"));
});

app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "public/about.html"));
});

app.get("/about1", (req, res) => {
  res.sendFile(path.join(__dirname, "public/about1.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public/login.html"));
});

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "public/signup.html"));
});

app.get("/mqtt", (req, res) => {
  res.sendFile(path.join(__dirname, "public/mqtt.html"));
});

app.get("/profil", (req, res) => {
  res.sendFile(path.join(__dirname, "public/profil.html"));
});

const PORT = process.env.PORT || 2828;
app.listen(PORT, () => {
  console.log(`Your website is online on port ${PORT}.`);
});
