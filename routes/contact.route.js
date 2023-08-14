const express = require("express");
const contactRouter = express.Router();
const ContactController = require("../controller/contact.controller");

contactRouter.post("/identify", ContactController.createContact);

module.exports = contactRouter;
