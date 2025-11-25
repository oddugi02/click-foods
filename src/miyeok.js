const clouds = document.querySelectorAll(".cloud");
const popup = document.getElementById("popup");
const popupContent = document.getElementById("popupContent");
const closeBtn = document.getElementById("closePopup");
const subCloudArea = document.getElementById("subCloudArea");

// 상위 생각구름 원래 제목
const cloudOriginalTitles = {
    1: "생일날",
    2: "너무 많은 미역",
    3: "미역에 대하여…",
    4: "미역국 먹는 법",
    5: "생각보다 다양한"
};

// 단계별 줄어드는 메시지 (마지막은 공백)
const cloudMessages = {
    1: ["생일날", "생일나", "생일ㄴ", "생일", "생ㅇ", "생", "새", "ㅅ", " "],
    2: ["너무 많은 미역", "너무 많은 미", "너무 많은", "너무 많", "너무", "너", "ㄴ", " "],
    3: ["미역에 대하여…", "미역에 대하여", "미역에 대하", "미역에 대", "미역에", "미역", "미", "ㅁ", " "],
    4: ["미역국 먹는 법", "미역국 먹는", "미역국 먹", "미역국", "미역", "미", "ㅁ", " "],
    5: ["생각보다 다양한", "생각보다 다양", "생각보다 다", "생각보다", "생각보", "생각", "생", "새", "ㅅ", " "]
};

// 하위 생각구름
const subClouds = [
    { title: "미역이란", text: "미역은 바다에서 서식하는 갈조류에 속하는 해조류이며, 뿌리·줄기·잎과 같은 형태를 띠지만 식물은 아니다. <br><br>엽상체, 줄기부, 부착기, 생식기관(미역귀)으로 이루어져 있으며, 요오드, 칼슘, 식이섬유, 비타민 등이 풍부하다." },
    { title: "미역의 효능", text: "칼슘 / 요오드 / 식이섬유 / 비타민 / 혈압 조절 / 소화 기능 개선" },
    { title: "미역이 사는곳", text: "한국의 서남해안(완도, 진도 등)과 울산 앞바다처럼 물살이 세거나 청정한 해역에서 주로 서식하며, 파도가 잔잔하고 수심이 얕은 곳에서도 잘 자란다." },
    { title: "미역 색", text: "놀랍게도 ‘부산기억기장미역색’이라는 미역의 색상이 존재한다. 컬러코드는 #2024050이다." }
];

// 클릭 횟수 초기화
const clickCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
const subClickCounts = {};
let activeCloudId = null;

// 모든 클라우드에 타원형 + 랜덤 tilt 적용
function applyTilt(cloud) {
    cloud.style.borderRadius = "50px";
    const rand = Math.random() < 0.5 ? 'tiltLeft' : 'tiltRight';
    cloud.classList.add(rand);
}

// 상위 생각구름 클릭 이벤트
clouds.forEach(cloud => {
    applyTilt(cloud);

    cloud.addEventListener("click", () => {
        const id = cloud.dataset.id;
        clickCounts[id]++;
        const messages = cloudMessages[id];
        const index = Math.min(clickCounts[id], messages.length - 1);
        cloud.textContent = messages[index];

        if (messages[index] === " ") {
            if (id === "3") {
                // 하위 구름 생성 + 글자 원상복귀
                cloud.textContent = cloudOriginalTitles[id];
                clickCounts[id] = 0;
                generateSubClouds();
            } else {
                activeCloudId = id;
                showPopup(id);
            }
        }
    });
});

// 팝업 열기
function showPopup(cloudId) {
    popupContent.innerHTML = getCloudContent(cloudId);
    document.querySelector(".popup-title").textContent = cloudOriginalTitles[cloudId];
    popup.classList.remove("hidden");
}

// X 버튼 클릭
closeBtn.addEventListener("click", () => {
    popup.classList.add("hidden");

    // 상위 구름 복원
    if (activeCloudId) {
        const cloud = document.querySelector(`.cloud[data-id="${activeCloudId}"]`);
        cloud.textContent = cloudOriginalTitles[activeCloudId];
        clickCounts[activeCloudId] = 0;
        activeCloudId = null;
    }

    // 하위 구름 복원
    Object.keys(subClickCounts).forEach(subId => {
        const subCloudEl = document.querySelector(`.sub-cloud[data-subid="${subId}"]`);
        if (subCloudEl) {
            subCloudEl.textContent = subCloudEl.dataset.title;
            subClickCounts[subId] = 0;
        }
    });
});

