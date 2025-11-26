// --- 변수 설정 --- 
// NEW: 단계별 설정 (10개의 스테이지, 모두 10x10 크기)
const STAGES = [
    // duration: 60초. size: 10x10 (100칸)
    { duration: 60, size: 10, totalTiles: 100, colorClass: 'player-tile-stage1' },
    { duration: 60, size: 10, totalTiles: 100, colorClass: 'player-tile-stage2' },
    { duration: 60, size: 10, totalTiles: 100, colorClass: 'player-tile-stage3' },
    { duration: 60, size: 10, totalTiles: 100, colorClass: 'player-tile-stage4' },
    { duration: 60, size: 10, totalTiles: 100, colorClass: 'player-tile-stage5' },
    { duration: 60, size: 10, totalTiles: 100, colorClass: 'player-tile-stage6' },
    { duration: 60, size: 10, totalTiles: 100, colorClass: 'player-tile-stage7' },
    { duration: 60, size: 10, totalTiles: 100, colorClass: 'player-tile-stage8' },
    { duration: 60, size: 10, totalTiles: 100, colorClass: 'player-tile-stage9' },
    { duration: 60, size: 10, totalTiles: 100, colorClass: 'player-tile-stage10' },
];

const TOTAL_STAGES = STAGES.length;
const TOTAL_GAME_DURATION = STAGES.reduce((sum, stage) => sum + stage.duration, 0); // 600초

let currentStageIndex = 0;
let timeRemainingInGame = TOTAL_GAME_DURATION;
let timeRemainingInStage = STAGES[0].duration; // 현재 단계 남은 시간
let isGameRunning = false;
let computerIntervalId = null;
let timerIntervalId = null;
let playerTiles = 0; // 현재 단계에서 획득한 타일 수
let computerTiles = 0; // 현재 단계에서 획득한 타일 수

// DOM 요소
const gridElement = document.getElementById('grid');
const timerElement = document.getElementById('timer');
const playerScoreElement = document.getElementById('player-score');
const computerScoreElement = document.getElementById('computer-score');

// 제어 버튼 DOM 요소
const actionButton = document.getElementById('action-button');
const resetButton = document.getElementById('reset-button');
const modalRestartButton = document.getElementById('modal-restart-button');

const modal = document.getElementById('modal');
const modalMessage = document.getElementById('modal-message');
const modalScores = document.getElementById('modal-scores');

// 퍼센티지 바 관련 DOM 요소
const playerPercentageBar = document.getElementById('player-percentage-bar');
const computerPercentageBar = document.getElementById('computer-percentage-bar');
const playerPercentageText = document.getElementById('player-percentage');
const computerPercentageText = document.getElementById('computer-percentage');

// NEW: 응원 메시지 DOM 요소 및 목록
const cheerMessageElement = document.getElementById('cheer-message');
let cheerIntervalId = null;

const PLAYER_WIN_MESSAGES = [
    '👏 점령전 승리! 완벽해요!', '✨ 당신이 앞서고 있어요!', '👍 클릭 속도 최강!', '🏆 승리의 깃발을 꽂으세요!', '🎉 독보적인 점유율!'
];
const DRAW_MESSAGES = [
    '🤝 막상막하! 멈추지 마세요!', '⚔️ 치열한 접전! 집중하세요!', '💨 역전의 기회는 지금!', '⚖️ 균형을 깨고 나아가세요!'
];
const COMPUTER_WIN_MESSAGES = [
    '🔥 분발하세요! 다시 빼앗아 오세요!', '😢 잠시 밀리고 있어요! 힘내세요!', '💪 역전의 드라마를 써보세요!', '⚡ 집중력 발휘! 질 수 없어요!'
];


// --- 헬퍼 함수 ---

// 현재 단계 정보 반환
function getCurrentStage() {
    return STAGES[currentStageIndex];
}

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
        // 게임 시작 전에는 '다시 시작' 버튼 비활성화
        resetButton.disabled = true;
    }
}


// --- 게임 제어 ---

// 게임 시작, 일시 정지, 재개 기능 통합
function toggleGame() {
    if (!isGameRunning && timeRemainingInGame === TOTAL_GAME_DURATION) {
        // 1. 게임 시작 (Initial -> Running)
        isGameRunning = true;
        startTimerAndAI();
        startCheerMessage(); // 응원 메시지 시작
        updateButtonState('running');
    } else if (isGameRunning) {
        // 2. 일시 정지 (Running -> Paused)
        isGameRunning = false;
        stopTimerAndAI();
        stopCheerMessage(); // 응원 메시지 정지
        updateButtonState('paused');
    } else if (!isGameRunning && timeRemainingInGame < TOTAL_GAME_DURATION) {
        // 3. 재개 (Paused -> Running)
        isGameRunning = true;
        startTimerAndAI();
        startCheerMessage(); // 응원 메시지 시작
        updateButtonState('running');
    }
}

function resetGame() {
    // 모든 상태 초기화
    currentStageIndex = 0;
    timeRemainingInGame = TOTAL_GAME_DURATION;
    timeRemainingInStage = STAGES[0].duration;
    playerTiles = 0;
    computerTiles = 0;
    isGameRunning = false;

    // 인터벌 중지
    stopTimerAndAI();
    stopCheerMessage();

    // UI 업데이트 (1단계 그리드 생성)
    updateTimerDisplay();
    updateScoreDisplay();
    updatePercentageBar();
    createGrid(getCurrentStage().size);
    modal.style.display = 'none';

    // 버튼 상태 초기화
    updateButtonState('initial');
}

