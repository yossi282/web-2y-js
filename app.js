const express = require("express");
const mqtt = require('mqtt');
const app = express();
const path = require('path');

app.use(express.static("public"));
app.use(express.json());

let latestSensorData = '';

const mqttClient = mqtt.connect('wss://test.mosquitto.org:1883');

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  mqttClient.subscribe('potensiometer_husni', (err) => {
    if (err) {
      console.error('Failed to subscribe to topic "sensor":', err);
    } else {
      console.log('Subscribed to topic "sensor"');
    }
  });
});

mqttClient.on('message', (topic, message) => {
  if (topic === 'potensiometer_husni') {
    console.log(`Received message from ${topic}: ${message.toString()}`);
    latestSensorData = message.toString();
    console.log(latestSensorData);
  }
});

mqttClient.on('error', (err) => {
  console.error('MQTT connection error:', err);
});

app.post('/publish', (req, res) => {
  const { topic, message } = req.body;
  if (!topic || !message) {
    return res.status(400).send('Topic and message are required');
  }
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

app.get('/sensor-data', (req, res) => {
  if (!latestSensorData) {
    return res.status(404).send('No sensor data available');
  }
  res.json({ data: latestSensorData });
});

app.get('/:page', function (req, res) {
  const page = req.params.page;
  res.sendFile(path.join(__dirname, `public/${page}.html`));
});

app.listen("2828", function () {
  console.log("Your website is online.");
});