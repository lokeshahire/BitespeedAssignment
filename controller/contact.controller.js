const mongoose = require("mongoose");
const Contact = require("../model/contact");

const findContactAndParent = async (attribute, value) => {
  try {
    let contact, parentContact;

    // Find the contact using Mongoose
    contact = await Contact.findOne({ [attribute]: value }).sort("createdAt");

    parentContact =
      contact === null || contact?.linkedPrecedence === "primary"
        ? contact
        : await Contact.findOne({ _id: contact.linkedId });

    return [true, parentContact];
  } catch (error) {
    console.log("error: ", error);
    return [false, error.message];
  }
};

exports.createContact = async (req, res) => {
  try {
    let { email: email_, phoneNumber: phoneNumber_ } = req.body;

    if (!email_ && !phoneNumber_)
      return res.json({ message: "Need at least one field" });

    if (phoneNumber_) phoneNumber_ = phoneNumber_.toString();

    const existingContact = await Contact.findOne({
      $and: [{ phoneNumber: phoneNumber_ }, { email: email_ }],
    });

    let parentId;

    if (!existingContact) {
      let [phoneContactSuccess, phoneContact] = await findContactAndParent(
        "phoneNumber",
        phoneNumber_
      );

      if (!phoneContactSuccess)
        return res.status(500).json({
          error: phoneContact,
        });

      let [emailContactSuccess, emailContact] = await findContactAndParent(
        "email",
        email_
      );

      if (!emailContactSuccess)
        return res.status(500).json({
          error: emailContact,
        });

      if (!phoneContact && !emailContact) {
        // No contact exists - Create New Contact
        const newContact = await Contact.create(req.body);
        parentId = newContact._id;
      } else if (emailContact?.id !== phoneContact?.id) {
        if (
          emailContact === null ||
          emailContact?.createdAt > phoneContact?.createdAt
        ) {
          parentId = phoneContact._id;
          await Contact.create({
            email: email_,
            phoneNumber: phoneNumber_,
            linkedPrecedence: "secondary",
            linkedId: phoneContact._id,
          });

          await Contact.updateMany(
            {
              $or: [{ _id: emailContact._id }, { linkedId: emailContact._id }],
            },
            {
              linkedPrecedence: "secondary",
              linkedId: phoneContact._id,
            }
          );
        } else {
          parentId = emailContact._id;
          await Contact.create({
            email: email_,
            phoneNumber: phoneNumber_,
            linkedPrecedence: "secondary",
            linkedId: emailContact._id,
          });

          await Contact.updateMany(
            {
              $or: [{ _id: phoneContact._id }, { linkedId: phoneContact._id }],
            },
            {
              linkedPrecedence: "secondary",
              linkedId: emailContact._id,
            }
          );
        }
      } else {
        parentId = emailContact._id;
        await Contact.create({
          email: email_,
          phoneNumber: phoneNumber_,
          linkedPrecedence: "secondary",
          linkedId: emailContact._id,
        });
      }
    } else {
      parentId = existingContact.linkedId || existingContact._id;
    }

    const allContacts = await Contact.find({
      $or: [{ _id: parentId }, { linkedId: parentId }],
    });

    let emails = new Set(),
      phoneNumbers = new Set(),
      sids = [];

    allContacts.forEach((item) => {
      if (item.email) emails.add(item.email);
      if (item.phoneNumber) phoneNumbers.add(item.phoneNumber);
      if (item._id.toString() !== parentId.toString()) sids.push(item._id);
    });

    res.status(200).json({
      contact: {
        primaryContactId: parentId,
        emails: [...emails],
        phoneNumbers: [...phoneNumbers],
        secondaryContactIds: sids,
      },
    });
  } catch (error) {
    console.log(error);
    res.json({ message: error.message });
  }
};
