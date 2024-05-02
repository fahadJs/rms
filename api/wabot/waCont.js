const poolConnection = require("../../config/database");
const fetch = require("node-fetch");

const sendMessage = async (req, res) => {
  try {
    // Retrieve parameters from the query string
    const { message, number } = req.params;

    // Check if message and number are provided
    if (!message || !number) {
      res.status(400).json({ error: "Message and number are required" });
    }

    // WhatsApp API endpoint
    const apiUrl = "https://app.wabot.my/api/send";

    // Data to be sent in the request body
    const data = {
      number: number,
      type: "text",
      message: message,
      instance_id: "662D19546A2F8",
      access_token: "662d18de74f14",
    };

    // Make POST request to WhatsApp API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    console.log(response);

    // Check if request was successful
    if (!response.ok) {
      // Check for specific error responses
      if (response.status === 403) {
        res.status(400).json({ error: "Number is not on WhatsApp" });
        return; // End the function execution
      } else {
        throw new Error("Failed to send message");
      }
    }

    // Message sent successfully
    res
      .status(200)
      .json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    // Error occurred
    console.error("Error:", error.message);
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};

module.exports = {
  sendMessage,
};
