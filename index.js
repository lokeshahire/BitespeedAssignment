const express = require("express");
const app = express();
require("dotenv").config();

const contactRouter = require("./routes/contact.route.js");
const { connection } = require("./config/db.js");

app.use(express.json());

app.get("/", (req, res) => {
  res.send("HOME PAGE");
});
app.use("/", contactRouter);

app.listen(8080, async () => {
  try {
    await connection;
    console.log("connected to db");
  } catch (e) {
    console.log(e);
  }

  console.log("listening 8080");
});
