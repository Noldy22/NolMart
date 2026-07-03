const cache = new Map();


// CHANGE TO GET TRANSLATED TEXT. USE SOME CODE LANGAUGE FROM BUILD-GUIDES.JS
async function getAllText(text, lang1='en', lang2='sw') {
    await translateCache(cache, text, lang1, lang2);

    await Promise.all(promises);
}

async function translateCache(cache, text, lang1, lang2) {
    if (cache.has(text)) return cache.get(text);

    translated = await translateArticle(text, lang1, lang2);
    cache.set(text, translated);
    
    return translated;
}

async function translateArticle(text, sourceLang, targetLang) {
  const response = await fetch("/api/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text,
      source: sourceLang,
      target: targetLang
    })
  });

  const data = await response.json();
  return data.translatedText;
}