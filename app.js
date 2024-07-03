const express = require("express");
const app = express();
const path = require('path');

app.use(express.static("public"));
app.use(express.json());

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

app.listen("2700", function () {
    console.log("your website is online.");
});
