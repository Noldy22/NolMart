const axios = require("axios");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    let body = req.body;

    if (typeof body === "string") {
      body = JSON.parse(body);
    }

    const { text, source, target } = body;

    // call translation API here
    const response = await axios.post(
      "https://libretranslate.com/translate",
      {
        q: text,
        source: source,
        target: target,
        format: "text"
      }
    );

    res.status(200).json(response.data);

  } catch (err) {
    console.log("STATUS:", err.response?.status);
    console.log("DATA:", err.response?.data);
    console.log("MESSAGE:", err.message);

    return res.status(500).json({
      error: err.response?.data || err.message
    });
  }
};