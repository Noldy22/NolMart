export async function getAllText(lang1='en', lang2='sw') {

    const mainSection = document.querySelector('main');
    const texts = mainSection.querySelectorAll('p, .heading, .sub-heading');

    const cache = new Map();

    const promises = Array.from(texts).map(async (el) => {
        const original = el.textContent;
        const translated = await translateCache(cache, original, lang1, lang2);

        el.textContent = translated;
    });

    await Promise.all(promises);
}

async function translateCache(cache, text, lang1, lang2) {
    if (cache.has(text)) return cache.get(text);

    const translated = await translateArticle(text, lang1, lang2);
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

switchLanguageButtons();

function switchLanguageButtons() {
    const translateButtonContainer = document.querySelector('.floating-button.translate-float');
    if (!translateButtonContainer) return;

    translateButtonContainer.classList.add('active');

    translateButtonContainer.addEventListener('click', (event) => {
        const frontButton = translateButtonContainer.querySelector('.front-button');
        const backButton = translateButtonContainer.querySelector('.back-button');

        //en = english, sw = swahili
        const lang1 = frontButton.dataset.language;
        const lang2 = backButton.dataset.language;

        for (const button of [frontButton,backButton]) {
            button.classList.toggle('front-button');
            button.classList.toggle('back-button')
        }

        getAllText(lang1, lang2);
    })
}