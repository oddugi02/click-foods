// --- 변수 설정 (최소화) --- 
const STAGES = [
    { duration: 30, size: 4, totalTiles: 16, colorClass: 'player-tile-stage1' }, // 4x4
    { duration: 30, size: 5, totalTiles: 25, colorClass: 'player-tile-stage2' }, // 5x5
    { duration: 30, size: 6, totalTiles: 36, colorClass: 'player-tile-stage3' }, // 6x6
    { duration: 30, size: 7, totalTiles: 49, colorClass: 'player-tile-stage4' }, // 7x7
    { duration: 30, size: 8, totalTiles: 64, colorClass: 'player-tile-stage5' }, // 8x8
    { duration: 30, size: 9, totalTiles: 81, colorClass: 'player-tile-stage6' }, // 9x9
];

const TOTAL_STAGES = STAGES.length;

// ... (나머지 변수 및 로직은 그대로 유지)

let currentStageIndex = 0;
let timeRemainingInStage = STAGES[0].duration;
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
const actionButton = document.getElementById('action-button');
const resetButton = document.getElementById('reset-button');
const modal = document.getElementById('modal');
const modalMessage = document.getElementById('modal-message');
const modalScores = document.getElementById('modal-scores');
const modalRestartButton = document.getElementById('modal-restart-button');
const playerPercentageBar = document.getElementById('player-percentage-bar');
const computerPercentageBar = document.getElementById('computer-percentage-bar');
const playerPercentageText = document.getElementById('player-percentage');
const computerPercentageText = document.getElementById('computer-percentage');
const cheerMessageElement = document.getElementById('cheer-message');

// 🚩 수정된 부분 시작: 모달 버튼을 생성 시점에 바로 참조
const modalContent = document.querySelector('.modal-content');

// 1. 버튼 생성 및 ID 부여
const modalStageRetryButton = document.createElement('button');
modalStageRetryButton.id = 'modal-stage-retry-button';
modalStageRetryButton.textContent = '현재 스테이지 재도전';

const modalNextStageButton = document.createElement('button');
modalNextStageButton.id = 'modal-next-stage-button';
modalNextStageButton.textContent = '다음 스테이지 도전';

// 2. 버튼을 모달 내용 컨테이너에 추가 (기존 '다시 시작' 버튼 앞에 추가)
// modalContent.appendChild(modalRestartButton) 이후에 추가하는 것이 더 자연스러울 수 있으나,
// 기존 로직이 '다시 시작' 버튼 외에 동적 버튼 2개를 추가했으므로,
// 모달의 자식 요소들을 확보한 후 마지막에 추가하도록 순서를 조정합니다.

// 기존 '다시 시작' 버튼 (modalRestartButton) 참조는 이미 확보됨
// 새로운 버튼들을 '다시 시작' 버튼 앞에 삽입하여 순서를 맞춥니다.
modalContent.insertBefore(modalNextStageButton, modalRestartButton);
modalContent.insertBefore(modalStageRetryButton, modalNextStageButton);

// 🚩 수정된 부분 끝

// NEW: 현재 스테이지 표시 DOM 요소 찾기
const infoBarElement = document.querySelector('.info-bar');
let stageDisplay = document.getElementById('stage-display');
// stageDisplay가 HTML에 없다면 여기서 생성 (기존 로직 유지)
if (!stageDisplay) {
    stageDisplay = document.createElement('p');
    stageDisplay.id = 'stage-display';
    infoBarElement.insertBefore(stageDisplay, infoBarElement.children[1]);
}

let cheerIntervalId = null;

const PLAYER_WIN_MESSAGES = ['👏 점령전 승리! 완벽해요!', '✨ 당신이 앞서고 있어요!', '👍 클릭 속도 최강!', '🏆 승리의 깃발을 꽂으세요!', '🎉 독보적인 점유율!'];
const DRAW_MESSAGES = ['🤝 막상막하! 멈추지 마세요!', '⚔️ 치열한 접전! 집중하세요!', '💨 역전의 기회는 지금!', '⚖️ 균형을 깨고 나아가세요!'];
const COMPUTER_WIN_MESSAGES = ['🔥 분발하세요! 다시 빼앗아 오세요!', '😢 잠시 밀리고 있어요! 힘내세요!', '💪 역전의 드라마를 써보세요!', '⚡ 집중력 발휘! 질 수 없어요!'];


// --- 헬퍼 함수 ---

function getCurrentStage() {
    return STAGES[currentStageIndex];
}

function updateStageDisplay() {
    stageDisplay.textContent = `스테이지: ${currentStageIndex + 1} / ${TOTAL_STAGES}`;
}

function startTimerAndAI() {
    timerIntervalId = setInterval(timerTick, 1000);
    setComputerSpeed();
}

