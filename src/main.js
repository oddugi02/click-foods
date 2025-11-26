// --- 변수 설정 --- 

// NEW: 단계별 설정
const STAGES = [
    // colorClass는 'player-tile-stageX' 형태의 CSS 클래스를 사용합니다.
    { duration: 60, size: 5, totalTiles: 25, colorClass: 'player-tile-stage1' }, // 1단계: 1분, 5x5 (기본 파랑)
    { duration: 60, size: 7, totalTiles: 49, colorClass: 'player-tile-stage2' }, // 2단계: 1분, 7x7 (보라색)
    { duration: 60, size: 8, totalTiles: 64, colorClass: 'player-tile-stage3' }  // 3단계: 1분, 8x8 (청록색)
];

const TOTAL_GAME_DURATION = STAGES.reduce((sum, stage) => sum + stage.duration, 0); // 180초 (3분)

let currentStageIndex = 0;
let timeRemainingInGame = TOTAL_GAME_DURATION; // 전체 게임 남은 시간 (총 흐름 제어용)
let isGameRunning = false;
let computerIntervalId = null;
let timerIntervalId = null;
let playerTiles = 0; // 현재 단계에서 획득한 타일 수
let computerTiles = 0; // 현재 단계에서 획득한 타일 수

// NEW: 전투 불능/탈출 챌린지 관련 변수
let defeatModalCount = 0;
const DEFEAT_CHALLENGE_THRESHOLD = 10;
let challengeButtonPresses = 0;
let isDefeatMode = false;

// DOM 요소
const gridElement = document.getElementById('grid');
const timerElement = document.getElementById('timer');
const playerScoreElement = document.getElementById('player-score');
const computerScoreElement = document.getElementById('computer-score');
const cheerTicker = document.getElementById('cheer-ticker'); // NEW: 응원 전광판

// 제어 버튼 DOM 요소
const actionButton = document.getElementById('action-button');
const resetButton = document.getElementById('reset-button');
const modalRestartButton = document.getElementById('modal-restart-button'); // 일반 모달 버튼
const defeatModalContainer = document.getElementById('defeat-modal-container'); // NEW: 전투 불능 컨테이너

const modal = document.getElementById('modal');
const modalMessage = document.getElementById('modal-message');
const modalScores = document.getElementById('modal-scores');


// 퍼센티지 바 관련 DOM 요소
const playerPercentageBar = document.getElementById('player-percentage-bar');
const computerPercentageBar = document.getElementById('computer-percentage-bar');
const playerPercentageText = document.getElementById('player-percentage');
const computerPercentageText = document.getElementById('computer-percentage');


// --- 헬퍼 함수 ---

// 현재 단계 정보 반환
function getCurrentStage() {
    return STAGES[currentStageIndex];
}

/**
 * 현재 스테이지의 남은 시간(초)을 계산합니다.
 */
function getCurrentStageTimeRemaining() {
    let subsequentDuration = 0;
    // 현재 단계 이후의 모든 단계의 총 시간 계산
    for (let i = currentStageIndex + 1; i < STAGES.length; i++) {
        subsequentDuration += STAGES[i].duration;
    }
    // 현재 스테이지 남은 시간 = 전체 남은 시간 - 다음 스테이지들의 총 시간
    return timeRemainingInGame - subsequentDuration;
}

// 타이머와 AI를 시작
function startTimerAndAI() {
    timerIntervalId = setInterval(timerTick, 1000);
    setComputerSpeed();
    updateCheerTicker(); // NEW: 전광판 업데이트 시작
}

// 타이머와 AI를 정지
function stopTimerAndAI() {
    if (timerIntervalId) clearInterval(timerIntervalId);
    if (computerIntervalId) clearInterval(computerIntervalId);
    cheerTicker.style.animationPlayState = 'paused'; // NEW: 전광판 정지
}

