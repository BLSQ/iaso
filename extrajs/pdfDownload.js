const translations = {
  en: { currentPage: "Download current page", userGuide: "Download user guide", generating: "Generating…" },
  fr: { currentPage: "Télécharger la page", userGuide: "Télécharger le guide utilisateur", generating: "Génération…" },
  es: { currentPage: "Descargar la página actual", userGuide: "Descargar la guía de usuario", generating: "Generando…" },
}

// Every page under the Users tab (Home > Users in mkdocs.yml), in nav order.
// Fetched and combined client-side into a single PDF by the "Download user
// guide" button - update this list whenever a page is added to/removed from
// that nav section.
const USER_GUIDE_PAGES = [
  "pages/users/how_to/get_started_with_iaso.html",
  "pages/users/reference/iaso_concepts.html",
  "pages/users/reference/iaso_modules.html",
  "pages/users/reference/user_guide.html",
  "pages/users/reference/iaso_mobile.html",
  "pages/users/how_to/setup_dhis2_login_in_iaso.html",
  "pages/users/FAQ/faq.html",
]

document$.subscribe(function () {
  const currentLanguage = document.documentElement.lang || "en"
  const t = translations[currentLanguage] || translations.en

  const downloadButton = document.getElementById("pdf-download")
  const buttonText = document.getElementById("button-text")
  buttonText.textContent = t.currentPage

  downloadButton.addEventListener("click", function () {
    const element = document.querySelector('.md-content');
    const options = {
      margin:       1,
      filename:     'openiaso.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().from(element).set(options).save();
  });

  const userGuideButton = document.getElementById("pdf-download-user-guide")
  const userGuideButtonText = document.getElementById("user-guide-button-text")
  userGuideButtonText.textContent = t.userGuide

  userGuideButton.addEventListener("click", function () {
    downloadUserGuide(currentLanguage, userGuideButton, userGuideButtonText, t)
  })
});

async function downloadUserGuide(lang, button, buttonText, t) {
  const originalText = buttonText.textContent
  const localePrefix = lang === "en" ? "" : lang + "/"
  const origin = window.location.origin

  button.disabled = true
  buttonText.textContent = t.generating

  const container = document.createElement("div")
  container.style.position = "absolute"
  container.style.left = "-99999px"
  container.style.top = "0"
  container.style.width = "800px"
  document.body.appendChild(container)

  try {
    for (const path of USER_GUIDE_PAGES) {
      const pageUrl = origin + "/" + localePrefix + path
      const response = await fetch(pageUrl)
      if (!response.ok) continue

      const html = await response.text()
      const parsedPage = new DOMParser().parseFromString(html, "text/html")
      const content = parsedPage.querySelector(".md-content__inner")
      if (!content) continue

      // relative image/link paths are only valid on the page they came from -
      // resolve them against that page's URL before moving the content over
      content.querySelectorAll("img[src], a[href]").forEach(function (el) {
        const attr = el.tagName === "IMG" ? "src" : "href"
        const value = el.getAttribute(attr)
        if (value && !/^([a-z]+:)?\/\//i.test(value) && !value.startsWith("#")) {
          el.setAttribute(attr, new URL(value, pageUrl).href)
        }
      })

      content.querySelectorAll(".md-content__button, .md-icon").forEach((el) => el.remove())

      const section = document.createElement("div")
      section.className = "pdf-user-guide-section"
      section.appendChild(content)
      container.appendChild(section)
    }

    await html2pdf().from(container).set({
      margin: 0.5,
      filename: "iaso-user-guide.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      pagebreak: { mode: ["css"], before: ".pdf-user-guide-section:not(:first-child)" },
    }).save()
  } finally {
    container.remove()
    button.disabled = false
    buttonText.textContent = originalText
  }
}