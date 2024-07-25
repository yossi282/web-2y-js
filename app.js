const express = require("express");
const mqtt = require('mqtt');
const app = express();
const path = require('path');
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Pool } = require('pg'); 
require('dotenv').config();

app.use(express.static("public"));
app.use(express.json());

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL Database!');
});



// Koneksi PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
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
    db.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, hash], (err, results) => {
      if (err) throw err;
      res.json({ message: 'User registered successfully' });
    });
  });
});

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// Variable to store the latest sensor data
let latestSensorData = 'data';
let latestTemperatureData = 'data';
let latestHumidityData = 'data';

// Connect to the MQTT broker
//const mqttClient = mqtt.connect('mqtt://127.0.0.1:1883');
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

  // Subscribe to the "sensor" topic
  mqttClient.subscribe('potensiometer_yossi', (err) => {
    if (err) {
      console.error('Failed to subscribe to topic "potensiometer_yossi":', err);
    } else {
      console.log('Subscribed to topic "potensiometer_yossi"');
    }
  });
});

// Handle incoming messages from the temperature and humidity topics
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
    console.log(latestSensorData);
  }
});
  
  mqttClient.on('error', (err) => {
    console.error('MQTT connection error:', err);
  });

  // Route to publish a message to an MQTT topic
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

app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/kalkulator", function (req, res) {
    res.sendFile(path.join(__dirname, "public/kalkulator.html"));
});

app.get("/about", function (req, res) {
    res.sendFile(path.join(__dirname, "public/about.html"));
});

app.get("/auth", function (req, res) {
    res.sendFile(path.join(__dirname, "public/auth.html"));
});

app.get("/mqtt", function (req, res) {
    res.sendFile(path.join(__dirname, "public/mqtt.html"));
});

const PORT = process.env.PORT || 2828;
app.listen("2828", function () {
    console.log(`Your website is online on port ${PORT}.`);
});
