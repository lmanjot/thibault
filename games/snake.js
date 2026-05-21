// ============================================
// SNAKE - Nokia 3310 Style
// ============================================

const CELL = 16;
const COLS = 24;
const ROWS = 20;
const WIDTH = COLS * CELL;
const HEIGHT = ROWS * CELL;

const COLORS = {
    bg:       '#9bbc0f',
    bgLight:  '#8bac0f',
    snake:    '#0f380f',
    snakeAlt: '#1a4a1a',
    food:     '#0f380f',
    text:     '#0f380f',
    textDim:  '#306230',
    grid:     '#8bac0f'
};

const STATE_TITLE   = 0;
const STATE_PLAYING = 1;
const STATE_PAUSED  = 2;
const STATE_OVER    = 3;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = WIDTH;
canvas.height = HEIGHT;

const scoreDisplay = document.getElementById('score-display');

let state = STATE_TITLE;
let snake = [];
let dir = { x: 1, y: 0 };
let nextDir = { x: 1, y: 0 };
let food = { x: 0, y: 0 };
let score = 0;
let highScore = parseInt(localStorage.getItem('snakeHigh') || '0');
let speed = 120;
let lastTick = 0;
let wallMode = false;

const keys = {};
window.addEventListener('keydown', e => {
    keys[e.code] = true;

    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyW','KeyA','KeyS','KeyD'].includes(e.code)) {
        e.preventDefault();
    }

    if (state === STATE_TITLE) {
        if (e.code === 'Enter' || e.code === 'Space') startGame();
        if (e.code === 'KeyM') wallMode = !wallMode;
        return;
    }

    if (state === STATE_OVER) {
        if (e.code === 'Enter' || e.code === 'Space') { state = STATE_TITLE; }
        return;
    }

    if (state === STATE_PLAYING) {
        if (e.code === 'KeyP' || e.code === 'Escape') { state = STATE_PAUSED; return; }
        if ((e.code === 'ArrowUp'    || e.code === 'KeyW') && dir.y === 0) nextDir = { x:  0, y: -1 };
        if ((e.code === 'ArrowDown'  || e.code === 'KeyS') && dir.y === 0) nextDir = { x:  0, y:  1 };
        if ((e.code === 'ArrowLeft'  || e.code === 'KeyA') && dir.x === 0) nextDir = { x: -1, y:  0 };
        if ((e.code === 'ArrowRight' || e.code === 'KeyD') && dir.x === 0) nextDir = { x:  1, y:  0 };
    }

    if (state === STATE_PAUSED) {
        if (e.code === 'KeyP' || e.code === 'Escape' || e.code === 'Space') { state = STATE_PLAYING; }
    }
});

window.addEventListener('keyup', e => { keys[e.code] = false; });

function startGame() {
    const cx = Math.floor(COLS / 2);
    const cy = Math.floor(ROWS / 2);
    snake = [
        { x: cx, y: cy },
        { x: cx - 1, y: cy },
        { x: cx - 2, y: cy }
    ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    speed = 120;
    scoreDisplay.textContent = 'SCORE: 0';
    placeFood();
    state = STATE_PLAYING;
    lastTick = performance.now();
}

function placeFood() {
    let tries = 0;
    do {
        food.x = Math.floor(Math.random() * COLS);
        food.y = Math.floor(Math.random() * ROWS);
        tries++;
    } while (snake.some(s => s.x === food.x && s.y === food.y) && tries < 500);
}

function tick() {
    dir = { ...nextDir };
    const head = snake[0];
    let nx = head.x + dir.x;
    let ny = head.y + dir.y;

    if (wallMode) {
        if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) {
            die();
            return;
        }
    } else {
        if (nx < 0) nx = COLS - 1;
        if (nx >= COLS) nx = 0;
        if (ny < 0) ny = ROWS - 1;
        if (ny >= ROWS) ny = 0;
    }

    if (snake.some(s => s.x === nx && s.y === ny)) {
        die();
        return;
    }

    snake.unshift({ x: nx, y: ny });

    if (nx === food.x && ny === food.y) {
        score += 10;
        scoreDisplay.textContent = `SCORE: ${score}`;
        if (speed > 55) speed -= 2;
        placeFood();
    } else {
        snake.pop();
    }
}

function die() {
    state = STATE_OVER;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHigh', String(highScore));
    }
}

// ============================================
// RENDERING
// ============================================

function drawPixelText(text, x, y, size) {
    ctx.font = `bold ${size}px "Courier New", monospace`;
    ctx.fillText(text, x, y);
}

