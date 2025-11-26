// --- 변수 설정 --- 
ClickBattle.init("ZERO");
const GRID_SIZE = 10;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;
const GAME_DURATION = 3 * 60; // 3분 (180초)

let timeRemaining = GAME_DURATION;
let isGameRunning = false;
let computerIntervalId = null;
let timerIntervalId = null;
let playerTiles = 0;
let computerTiles = 0;

// DOM 요소
const gridElement = document.getElementById('grid');
const timerElement = document.getElementById('timer');
const playerScoreElement = document.getElementById('player-score');
const computerScoreElement = document.getElementById('computer-score');

// 제어 버튼 DOM 요소 (수정됨)
const actionButton = document.getElementById('action-button');
const resetButton = document.getElementById('reset-button');
const modalRestartButton = document.getElementById('modal-restart-button'); // 모달 버튼

const modal = document.getElementById('modal');
const modalMessage = document.getElementById('modal-message');
const modalScores = document.getElementById('modal-scores');

// 퍼센티지 바 관련 DOM 요소
const playerPercentageBar = document.getElementById('player-percentage-bar');
const computerPercentageBar = document.getElementById('computer-percentage-bar');
const playerPercentageText = document.getElementById('player-percentage');
const computerPercentageText = document.getElementById('computer-percentage');


// --- 헬퍼 함수 ---

// 타이머와 AI를 시작
function startTimerAndAI() {
    timerIntervalId = setInterval(timerTick, 1000);
    setComputerSpeed();
}

// 타이머와 AI를 정지
function stopTimerAndAI() {
    if (timerIntervalId) clearInterval(timerIntervalId);
    if (computerIntervalId) clearInterval(computerIntervalId);
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
        resetButton.disabled = true;
    }
}

// --- 게임 제어 ---

// 게임 시작, 일시 정지, 재개 기능 통합
function toggleGame() {
    if (!isGameRunning && timeRemaining === GAME_DURATION) {
        // 1. 게임 시작 (Initial -> Running)
        isGameRunning = true;
        startTimerAndAI();
        updateButtonState('running');
    } else if (isGameRunning) {
        // 2. 일시 정지 (Running -> Paused)
        isGameRunning = false;
        stopTimerAndAI();
        updateButtonState('paused');
    } else if (!isGameRunning && timeRemaining < GAME_DURATION) {
        // 3. 재개 (Paused -> Running)
        isGameRunning = true;
        startTimerAndAI();
        updateButtonState('running');
    }
}

function resetGame() {
    // 모든 상태 초기화
    timeRemaining = GAME_DURATION;
    playerTiles = 0;
    computerTiles = 0;
    isGameRunning = false;

    // 인터벌 중지
    stopTimerAndAI();

    // UI 업데이트
    updateTimerDisplay();
    updateScoreDisplay();
    updatePercentageBar();
    createGrid();
    modal.style.display = 'none';

    // 버튼 상태 초기화
    updateButtonState('initial');



}

// --- 게임 로직 ---

function createGrid() {
    gridElement.innerHTML = '';
    for (let i = 0; i < TOTAL_TILES; i++) {
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
}

// 퍼센티지 바 업데이트
function updatePercentageBar() {
    const playerPct = (playerTiles / TOTAL_TILES) * 100;
    const computerPct = (computerTiles / TOTAL_TILES) * 100;

    playerPercentageBar.style.width = `${playerPct}%`;
    computerPercentageBar.style.width = `${computerPct}%`;

    playerPercentageText.textContent = `${Math.round(playerPct)}%`;
    computerPercentageText.textContent = `${Math.round(computerPct)}%`;
}

// 타일 클릭 (플레이어 또는 컴퓨터)
function handleTileClick(tile, byWhom) {
    if (!isGameRunning) return;

    const isPlayer = (byWhom === 'player');
    const isPlayerTile = tile.classList.contains('player-tile');
    const isComputerTile = tile.classList.contains('computer-tile');

    if (isPlayer) {
        // 👇 [ClickBattle.recordClick();] 삽입: 사용자(파랑) 클릭 시점

        ClickBattle.recordClick();


        if (isComputerTile) {
            tile.classList.remove('computer-tile');
            computerTiles--;
        }
        if (!isPlayerTile) {
            tile.classList.add('player-tile');
            playerTiles++;
        }
    } else { // 컴퓨터가 클릭한 경우
        if (isPlayerTile) {
            tile.classList.remove('player-tile');
            playerTiles--;
        }
        if (!isComputerTile) {
            tile.classList.add('computer-tile');
            computerTiles++;
        }
    }
    updateScoreDisplay();
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

    // 다음 턴을 위해 인터벌 재설정 (속도 조절)
    setComputerSpeed();
}

// 컴퓨터 클릭 속도 설정 (시간이 줄어들수록 빨라지거나, 전부 차지 시 느려짐)
function setComputerSpeed() {
    if (computerIntervalId) clearInterval(computerIntervalId);

    let delay;

    if (computerTiles === TOTAL_TILES) {
        // 컴퓨터가 모든 자리를 차지한 경우: 속도 대폭 감소 (2초에 한 번 클릭)
        delay = 2000;
    } else {
        // 일반적인 속도 조절 (시간이 줄어들수록 빨라짐)
        const maxDelay = 400; // 초기 지연 시간 (0.4초)
        const minDelay = 40;  // 최소 지연 시간 (0.04초)

        const normalizedTime = timeRemaining / GAME_DURATION; // 1.0(시작) -> 0.0(종료)
        delay = normalizedTime * (maxDelay - minDelay) + minDelay;

        // 최소/최대값 보장
        delay = Math.min(maxDelay, Math.max(minDelay, delay));
    }

    computerIntervalId = setInterval(computerTurn, delay);
}


// --- 타이머 및 게임 종료 ---
function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function timerTick() {
    if (timeRemaining > 0) {
        timeRemaining--;
        updateTimerDisplay();
    } else {
        endGame();
    }
}

function endGame() {
    isGameRunning = false;
    stopTimerAndAI();

    // 버튼 상태 초기화
    updateButtonState('ended');

    // 결과 판정
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
    modalScores.innerHTML = `최종 점수: <br> 나 (파랑): **${playerTiles}** | 컴퓨터 (빨강): **${computerTiles}**`;
    modal.style.display = 'block';
}

// --- 이벤트 리스너 ---
actionButton.addEventListener('click', toggleGame);
resetButton.addEventListener('click', resetGame);
modalRestartButton.addEventListener('click', resetGame); // 모달에서 다시 시작

// --- 초기 실행 ---
resetGame(); // 페이지 로드 시 게임 초기화