// 버튼 상태 업데이트
function updateButtonState(state) {
    if (state === 'running') {
        actionButton.textContent = '일시 정지';
        actionButton.disabled = false;
        resetButton.disabled = false;
    } else if (state === 'paused') {
        actionButton.textContent = '재개';
        actionButton.disabled = false;
        resetButton.disabled = false;
    } else { // 'initial' or 'ended'
        actionButton.textContent = '게임 시작';
        actionButton.disabled = false;
        resetButton.disabled = (state === 'initial');
    }
}

// NEW: 응원 메시지 전광판 업데이트
function updateCheerTicker() {
    cheerTicker.style.animationPlayState = 'running';
    let message;

    // 현재 스테이지의 절반 이상 타일을 확보한 경우 (이기는 중)
    if (playerTiles > computerTiles && playerTiles > getCurrentStage().totalTiles * 0.4) {
        message = '⭐ 잘하고 있어요! 화이팅! 🚀 끝까지 집중하세요! 🏆 승리가 눈앞에 있습니다! ⭐ ';
    }
    // 현재 스테이지에서 밀리고 있는 경우 (지는 중)
    else if (computerTiles > playerTiles || playerTiles < getCurrentStage().totalTiles * 0.2) {
        message = '😢 조금만 더 힘내요 ㅠㅠ 🦾 괜찮아요! 이길 수 있어요! 🥇 지금이 반격의 기회! 🎮 ';
    }
    // 무승부 또는 초기 상태
    else {
        message = '💡 게임에 집중! 💪 타일을 차지하세요! 🏁 누가 더 빠를까요? 🌟 ';
    }

    // 메시지를 반복해서 이어 붙여서 자연스러운 흐름 연출
    cheerTicker.textContent = message.repeat(5);
}


// --- 게임 제어 ---

// 게임 시작, 일시 정지, 재개 기능 통합
function toggleGame() {
    if (isDefeatMode) return; // 전투 불능 모드에서는 버튼 작동 방지

    if (!isGameRunning && timeRemainingInGame === TOTAL_GAME_DURATION) {
        // 1. 게임 시작 (Initial -> Running)
        isGameRunning = true;
        startTimerAndAI();
        updateButtonState('running');
    } else if (isGameRunning) {
        // 2. 일시 정지 (Running -> Paused)
        isGameRunning = false;
        stopTimerAndAI();
        updateButtonState('paused');
    } else if (!isGameRunning && timeRemainingInGame < TOTAL_GAME_DURATION) {
        // 3. 재개 (Paused -> Running)
        isGameRunning = true;
        startTimerAndAI();
        updateButtonState('running');
    }
}

function resetGame() {
    // 모든 상태 초기화
    currentStageIndex = 0;
    timeRemainingInGame = TOTAL_GAME_DURATION;
    playerTiles = 0;
    computerTiles = 0;
    isGameRunning = false;
    isDefeatMode = false;
    defeatModalCount = 0;
    challengeButtonPresses = 0;

    // 인터벌 중지
    stopTimerAndAI();

    // UI 업데이트 (1단계 그리드 생성)
    updateTimerDisplay();
    updateScoreDisplay();
    updatePercentageBar();
    createGrid(getCurrentStage().size);
    modal.style.display = 'none';
    defeatModalContainer.innerHTML = ''; // 전투 불능 모달 초기화

    // 버튼 상태 초기화
    updateButtonState('initial');
    updateCheerTicker(); // 전광판 초기 메시지 설정
}

// 단계 전환
function transitionToNextStage() {
    // 현재 단계에서 획득한 타일 초기화
    playerTiles = 0;
    computerTiles = 0;

    // 현재 단계에서 플레이어가 획득한 타일의 클래스를 제거합니다.
    Array.from(gridElement.children).forEach(tile => {
        STAGES.forEach(stage => tile.classList.remove(stage.colorClass));
        tile.classList.remove('computer-tile');
    });

    currentStageIndex++;
    const nextStage = getCurrentStage();

    // UI 업데이트: 그리드 및 점수판 초기화 및 새 그리드 생성
    createGrid(nextStage.size);
    updateScoreDisplay(); // 점수판 0으로 업데이트
    updateTimerDisplay(); // 타이머를 다음 단계 시작 시간(1:00)으로 표시
    updateCheerTicker(); // 전광판 업데이트

    // AI 속도 재설정 (interval ID 갱신)
    setComputerSpeed();
}


