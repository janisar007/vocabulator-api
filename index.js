// backend/server.js
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const fs = require('fs');

const app = express();
const PORT = 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors({
    origin: 'https://email-client-new.vercel.app', // Replace this with your frontend URL
  }));
app.use(fileUpload()); // Enable file upload support

// Route to handle sending emails with optional PDF attachment
app.post('/send-emails', async (req, res) => {
  const { emailList, subject, message, yourEmail, yourPass } = req.body;
  const pdfFile = req.files?.pdfFile;

  if (!subject || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!emailList) {
    return res.status(400).json({ error: 'Missing email fields' });
  }

//   console.log(emailList)

  // Create a nodemailer transporter
  let transporter = nodemailer.createTransport({
    service: 'Gmail', // You can change to another service if needed
    auth: {
      user: 'jssansari1005@gmail.com', // Replace with your email
      pass: 'xecccczpcdjuyuph', // Replace with your email password or app password
    },
  });

  try {
    // Create mail options with optional attachment
    const mailOptions = {
      from: 'jssansari1005@gmail.com',
      subject: subject,
      text: message,
      attachments: pdfFile
        ? [
            {
              filename: pdfFile.name,
              content: pdfFile.data, // `express-fileupload` provides the file data in `pdfFile.data`
            },
          ]
        : [],
    };

    // Send emails to each recipient
    // for (let email of emailList) {
    //   await transporter.sendMail({ ...mailOptions, to: email });
    // }

    await transporter.sendMail({ ...mailOptions, to: emailList });

    res.status(200).json({ message: 'Emails sent successfully' });
  } catch (error) {
    console.error('Error sending emails:', error);
    res.status(500).json({ error: 'Failed to send emails' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