function stopTimerAndAI() {
    if (timerIntervalId) clearInterval(timerIntervalId);
    if (computerIntervalId) clearInterval(computerIntervalId);
}

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

function toggleGame() {
    const isInitialStart = timeRemainingInStage === getCurrentStage().duration && playerTiles === 0 && computerTiles === 0;

    if (!isGameRunning && (isInitialStart || timeRemainingInStage < getCurrentStage().duration)) {
        // 시작 또는 재개
        isGameRunning = true;
        startTimerAndAI();
        startCheerMessage();
        updateButtonState('running');
    } else if (isGameRunning) {
        // 일시 정지
        isGameRunning = false;
        stopTimerAndAI();
        stopCheerMessage();
        updateButtonState('paused');
    }
}

function resetGame() {
    currentStageIndex = 0;
    timeRemainingInStage = STAGES[0].duration;
    playerTiles = 0;
    computerTiles = 0;
    isGameRunning = false;

    stopTimerAndAI();
    stopCheerMessage();

    updateStageDisplay();
    updateTimerDisplay();
    updateScoreDisplay();
    updatePercentageBar();
    createGrid(getCurrentStage().size);
    modal.style.display = 'none';

    // 타일 초기화 후 'playerTiles'와 'computerTiles'를 0으로 설정했으므로
    // 퍼센티지 바 초기화를 위해 updateScoreDisplay() 다시 호출
    updateScoreDisplay();

    updateButtonState('initial');
}

function transitionToNextStage() {
    currentStageIndex++;
    if (currentStageIndex < TOTAL_STAGES) {
        const nextStage = getCurrentStage();
        timeRemainingInStage = nextStage.duration;
        playerTiles = 0;
        computerTiles = 0;

        updateStageDisplay();
        updateTimerDisplay();
        updateScoreDisplay();
        createGrid(nextStage.size);
        modal.style.display = 'none';

        isGameRunning = true;
        startTimerAndAI();
        startCheerMessage();
        updateButtonState('running');
    } else {
        // 모든 스테이지 완료 -> 최종 게임 종료
        endStage(true);
    }
}

function retryCurrentStage() {
    const currentStage = getCurrentStage();
    timeRemainingInStage = currentStage.duration;
    playerTiles = 0;
    computerTiles = 0;

    // 타일 상태를 빈 상태로 초기화 (색상 클래스만 제거)
    Array.from(gridElement.children).forEach(tile => {
        STAGES.forEach(stage => tile.classList.remove(stage.colorClass));
        tile.classList.remove('computer-tile');
    });

    updateStageDisplay();
    updateTimerDisplay();
    updateScoreDisplay();
    modal.style.display = 'none';

    isGameRunning = true;
    startTimerAndAI();
    startCheerMessage();
    updateButtonState('running');
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

function updateScoreDisplay() {
    playerScoreElement.textContent = playerTiles;
    computerScoreElement.textContent = computerTiles;

    // 🚩 핵심 수정: 퍼센티지 바 색상 업데이트
    const playerColorClass = getCurrentStage().colorClass;

    // 1. 기존의 스테이지 색상 클래스를 모두 제거
    STAGES.forEach(stage => playerPercentageBar.classList.remove(stage.colorClass));

    // 2. 현재 스테이지의 색상 클래스를 퍼센티지 바에 추가
    //    (CSS에서 .player-tile-stageX가 배경색을 가지고 있어야 합니다.)
    playerPercentageBar.classList.add(playerColorClass);

    updatePercentageBar();
}

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

function updateScoreDisplay() {
    playerScoreElement.textContent = playerTiles;
    computerScoreElement.textContent = computerTiles;
    updatePercentageBar();
}

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

// 🚩 핵심 수정: handleTileClick 함수를 올바르게 정의하고 닫습니다.
function handleTileClick(tile, byWhom) {
    if (!isGameRunning) return;

    const playerColorClass = getCurrentStage().colorClass;
    const isPlayer = (byWhom === 'player');

    // 현재 상태 플래그
    const wasComputerTile = tile.classList.contains('computer-tile');
    const wasPlayerTile = tile.classList.contains(playerColorClass);

    // 모든 이전 스테이지의 플레이어 색상 클래스 제거 (현재 스테이지 색상만 남기기 위함)
    STAGES.forEach(stage => tile.classList.remove(stage.colorClass));

    if (isPlayer) {
        if (wasComputerTile) {
            tile.classList.remove('computer-tile');
            computerTiles--;
        }

        // 이 타일이 플레이어의 것이 아니었다면 점수 증가
        if (!wasPlayerTile) {
            playerTiles++;
        }

        // 현재 스테이지 색상 클래스 적용 (획득)
        tile.classList.add(playerColorClass);

    } else { // 컴퓨터가 클릭한 경우
        if (wasPlayerTile) {
            playerTiles--;
        }

        if (!wasComputerTile) {
            tile.classList.add('computer-tile');
            computerTiles++;
        }
    }
    updateScoreDisplay();
} // 🚩 handleTileClick 함수가 여기서 정상적으로 닫힙니다.


// 🚩 이제부터는 전역 함수들입니다.

function computerTurn() {
    if (!isGameRunning) return;

    const targetableTiles = Array.from(gridElement.children).filter(tile =>
        // 컴퓨터 타일이 아닌 타일 (빈 타일이거나 플레이어 타일)
        !tile.classList.contains('computer-tile')
    );

    if (targetableTiles.length > 0) {
        const randomIndex = Math.floor(Math.random() * targetableTiles.length);
        const tileToClaim = targetableTiles[randomIndex];
        handleTileClick(tileToClaim, 'computer');
    }

    setComputerSpeed();
}

function setComputerSpeed() {
    if (computerIntervalId) clearInterval(computerIntervalId);

    // 🚩 고정 딜레이 설정 (기존 로직의 초기 속도에 가까운 값으로 설정)
    // 예시: 500ms (0.5초)마다 클릭 (원하는 속도에 따라 이 값을 조절할 수 있습니다.)
    const FIXED_DELAY = 430
        ;

    computerIntervalId = setInterval(computerTurn, FIXED_DELAY);
}


// --- 타이머 및 게임 종료 ---

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemainingInStage / 60);
    const seconds = timeRemainingInStage % 60;
    timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function timerTick() {
    if (timeRemainingInStage > 0) {
        timeRemainingInStage--;

        updateTimerDisplay();
        updateCheerMessage();

        if (timeRemainingInStage === 0) {
            endStage(false); // 단계 종료
        }
    }
}