// --- 게임 로직 ---

function createGrid(size) {
    gridElement.innerHTML = '';
    gridElement.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

    const totalTiles = size * size;

    for (let i = 0; i < totalTiles; i++) {
        const tile = document.createElement('div');
        tile.classList.add('tile');
        tile.dataset.index = i;
        tile.addEventListener('click', () => handleTileClick(tile, 'player'));
        gridElement.appendChild(tile);
    }
}

// 타일 점수 및 퍼센티지 업데이트
function updateScoreDisplay() {
    playerScoreElement.textContent = playerTiles;
    computerScoreElement.textContent = computerTiles;
    updatePercentageBar();
    updateCheerTicker(); // 점수 변경 시 전광판 업데이트 (응원 메시지 변경 가능)
}

// 퍼센티지 바 업데이트
function updatePercentageBar() {
    const { totalTiles } = getCurrentStage();

    if (totalTiles === 0) return;

    const playerPct = (playerTiles / totalTiles) * 100;
    const computerPct = (computerTiles / totalTiles) * 100;

    playerPercentageBar.style.width = `${playerPct}%`;
    computerPercentageBar.style.width = `${computerPct}%`;

    playerPercentageText.textContent = `${Math.round(playerPct)}%`;
    computerPercentageText.textContent = `${Math.round(computerPct)}%`;
}

// 타일 클릭 (플레이어 또는 컴퓨터)
function handleTileClick(tile, byWhom) {
    if (!isGameRunning) return;

    // 현재 단계의 색상 클래스 가져오기
    const playerColorClass = getCurrentStage().colorClass;

    const isPlayer = (byWhom === 'player');
    const isPlayerTile = tile.classList.contains(playerColorClass);
    const isComputerTile = tile.classList.contains('computer-tile');

    // 타일의 모든 플레이어 색상 클래스를 미리 제거 (중복 방지)
    STAGES.forEach(stage => tile.classList.remove(stage.colorClass));

    if (isPlayer) {
        if (isComputerTile) {
            tile.classList.remove('computer-tile');
            computerTiles--;
        }
        if (!isPlayerTile) {
            tile.classList.add(playerColorClass); // 현재 단계의 색상 적용
            playerTiles++;
        }
    } else { // 컴퓨터가 클릭한 경우
        if (isPlayerTile) {
            playerTiles--;
        }
        if (!isComputerTile) {
            tile.classList.add('computer-tile');
            computerTiles++;
        }
    }
    updateScoreDisplay();

    // NEW: 전투 불능 조건 확인
    if (computerTiles === getCurrentStage().totalTiles || playerTiles === 0 && computerTiles > 0) {
        enterDefeatMode();
    }
}


// 컴퓨터 AI 로직 (빈 타일 또는 플레이어 타일을 노림)
function computerTurn() {
    if (!isGameRunning) return;

    const targetableTiles = Array.from(gridElement.children).filter(tile =>
        !tile.classList.contains('computer-tile')
    );

    if (targetableTiles.length > 0) {
        const randomIndex = Math.floor(Math.random() * targetableTiles.length);
        const tileToClaim = targetableTiles[randomIndex];
        handleTileClick(tileToClaim, 'computer');
    }

    setComputerSpeed();
}

