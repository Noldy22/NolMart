const axios = require("axios");

module.exports = async (req, res) => {
  try {
    const { text, source, target } = req.body;

    const response = await axios.get(
      "https://api.mymemory.translated.net/get",
      {
        params: {
          q: text,
          langpair: `${source}|${target}`
        }
      }
    );

    return res.status(200).json({
      translatedText: response.data.responseData.translatedText
    });

  } catch (err) {
    console.log("ERROR:", err.message);

    return res.status(500).json({
      error: err.message
    });
  }
};