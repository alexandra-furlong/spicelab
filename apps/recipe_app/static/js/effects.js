function fadeElementTextIn() {
  var imageElement = document.querySelector(".scrollFade");
  var textElement = document.querySelector(".scrollFade-text");
  var position = imageElement.getBoundingClientRect().top;

  // Adjust the threshold value to control when the element starts fading in
  var threshold = window.innerHeight * 0.8;

  if (position < threshold) {
    imageElement.classList.add("scrollFade-visible");
    imageElement.classList.add('hazy-overlay');

    if (textElement) {
        setTimeout(function() {
            textElement.classList.add("scrollFade-text-fadein");
        }, 1000);
    }
  }
}

window.addEventListener('scroll', fadeElementTextIn);
