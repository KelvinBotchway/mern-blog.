//This line imports the Express.js framework into your Node.js application
const express = require("express");

const { MongoClient } = require("mongodb");

//This line initializes an Express application by calling the express()
const app = express();

//Here, you define a constant PORT that specifies the port number on which your server will listen for incoming HTTP requests. It checks the process.env.PORT environment variable, which is often used in cloud-hosted environments to specify the port
const PORT = process.env.PORT || 8000;


//This creates an object called articlesInfo that will serve as a simple in-memory database for your application.
// const articlesInfo = {
//   "learn-react": {
//     comments: [],
//   },
//   "learn-node": {
//     comments: [],
//   },
//   "my-thoughts-on-learning-react": {
//     comments: [],
//   },
// };

//Initialize middleware
//function of express. It parses incoming JSON payload
app.use(express.json({ extended: false }));

const withDB = async (operations, res) => {
  try {
    const client = await MongoClient.connect("mongodb://127.0.0.1:27017");
    const db = client.db("mernblog");
    await operations(db);
    client.close();
  } catch (error) {
    res.status(500).json({ message: "Error connecting to database", error });
  }
};

//Just to test route
// app.get("/", (req, res) => res.send("Hello World"));
// app.post("/", (req, res) => res.send(`Hello ${req.body.name}`));
// app.get("/hello/:name", (req, res) => res.send(`Hello ${req.params.name}`));

app.get("/api/articles/:name", async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;
    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    res.status(200).json(articleInfo);
  }, res);
});

//defines a POST request route with a dynamic parameter :name in the URL. This parameter represents the name of the article to which a comment will be added.
app.post("/api/articles/:name/add-comments", (req, res) => {
  //extrects the username and text property from the json payload
  const { username, text } = req.body;
  //extacts the name of the article from the url
  const articleName = req.params.name;

  //adds the received comment to the comments array of the specified article in the articlesInfo object.

  withDB(async (db) => {
    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    await db.collection("articles").updateOne(
      { name: articleName },
      {
        $set: {
          comments: articleInfo.comments.concat({ username, text }),
        },
      }
    );
    const updatedArticleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    res.status(200).json(updatedArticleInfo);
  }, res);
});

app.listen(PORT, () => console.log(`Server started at port ${PORT} `));