// 컴퓨터 클릭 속도 설정
function setComputerSpeed() {
    if (computerIntervalId) clearInterval(computerIntervalId);

    const RAMP_UP_DURATION = 30; // 30초 동안 속도 증가
    const RAMP_UP_END_TIME = TOTAL_GAME_DURATION - RAMP_UP_DURATION;

    const MAX_DELAY = 700;   // 초기 지연 시간 (0.7초) - 가장 느림
    const CONSTANT_DELAY = 150; // 최종/유지 지연 시간 (0.15초) - 적당한 속도

    let delay;

    if (timeRemainingInGame > RAMP_UP_END_TIME) {
        // 램프업 구간
        const rampUpTimePassed = TOTAL_GAME_DURATION - timeRemainingInGame;
        const normalizedRampUp = rampUpTimePassed / RAMP_UP_DURATION;

        delay = MAX_DELAY - (normalizedRampUp * (MAX_DELAY - CONSTANT_DELAY));

    } else if (computerTiles === getCurrentStage().totalTiles) {
        // 컴퓨터 만점 시 속도 대폭 감소 (전투 불능 조건에 걸리므로 사실상 의미 없음)
        delay = 2000;
    } else {
        // 유지 구간
        delay = CONSTANT_DELAY;
    }

    delay = Math.min(MAX_DELAY, Math.max(CONSTANT_DELAY, delay));

    computerIntervalId = setInterval(computerTurn, delay);
}


// --- 전투 불능 및 탈출 챌린지 로직 (NEW) ---

function createDefeatModal() {
    // 현재 모달 카운트에 맞는 모달 생성
    defeatModalCount++;

    const modalElement = document.createElement('div');
    modalElement.classList.add('defeat-modal');
    modalElement.style.zIndex = 20 + defeatModalCount; // z-index를 증가시켜 중첩 효과

    const contentElement = document.createElement('div');
    contentElement.classList.add('defeat-modal-content');

    let messageHTML = '';
    let buttonText = '나가기';
    let buttonClass = 'defeat-button';
    let isChallenge = (defeatModalCount >= DEFEAT_CHALLENGE_THRESHOLD);

    if (isChallenge) {
        messageHTML = `
            <h2>🚨 탈출 챌린지 시작! 🚨</h2>
            <p class="challenge-message">이 상황을 벗어나 현재 스테이지에 재도전하려면,</p>
            <p class="challenge-message">아래 버튼을 **<span id="challenge-count">${DEFEAT_CHALLENGE_THRESHOLD - challengeButtonPresses}</span>** 번 연타하세요!</p>
        `;
        buttonText = '연타!';
        buttonClass = 'challenge-button defeat-button'; // 추가 클래스
    } else {
        messageHTML = `
            <h2>💀 전투 불능! 💀</h2>
            <p>컴퓨터가 모든 자리를 차지했습니다.</p>
            <p>현재까지 ${defeatModalCount}개의 창이 열렸습니다.</p>
        `;
    }

    contentElement.innerHTML = messageHTML + `<button class="${buttonClass}">${buttonText}</button>`;
    modalElement.appendChild(contentElement);
    defeatModalContainer.appendChild(modalElement);

    // 모달 표시
    modalElement.style.display = 'block';

    // 이벤트 리스너 설정
    const button = contentElement.querySelector('button');
    if (isChallenge) {
        button.addEventListener('click', handleChallengePress);
    } else {
        button.addEventListener('click', () => handleDefeatModalClose(modalElement));
    }
}

function handleDefeatModalClose(modalElement) {
    // 닫기 버튼을 누를 때마다 현재 모달을 제거하고 새 모달을 생성
    modalElement.remove();

    // 10회 미만일 경우 다음 중첩 모달 생성
    if (defeatModalCount < DEFEAT_CHALLENGE_THRESHOLD) {
        createDefeatModal();
    } else {
        // 10회 이상일 경우 탈출 챌린지 시작
        startChallengeMode();
    }
}

function startChallengeMode() {
    // 탈출 챌린지 모드 활성화
    challengeButtonPresses = 0;
    createDefeatModal(); // 챌린지 모달 생성
}

