
document.addEventListener('DOMContentLoaded', () => {
    imageSizer();

    window.addEventListener('resize', imageSizer)
})

function imageSizer() {
    const aboutImage = document.querySelectorAll('.about-section .image-section.halved');

    const VAL = 100;

    aboutImage.forEach(section => {
        const aboutImageOne = section.querySelector('img.first-half');
        const aboutImageTwo = section.querySelector('img.second-half');

        aboutImageOne.style.objectPosition = `0% center`;
        aboutImageTwo.style.objectPosition = `calc(0% - ${(aboutImageTwo.clientWidth)}px) center`;
    })
}