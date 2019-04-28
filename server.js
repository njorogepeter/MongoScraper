var express = require("express");
var logger = require("morgan");
const mongoose = require("mongoose");

const axios = require("axios");
const cheerio = require("cheerio");

const db = require("./models");

const PORT  = process.env.PORT || 3000;

// Initialize Express
const app = express();

// Configure middlewate

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Set Handlebars.
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

const router = require("./controllers/api.js");
app.use(router);

// Connect to the Mongo DB
const con = mongoose.connect("mongodb://localhost/newscraper", { useNewUrlParser: true });
// con.then(con_obj => console.log(con_obj))

  
  // Start the server
app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
});
  
