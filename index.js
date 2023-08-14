// server.js
const express = require("express");
const bodyParser = require("body-parser");
const Contact = require("./model/contact");
const { connection } = require("./config/db");

const app = express();
app.use(bodyParser.json());

app.post("/identify", async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return res
        .status(400)
        .json({ error: "Email or phoneNumber is required." });
    }

    let primaryContact;
    if (email) {
      primaryContact = await Contact.findOne({
        email,
        linkPrecedence: "primary",
      });
    }
    if (!primaryContact && phoneNumber) {
      primaryContact = await Contact.findOne({
        phoneNumber,
        linkPrecedence: "primary",
      });
    }

    if (!primaryContact) {
      // Create a new primary contact
      primaryContact = await Contact.create({
        phoneNumber,
        email,
        linkPrecedence: "primary",
      });
    }

    const secondaryContacts = await Contact.find({
      $or: [
        { email, linkPrecedence: "secondary" },
        { phoneNumber, linkPrecedence: "secondary" },
      ],
      linkedId: primaryContact._id,
    });

    const contactInfo = {
      primaryContactId: primaryContact._id,
      emails: [
        primaryContact.email,
        ...secondaryContacts.map((contact) => contact.email),
      ],
      phoneNumbers: [
        primaryContact.phoneNumber,
        ...secondaryContacts.map((contact) => contact.phoneNumber),
      ],
      secondaryContactIds: secondaryContacts.map((contact) => contact._id),
    };

    return res.status(200).json({ contact: contactInfo });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "An error occurred." });
  }
});

app.listen(8080, async () => {
  try {
    await connection;
    console.log("connected to db");
  } catch (e) {
    console.log(e);
  }

  console.log("listening 8080");
});
