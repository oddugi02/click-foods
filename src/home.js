// 3×3 정사각형 9개 자동 생성
const foodGrid = document.getElementById("foodGrid");
const yumText = document.getElementById("yumText"); // 🔥 냠 텍스트 요소

// 넣고 싶은 제목 9개
const titles = [
    "미역국",
    "김밥",
    "떡볶이와 순대",
    "슬러시",
    "모닝사과",
    "라면",
    "붕어빵",
    "밥과 김",
    "귤"
];

// 제목별 설정(클릭 시 문구 배열 + 이동할 URL)
const settings = {
    "미역국": {
        messages: ["미역구", "미역ㄱ", "미역", "미여", "미ㅇ", "미", "ㅁ", " "],
        targetURL: "miyeok.html"
    },
    "김밥": {
        messages: ["김바", "김ㅂ", "김", "기", "ㄱ", " "],
        targetURL: "gimbap.html"
    },
    "떡볶이와 순대": {
        messages: ["떡볶이와 순", "떡볶이와", "떡볶이", "떡볶", "떡", " "],
        targetURL: "tteok.html"
    },
    "슬러시": {
        messages: ["슬러ㅅ", "슬러", "슬ㄹ", "슬", "스", "ㅅ", " "],
        targetURL: "slush.html"
    },
    "모닝사과": {
        messages: ["모닝사ㄱ", "모닝사", "모닝ㅅ", "모닝", "모니", "모ㄴ", "모", "ㅁ", " "],
        targetURL: "apple.html"
    },
    "라면": {
        messages: ["라며", "라ㅁ", "라", "ㄹ", " "],
        targetURL: "ramen.html"
    },
    "붕어빵": {
        messages: ["붕어빠", "붕어ㅃ", "붕어", "붕ㅇ", "붕", "부", "ㅂ", " "],
        targetURL: "fishbread.html"
    },
    "밥과 김": {
        messages: ["밥과 기", "밥과 ㄱ", "밥과", "밥고", "밥ㄱ", "밥", "바", "ㅂ", " "],
        targetURL: "rice.html"
    },
    "귤": {
        messages: ["규", "ㄱ", " "],
        targetURL: "orange.html"
    }
};

titles.forEach(title => {
    const box = document.createElement("div");
    box.className = "food-box";

    const label = document.createElement("span");
    label.textContent = title;
    box.appendChild(label);

    // 🔥 랜덤 좌/우 흔들기
    const randomSide = Math.random() > 0.5 ? "tilt-left" : "tilt-right";
    box.classList.add(randomSide);

    // 🔥 랜덤 딜레이
    const delay = (Math.random() * 1).toFixed(2);
    box.style.animationDelay = `${delay}s`;

    // 🔥 클릭 이벤트
    let index = 0;
    const data = settings[title];

    box.addEventListener("click", () => {

        // ---- 🔥 '냠' 등장 ----
        yumText.classList.add("show");
        setTimeout(() => {
            yumText.classList.remove("show");
        }, 400);

        // ---- 다음 텍스트로 변경 ----
        if (data.messages[index]) {
            label.textContent = data.messages[index];
            index++;
        }

        // ---- 문구가 " " 되면 0.5초 후 이동 ----
        if (label.textContent === " ") {
            setTimeout(() => {
                window.location.href = data.targetURL;
            }, 300);
        }
    });

    foodGrid.appendChild(box);
});







