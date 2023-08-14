const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    email: String,
    phoneNumber: String,
    linkedPrecedence: String,
    linkedId: { type: mongoose.Schema.Types.ObjectId, ref: "Contact" },
  },
  { timestamps: true }
);

const Contact = mongoose.model("Contact", contactSchema);

module.exports = Contact;
