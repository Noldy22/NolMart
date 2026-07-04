const cache = new Map();

export async function getAllText(lang1='en', lang2='sw') {

    const mainSection = document.querySelector('main');
    const texts = mainSection.querySelectorAll('p, .heading, .sub-heading');

    const promises = Array.from(texts).map(async (el) => {
        const original = el.textContent;

        const translated = await translateCache(cache, original, lang1, lang2);
        el.textContent = translated;
    });

    await Promise.all(promises);
}

async function translateCache(cache, text, lang1, lang2) {
    if (cache.has(text)) return cache.get(text);

    const textLength = text.length;
    let translated;

    if (textLength > 499) {
      const firstHalf = text.slice(0,Math.round(textLength/2));
      const secondHalf = text.slice(Math.round(textLength/2), textLength);

      const [firstPart, secondPart] = await Promise.all([
        translateCache(cache, firstHalf, lang1, lang2),
        translateCache(cache, secondHalf, lang1, lang2) // Assuming the second half is different
      ]);

      translated = firstPart + secondPart
    } else {
      translated = await translateArticle(text, lang1, lang2);
    }

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