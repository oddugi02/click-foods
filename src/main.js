const title = document.querySelector('#title');
const button = document.querySelector('#button');


title.classList.add("titleMotion")

let touchCount = 0;
button.ontouchend = () => {
    touchCount += 1;
    if (touchCount === 1) {
        title.textContent = '추억의 음시'
    } else if (touchCount === 2) {
        title.textContent = '추억의 음'
    } else if (touchCount === 3) {
        title.textContent = '추억의 ㅇ'
    } else if (touchCount === 4) {
        title.textContent = '추억의'
    } else if (touchCount === 5) {
        title.textContent = '추억'
    } else if (touchCount === 6) {
        title.textContent = '추어'
    } else if (touchCount === 7) {
        title.textContent = '추'
    } else if (touchCount === 8) {
        title.textContent = 'ㅊ'
    } else if (touchCount === 9) {
        title.textContent = ''
        button.style.display = 'none';
        setTimeout(() => {
            window.location.href = "home.html"
        }, 500)
    }
}

