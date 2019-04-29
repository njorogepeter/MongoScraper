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

// Connect to the Mongo DB
const con = mongoose.connect("mongodb://localhost/newscraper", { useNewUrlParser: true });
// con.then(con_obj => console.log(con_obj))
 
// Routes
//  A GET route for scraping the BBC website
app.get("/scrape", function(req, res) {
    //First, we grab the body of the html with axios
    axios.get("https://www.nytimes.com/").then(function(response) {
        var $ = cheerio.load(response.data);
        // console.log($(".pigeon h3"))
        // Now, we grab every h3 within an article tag, and do the following:
        $(".FeedCard .c0114  .c0115").each(function(i, element) {
            var result = {};
            // console.log(element)
            // Add the text and href of every link, and save them as properties of the result object
            result.title = $(this)
                .children(".CardHeadline")
                .children("h1")
                .text();
            result.link = $(this)
                .children(".headline")
                .children("a")
                .attr("href");
            result.summary = $(this)
                .children(".content c0119 c0121")
                .children("p")
                .text();
            
            // Create a new Article using the 'result object built from scraping
            db.Article.create(result)
                .then(function(dbArticle) {
                    // view the added result in the console
                    // console.log(dbArticle);
                    console.log("Scaraped!!!!!!!!!!!!!!!!")
                })
                .catch(function(err) {
                    // If an error occured
                    console.log(err);
                });
        });

        // Send a message to the client
        res.send("Scrape Complete");
    }).catch((error) => console.error(error));
});

app.get("/", function(req, res) {
    db.Article.find({})
        .then(function (dbArticle) {
            const retrievedArticles = dbArticle;
            var hbsObject;
            hbsObject = {
                articles: dbArticle
            };
            res.render("index", hbsObject); 
        })
        .catch(function (err) {
            // If an error occurred
            res.json(err);
        });
});

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
    db.Article.find({})
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred
            res.json(err);
        });
});


// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
    db.Article.find({ _id: req.params.id })
        .populate({
            path: 'note',
            model: 'Note'
        })
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred
            res.json(err);
        });
});

// Route for saving/updating an Article's associated Note
app.post("/note/:id", function (req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note.create(req.body)
        .then(function (dbNote) {
            return db.Article.findOneAndUpdate({ _id: req.params.id }, {$push: { note: dbNote._id }}, { new: true });
        })
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred
            res.json(err);
        });
});

app.delete("/note/:id", function (req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note.findByIdAndDeleteOne({ _id: req.params.id })
        .then(function (dbNote) {

            return db.Article.findOneAndUpdate({ note: req.params.id }, { $pullAll: [{ note: req.params.id }]});
        })
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred
            res.json(err);
        });
});

// Route for saved articles
app.get("/saved", function (req, res) {
    db.Article.find({isSaved: true})
        .then(function (retrievedArticles) {
           var hbsObject;
            hbsObject = {
                articles: retrievedArticles
            };
            res.render("saved", hbsObject);
            console.log("start", hbsObject);

        })
        .catch(function (err) {
            // If an error occurred
            res.json(err);
        });
});

app.put("/save/:id", function (req, res) {
    db.Article.findOneAndUpdate({ _id: req.params.id }, { isSaved: true })
        .then(function (data) {
            res.json(data);
        })
        .catch(function (err) {
            // If an error occurred
            res.json(err);
        });;
});

app.put("/remove/:id", function (req, res) {
    db.Article.findOneAndUpdate({ _id: req.params.id }, { isSaved: false })
        .then(function (dbArticle) {
            res.json(dbArticle)
        })
        .catch(function (err) {
            // If an error occurred
            res.json(err);
        });
});

  
  
  // Start the server
app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
});
  
