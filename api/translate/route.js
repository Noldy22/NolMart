const axios = require("axios");

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const DEEPL_API_URL = "https://api-free.deepl.com/v2/translate";

export async function POST(request) {
  try {
      // This will now parse correctly because the framework passes the request object properly
      const { text, sourceLang, targetLang } = await request.json();
      
      const response = await axios.post(DEEPL_API_URL, 
          {
              text: [text], 
              source_lang: sourceLang || null, // Sends null to DeepL if sourceLang is empty/falsy
              target_lang: targetLang
          },
          {
              headers: {
                  'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
                  'Content-Type': 'application/json'
              }
          }
      );
      
      const translatedResult = response.data.translations[0].text;
      
      return new Response(JSON.stringify({ translatedText: translatedResult }), {
          headers: { 'Content-Type': 'application/json' }
      });

  } catch (error) {
      console.error("Backend Axios Error:", error.response ? error.response.data : error.message);
      return new Response(JSON.stringify({ error: "Translation failed" }), { status: 500 });
  }
}


/*
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
};*/