// 단계 전환
function transitionToNextStage() {
    // 현재 단계에서 획득한 타일 초기화
    playerTiles = 0;
    computerTiles = 0;

    // 타일 초기화: 이전 스테이지의 색상을 모두 제거하고 빈 타일로 되돌림
    Array.from(gridElement.children).forEach(tile => {
        STAGES.forEach(stage => tile.classList.remove(stage.colorClass));
        tile.classList.remove('computer-tile');
    });

    currentStageIndex++;

    if (currentStageIndex < TOTAL_STAGES) {
        const nextStage = getCurrentStage();
        timeRemainingInStage = nextStage.duration; // 다음 단계 시간으로 재설정

        // UI 업데이트: 그리드 및 점수판 초기화 및 새 그리드 생성
        createGrid(nextStage.size);
        updateTimerDisplay();
        updateScoreDisplay(); // 점수판 0으로 업데이트

        // AI 속도 재설정 (interval ID 갱신)
        setComputerSpeed();
    }
}


// --- 게임 로직 ---

function createGrid(size) {
    gridElement.innerHTML = '';
    // CSS grid-template-columns를 동적으로 설정
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
    const isComputerTile = tile.classList.contains('computer-tile');
    const isPlayerTile = tile.classList.contains(playerColorClass);

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
}


// 컴퓨터 AI 로직 (빈 타일 또는 플레이어 타일을 노림)
function computerTurn() {
    if (!isGameRunning) return;

    const targetableTiles = Array.from(gridElement.children).filter(tile =>
        // 컴퓨터 타일이 아닌 모든 타일을 대상으로 합니다.
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

// NEW: 컴퓨터 클릭 속도 설정 (0.3배 감소 적용)
function setComputerSpeed() {
    if (computerIntervalId) clearInterval(computerIntervalId);

    let delay;

    if (computerTiles === getCurrentStage().totalTiles) {
        // 컴퓨터가 모든 자리를 차지한 경우: 속도 대폭 감소 (2초에 한 번 클릭)
        delay = 2000;
    } else {
        // 일반적인 속도 조절 (시간이 줄어들수록 빨라짐)
        const BASE_SLOWDOWN_FACTOR = 1.3; // 0.3배 감소 (딜레이 1.3배 증가)

        const maxDelay = 400 * BASE_SLOWDOWN_FACTOR; // 초기 지연 시간 (약 520ms)
        const minDelay = 40 * BASE_SLOWDOWN_FACTOR;  // 최소 지연 시간 (약 52ms)

        // 현재 단계의 남은 시간을 기준으로 속도 조절
        const normalizedTime = timeRemainingInStage / getCurrentStage().duration; // 1.0(시작) -> 0.0(종료)

        delay = normalizedTime * (maxDelay - minDelay) + minDelay;

        // 최소/최대값 보장
        delay = Math.min(maxDelay, Math.max(minDelay, delay));
    }

    computerIntervalId = setInterval(computerTurn, delay);
}


// --- 타이머 및 게임 종료 ---

// 타이머 표시 업데이트: 현재 단계의 남은 시간만 표시
function updateTimerDisplay() {
    const minutes = Math.floor(timeRemainingInStage / 60);
    const seconds = timeRemainingInStage % 60;
    timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function timerTick() {
    if (timeRemainingInGame > 0) {
        timeRemainingInGame--;
        timeRemainingInStage--;

        updateTimerDisplay();
        updateCheerMessage(); // 응원 메시지 업데이트 (매 초마다)

        if (timeRemainingInStage === 0) {
            if (currentStageIndex < TOTAL_STAGES - 1) {
                transitionToNextStage();
            } else {
                // 모든 스테이지 완료
                endGame();
            }
        }
    } else {
        endGame();
    }
}

function endGame() {
    isGameRunning = false;
    stopTimerAndAI();
    stopCheerMessage();

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
    modalScores.innerHTML = `최종 점수: (마지막 단계 기준)<br> 나: **${playerTiles}** | 컴퓨터: **${computerTiles}**`;
    modal.style.display = 'block';
}


// 🌈 NEW: 응원 메시지 함수 

// 응원 메시지를 랜덤하게 선택하여 표시
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
    const message = messages[randomIndex];

    cheerMessageElement.textContent = message;
    cheerMessageElement.style.opacity = 1;
}

// 게임 시작/재개 시 응원 메시지 인터벌 시작
function startCheerMessage() {
    if (cheerIntervalId) clearInterval(cheerIntervalId);

    // 3초마다 메시지 업데이트
    cheerIntervalId = setInterval(updateCheerMessage, 3000);
    updateCheerMessage(); // 즉시 한 번 실행
}

// 게임 정지/종료 시 응원 메시지 인터벌 정지
function stopCheerMessage() {
    if (cheerIntervalId) clearInterval(cheerIntervalId);
    cheerMessageElement.style.opacity = 0;
}


// --- 이벤트 리스너 ---
actionButton.addEventListener('click', toggleGame);
resetButton.addEventListener('click', resetGame);
modalRestartButton.addEventListener('click', resetGame); // 모달에서 다시 시작

// --- 초기 실행 ---
resetGame(); // 페이지 로드 시 게임 초기화