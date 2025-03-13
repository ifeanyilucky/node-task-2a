const nodemailer = require("nodemailer");
const axios = require("axios");
const mysql = require("mysql2/promise");
const { google } = require("googleapis");

const executeTask = async (task, input) => {
  switch (task.type) {
    case "email":
      return await sendMail(input);
    case "http":
      return await makeHttpRequest(input);
    case "notification":
      throw new Error("Notification handler not implemented yet");
    case "MYSQL_SELECT":
      return await executeMySqlQuery(input);
    case "DRIVE_UPLOAD":
      return await uploadToDrive(input);
    default:
      throw new Error("Invalid task type");
  }
};

const sendMail = async (email) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Test Email from Flow Builder",
    text: "This is a test email from Flow Builder",
  });

  return { message: "Email sent successfully" };
};

const makeHttpRequest = async (url) => {
  const response = await axios.get(url);
  return response.data;
};

const executeMySqlQuery = async (input) => {
  const [table, id] = input.split("|");

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  const [rows] = await connection.execute(
    `SELECT * FROM ${table} WHERE id = ?`,
    [id]
  );

  await connection.end();
  return rows[0];
};

const uploadToDrive = async (content) => {
  const auth = new google.auth.GoogleAuth({
    keyFile: "path/to/credentials.json",
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });

  const drive = google.drive({ version: "v3", auth });

  const fileMetadata = {
    name: `flow-builder-${Date.now()}.txt`,
    parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
  };

  const media = {
    mimeType: "text/plain",
    body: content,
  };

  const file = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: "id, webViewLink",
  });

  return {
    fileId: file.data.id,
    webViewLink: file.data.webViewLink,
  };
};

module.exports = { executeTask };
