// models/contact.js
const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  phoneNumber: String,
  email: String,
  linkedId: { type: mongoose.Schema.Types.ObjectId, ref: "Contact" },
  linkPrecedence: { type: String, enum: ["primary", "secondary"] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
  deletedAt: Date,
});

const Contact = mongoose.model("Contact", contactSchema);

module.exports = Contact;
