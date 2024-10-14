const translations = {
en:"Download current page",
fr: "Télécharger la page"
}

document$.subscribe( function () {

    const downloadButton = document.getElementById("pdf-download");
    const buttonText = document.getElementById("button-text")
    const currentLanguage = document.documentElement.lang || "en"
  
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

    if (translations[currentLanguage]) {
        buttonText.textContent = translations[currentLanguage];
      } else {
        buttonText.textContent = translations["en"];  // Default to English if the language is not available
      }
  });