function renderTitle() {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'center';

    drawPixelText('SNAKE', WIDTH / 2, 70, 36);

    ctx.fillStyle = COLORS.textDim;
    drawPixelText('Nokia 3310 Edition', WIDTH / 2, 100, 13);

    ctx.fillStyle = COLORS.text;
    drawPixelText('Controls:', WIDTH / 2, 150, 14);
    ctx.fillStyle = COLORS.textDim;
    drawPixelText('Arrow Keys / WASD', WIDTH / 2, 172, 12);
    drawPixelText('P / Esc : Pause', WIDTH / 2, 190, 12);

    ctx.fillStyle = COLORS.text;
    drawPixelText(`Mode: ${wallMode ? 'WALLS KILL' : 'WRAP AROUND'}`, WIDTH / 2, 224, 12);
    ctx.fillStyle = COLORS.textDim;
    drawPixelText('Press M to toggle', WIDTH / 2, 242, 11);

    if (highScore > 0) {
        ctx.fillStyle = COLORS.text;
        drawPixelText(`High Score: ${highScore}`, WIDTH / 2, 272, 13);
    }

    const blink = Math.sin(performance.now() * 0.004) > 0;
    if (blink) {
        ctx.fillStyle = COLORS.text;
        drawPixelText('Press ENTER to Start', WIDTH / 2, HEIGHT - 30, 14);
    }
}

function renderGame() {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Subtle grid
    ctx.fillStyle = COLORS.grid;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if ((r + c) % 2 === 0) {
                ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
            }
        }
    }

    // Walls if wall mode
    if (wallMode) {
        ctx.strokeStyle = COLORS.text;
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, WIDTH - 2, HEIGHT - 2);
    }

    // Food - blinking apple shape
    const foodPulse = Math.sin(performance.now() * 0.008) * 0.15 + 0.85;
    const fs = CELL * foodPulse;
    const fo = (CELL - fs) / 2;
    ctx.fillStyle = COLORS.food;
    ctx.fillRect(food.x * CELL + fo + 1, food.y * CELL + fo + 1, fs - 2, fs - 2);
    ctx.fillRect(food.x * CELL + CELL / 2 - 1, food.y * CELL + fo - 2, 2, 4);

    // Snake
    for (let i = 0; i < snake.length; i++) {
        const s = snake[i];
        const isHead = i === 0;
        ctx.fillStyle = isHead ? COLORS.snake : (i % 2 === 0 ? COLORS.snake : COLORS.snakeAlt);
        const inset = isHead ? 0 : 1;
        ctx.fillRect(s.x * CELL + inset, s.y * CELL + inset, CELL - inset * 2, CELL - inset * 2);

        if (isHead) {
            ctx.fillStyle = COLORS.bg;
            const ex = dir.x === -1 ? 2 : dir.x === 1 ? CELL - 6 : 3;
            const ex2 = dir.x === -1 ? 2 : dir.x === 1 ? CELL - 6 : CELL - 7;
            const ey = dir.y === -1 ? 3 : dir.y === 1 ? CELL - 6 : 3;
            const ey2 = dir.y === -1 ? 3 : dir.y === 1 ? CELL - 6 : CELL - 7;
            if (dir.x !== 0) {
                ctx.fillRect(s.x * CELL + ex, s.y * CELL + 3, 3, 3);
                ctx.fillRect(s.x * CELL + ex, s.y * CELL + CELL - 6, 3, 3);
            } else {
                ctx.fillRect(s.x * CELL + 3, s.y * CELL + ey, 3, 3);
                ctx.fillRect(s.x * CELL + CELL - 6, s.y * CELL + ey, 3, 3);
            }
        }
    }
}

function renderPaused() {
    renderGame();
    ctx.fillStyle = 'rgba(155, 188, 15, 0.7)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'center';
    drawPixelText('PAUSED', WIDTH / 2, HEIGHT / 2 - 10, 28);
    drawPixelText('Press P to resume', WIDTH / 2, HEIGHT / 2 + 20, 12);
}

function renderGameOver() {
    renderGame();
    ctx.fillStyle = 'rgba(155, 188, 15, 0.8)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = 'center';
    drawPixelText('GAME OVER', WIDTH / 2, HEIGHT / 2 - 30, 28);
    drawPixelText(`Score: ${score}`, WIDTH / 2, HEIGHT / 2 + 5, 16);
    if (score >= highScore && score > 0) {
        drawPixelText('NEW HIGH SCORE!', WIDTH / 2, HEIGHT / 2 + 30, 14);
    }
    ctx.fillStyle = COLORS.textDim;
    drawPixelText('Press ENTER', WIDTH / 2, HEIGHT / 2 + 60, 12);
}

// ============================================
// MAIN LOOP
// ============================================

function gameLoop(now) {
    if (state === STATE_PLAYING) {
        if (now - lastTick >= speed) {
            tick();
            lastTick = now;
        }
    }

    switch (state) {
        case STATE_TITLE:   renderTitle();    break;
        case STATE_PLAYING: renderGame();     break;
        case STATE_PAUSED:  renderPaused();   break;
        case STATE_OVER:    renderGameOver(); break;
    }

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