function handleChallengePress(event) {
    challengeButtonPresses++;
    const countElement = document.getElementById('challenge-count');

    if (challengeButtonPresses < DEFEAT_CHALLENGE_THRESHOLD) {
        countElement.textContent = DEFEAT_CHALLENGE_THRESHOLD - challengeButtonPresses;
    } else {
        // 탈출 성공!
        exitDefeatModeAndRestartStage();
    }
}

function enterDefeatMode() {
    isGameRunning = false;
    isDefeatMode = true;
    stopTimerAndAI();
    updateButtonState('ended'); // 버튼 비활성화

    // 기존 모달 제거
    defeatModalContainer.innerHTML = '';
    defeatModalCount = 0;
    challengeButtonPresses = 0;

    // 첫 번째 전투 불능 모달 생성
    createDefeatModal();
}

function exitDefeatModeAndRestartStage() {
    isDefeatMode = false;
    defeatModalContainer.innerHTML = ''; // 모든 중첩 모달 제거

    // 현재 스테이지 초기화 (재도전)
    playerTiles = 0;
    computerTiles = 0;

    // 현재 스테이지의 총 시간을 계산하여 남은 전체 시간에 반영 (예: 2단계 재시작 시 120초로 복귀)
    let currentStageStartRemainingTime = 0;
    for (let i = currentStageIndex; i < STAGES.length; i++) {
        currentStageStartRemainingTime += STAGES[i].duration;
    }
    timeRemainingInGame = currentStageStartRemainingTime;


    // 그리드와 점수 초기화
    createGrid(getCurrentStage().size);
    updateScoreDisplay();
    updateTimerDisplay();

    // 게임 다시 시작
    isGameRunning = true;
    startTimerAndAI();
    updateButtonState('running');
}


// --- 타이머 및 게임 종료 ---
function updateTimerDisplay() {
    // 변경: 전체 게임 시간 대신 현재 스테이지 남은 시간만 표시
    const timeInStage = getCurrentStageTimeRemaining();

    const minutes = Math.floor(timeInStage / 60);
    const seconds = timeInStage % 60;

    // 60s -> 1:00, 59s -> 0:59
    timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function timerTick() {
    if (timeRemainingInGame > 0) {
        timeRemainingInGame--;
        updateTimerDisplay(); // 매 틱마다 현재 스테이지 시간으로 업데이트

        // 다음 단계가 시작되는 시점의 남은 전체 시간 계산
        let nextStageStartTime = 0;
        for (let i = currentStageIndex + 1; i < STAGES.length; i++) {
            nextStageStartTime += STAGES[i].duration;
        }

        // 남은 전체 시간이 다음 스테이지 시작 시간과 같으면 단계 전환
        if (timeRemainingInGame === nextStageStartTime) {
            if (currentStageIndex < STAGES.length - 1) {
                transitionToNextStage();
            }
        }

    } else {
        endGame();
    }
}

function endGame() {
    isGameRunning = false;
    stopTimerAndAI();

    // 버튼 상태 초기화
    updateButtonState('ended');

    // 결과 판정 (마지막 단계 결과로 최종 승패 결정)
    let message = '';
    if (playerTiles > computerTiles) {
        message = '🎉 당신의 승리입니다! 🎉';
    } else if (computerTiles > playerTiles) {
        message = '😢 컴퓨터가 승리했습니다. 😢';
    } else {
        message = '🤝 무승부입니다! 🤝';
    }

    // 모달 표시
    modalMessage.textContent = message;
    modalScores.innerHTML = `최종 점수: (마지막 단계 기준)<br> 나 (파랑): **${playerTiles}** | 컴퓨터 (빨강): **${computerTiles}**`;
    modal.style.display = 'block';
}

// --- 이벤트 리스너 ---
actionButton.addEventListener('click', toggleGame);
resetButton.addEventListener('click', resetGame);
modalRestartButton.addEventListener('click', resetGame); // 모달에서 다시 시작

// --- 초기 실행 ---
resetGame(); // 페이지 로드 시 게임 초기화