// isFinalGame: 전체 게임 종료인지 (true) 단계 종료인지 (false)
function endStage(isFinalGame) {
    isGameRunning = false;
    stopTimerAndAI();
    stopCheerMessage();
    updateButtonState('paused');

    let message = '';

    if (playerTiles > computerTiles) {
        message = isFinalGame ? '🎉 모든 스테이지 완료! 최종 승리! 🎉' : `✅ ${currentStageIndex + 1} 스테이지 승리!`;
        // confetti 함수가 전역에 정의되어 있다고 가정
        if (typeof confetti === 'function') confetti();
    } else if (computerTiles > playerTiles) {
        message = isFinalGame ? '😢 최종 패배입니다. 😢' : `❌ ${currentStageIndex + 1} 스테이지 패배.`;
    } else {
        message = isFinalGame ? '🤝 모든 스테이지 무승부입니다! 🤝' : `⏸️ ${currentStageIndex + 1} 스테이지 무승부.`;
    }

    modalMessage.textContent = message;
    modalScores.innerHTML = `점수:<br> 나: **${playerTiles}** | 컴퓨터: **${computerTiles}**`;
    modal.style.display = 'block';

    // 모달 버튼 제어
    modalRestartButton.style.display = 'none';

    if (isFinalGame) {
        modalStageRetryButton.style.display = 'none';
        modalNextStageButton.style.display = 'none';
        modalRestartButton.style.display = 'inline-block';
        modalRestartButton.textContent = '처음부터 다시 시작';
    } else {
        modalStageRetryButton.style.display = 'inline-block';
        modalNextStageButton.style.display = 'inline-block';
        // 다음 스테이지가 없으면 '다음 스테이지 도전' 버튼 숨김
        if (currentStageIndex === TOTAL_STAGES - 1) {
            modalNextStageButton.style.display = 'none';
        }
    }
}


// 🌈 응원 메시지 함수 

function updateCheerMessage() {
    let messages;

    if (playerTiles > computerTiles) {
        messages = PLAYER_WIN_MESSAGES;
    } else if (playerTiles === computerTiles) {
        messages = DRAW_MESSAGES;
    } else {
        messages = COMPUTER_WIN_MESSAGES;
    }

    const randomIndex = Math.floor(Math.random() * messages.length);
    cheerMessageElement.textContent = messages[randomIndex];
    cheerMessageElement.style.opacity = 1;
}

function startCheerMessage() {
    if (cheerIntervalId) clearInterval(cheerIntervalId);
    cheerIntervalId = setInterval(updateCheerMessage, 3000);
    updateCheerMessage();
}

function stopCheerMessage() {
    if (cheerIntervalId) clearInterval(cheerIntervalId);
    cheerMessageElement.style.opacity = 0;
}


// --- 이벤트 리스너 ---
actionButton.addEventListener('click', toggleGame);
resetButton.addEventListener('click', resetGame);
modalStageRetryButton.addEventListener('click', retryCurrentStage);
modalNextStageButton.addEventListener('click', transitionToNextStage);
modalRestartButton.addEventListener('click', resetGame);


// --- 초기 실행 ---
resetGame();