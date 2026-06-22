const axios = require("axios");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { text, source, target } = req.body;

    // call translation API here
    const response = await axios.post(
      "https://libretranslate.com/translate",
      {
        text,
        source,
        target
      }
    );

    res.status(200).json(response.data);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message
    });
  }
};