let subCloudsGenerated = false; // 하위 구름 생성 여부 체크

function generateSubClouds() {
    if (subCloudsGenerated) return; // 이미 생성되었다면 재생성 금지
    subCloudsGenerated = true;

    subClouds.forEach((item, idx) => {
        // 이미 DOM에 존재하면 재생성하지 않음
        if (document.querySelector(`.sub-cloud[data-subid="${idx}"]`)) return;

        const el = document.createElement("div");
        el.classList.add("sub-cloud");
        el.textContent = item.title;
        el.dataset.title = item.title;
        el.dataset.subid = idx;
        subClickCounts[idx] = 0;

        // 타원형 + 랜덤 tilt 적용
        el.style.borderRadius = "50px";
        const rand = Math.random() < 0.5 ? 'tiltLeft' : 'tiltRight';
        el.classList.add(rand);

        // 클릭 이벤트 (글자만 줄이기)
        el.addEventListener("click", () => {
            subClickCounts[idx]++;
            const len = item.title.length;
            const newLen = Math.max(0, len - subClickCounts[idx]);
            el.textContent = item.title.slice(0, newLen) || " ";

            if (el.textContent === " ") {
                popupContent.innerHTML = `<b>${item.title}</b><br>${item.text}`;
                document.querySelector(".popup-title").textContent = item.title;
                popup.classList.remove("hidden");
            }
        });

        subCloudArea.appendChild(el);
    });
}



// 상위 구름 내용 반환
function getCloudContent(id) {
    switch (id) {
        case "1": return "미역국하면 생일에 먹던 미역국이 떠오르지 않나요?<br>이러한 전통은 출산 후 산모 회복을 돕는 미역의 효능에서 비롯되었으며,<br>어머니의 은혜를 기리는 의미가 담겨 있답니다!";
        case "2": return "을 불리면 국이 다 넘치고 큰일이 나니 조심하세요..";
        case "3": return "<b>하위 생각구름을 클릭해보세요</b>";
        case "4": return "1. 숟가락을 든다 <br> 2. 밥을 만다 <br> 3. 호호 분다 <br>4. 떠먹는다 <br><br> 밥이 없다면 유감.. <br> 그치만 없어도 맛있다!";
        case "5": return "<b>미역국의 종류</b>:<br>- 소고기미역국<br>- 황태미역국<br>- 전복미역국<br>- 들깨미역국<br>- 참치미역국<br>- 새우미역국<br>- 닭가슴살미역국 <br><br> 이렇게 많은줄 몰랐다..";

        default: return "";
    }
}

function applyRandomTilt(cloud) {
    cloud.style.borderRadius = "50px";

    // tiltLeft 또는 tiltRight 랜덤 선택
    const randClass = Math.random() < 0.5 ? "tiltLeft" : "tiltRight";
    cloud.classList.add(randClass);

    // 애니메이션 딜레이 랜덤
    const delay = Math.random() * 2 + "s"; // 0 ~ 2초 랜덤
    cloud.style.animationDelay = delay;

    // 애니메이션 속도도 살짝 랜덤
    const duration = 2 + Math.random() * 2 + "s"; // 2 ~ 4초
    cloud.style.animationDuration = duration;

    // 반복은 무한
    cloud.style.animationIterationCount = "infinite";
}

// 상위 구름 적용
clouds.forEach(cloud => applyRandomTilt(cloud));

const back = document.getElementById("back");

// back 전용 단계별 메시 (마지막은 공백)
const backMessages = ["홈으로가기", "홈으로가", "홈으로", "홈으", "홈", "호", "ㅎ", " "];

let backClickCount = 0;

back.addEventListener("click", () => {
    const index = Math.min(backClickCount, backMessages.length - 1);
    back.textContent = backMessages[index];
    backClickCount++;

    if (backMessages[index] === " ") {
        setTimeout(() => {
            window.location.href = "home.html";
        }, 300);
    }
});


const bob = document.getElementById("bob");

bob.addEventListener("click", () => {
    // 팝업 제목
    document.querySelector(".popup-title").textContent = "정보";
    // 팝업 내용
    popupContent.innerHTML = `
        이름: 쌀밥 또는 밥<br>
        포지션: 미역국과 친한 사이<br>
        미역국과의 궁합: 좋다
    `;
    // 팝업 보이기
    popup.classList.remove("hidden");

    // 클릭한 대상 초기화
    activeCloudId = null;
});










