const express = require("express");
const router = express.Router();
const { Chat } = require("../models");
const { createClient } = require("redis");

// Create Redis client
const redis = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redis.connect().catch(console.error);

// Keep track of message version for polling
let messageVersion = 0;

// Render chat page
router.get("/chat", (req, res) => {
  res.render("chat");
});

// Get all messages
router.get("/chat/all", async (req, res) => {
  try {
    const messages = await redis.lRange("chat_messages", 0, -1);
    res.json({ messages: messages.map((msg) => JSON.parse(msg)) });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Send message
router.post("/send", async (req, res) => {
  try {
    const { message } = req.body;
    const messageObj = {
      text: message,
      timestamp: new Date().toISOString(),
    };

    await redis.rPush("chat_messages", JSON.stringify(messageObj));
    messageVersion++;

    return res.json({ success: true });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ error: "Failed to send message" });
  }
});

// Long polling endpoint
router.get("/poll", (req, res) => {
  const clientVersion = parseInt(req.query.version) || 0;

  // Set timeout for the response
  const timeout = setTimeout(() => {
    res.status(304).end();
  }, 30000); // 30 seconds timeout

  // Clean up on request close
  req.on("close", () => {
    clearTimeout(timeout);
  });

  if (messageVersion > clientVersion) {
    clearTimeout(timeout);
    return res.json({ version: messageVersion });
  } else {
    setTimeout(() => {
      clearTimeout(timeout);
      if (messageVersion > clientVersion) {
        return res.json({ version: messageVersion });
      }
      return res.status(304).end();
    }, 1000);
  }
});

// Save chat to database
router.post("/save", async (req, res) => {
  try {
    const messages = await redis.lRange("chat_messages", 0, -1);
    const parsedMessages = messages.map((msg) => JSON.parse(msg));

    await Chat.create({
      messages: parsedMessages, // Make sure this matches your model schema
      createdAt: new Date(),
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("Error saving chat:", error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
