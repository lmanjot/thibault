// ============================================
// ÉCLAIR DE FEU — sprites Dragon Ball + backgrounds
// ============================================

let CW = 420;
let CH = 720;

const STATE_TITLE = 'TITLE';
const STATE_PLAYING = 'PLAYING';
const STATE_LEVEL_UP = 'LEVEL_UP';
const STATE_GAME_OVER = 'GAME_OVER';
const STATE_VICTORY = 'VICTORY';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const prevW = CW;
    const prevH = CH;
    // Remplit tout l'écran (viewport)
    CW = Math.max(320, Math.floor(window.innerWidth));
    CH = Math.max(480, Math.floor(window.innerHeight));
    canvas.width = CW;
    canvas.height = CH;
    // Garde le ratio de position du joueur
    if (prevW > 0 && prevH > 0) {
        player.x = (player.x / prevW) * CW;
    }
    player.y = CH - 120; // un peu plus haut que le bord bas
    player.x = Math.max(36, Math.min(CW - 36, player.x || CW / 2));
}

const LEVELS = [
    { name: 'Île Papaya',      speed: 2.0, spawn: 1.15, count: 12, bg: 'bg_papaya', color: '#ff6b00' },
    { name: 'Désert de Feu',   speed: 2.7, spawn: 0.95, count: 15, bg: 'bg_desert', color: '#ff4400' },
    { name: 'Namek',           speed: 3.4, spawn: 0.8,  count: 18, bg: 'bg_namek',  color: '#66ff88' },
    { name: 'Cell Games',      speed: 4.2, spawn: 0.65, count: 22, bg: 'bg_cell',   color: '#ff0044' },
    { name: 'Monde des Dieux', speed: 5.2, spawn: 0.5,  count: 26, bg: 'bg_gods',   color: '#ff66ff' }
];

const imgs = {};
const IMG_LIST = [
    'goku', 'goku_ssj',
    'bg_papaya', 'bg_desert', 'bg_namek', 'bg_cell', 'bg_gods'
];

function loadImg(name) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => { imgs[name] = img; resolve(); };
        img.onerror = () => { imgs[name] = null; resolve(); };
        img.src = `assets/dbz/ready/${name}.png`;
    });
}

let assetsReady = false;
Promise.all(IMG_LIST.map(loadImg)).then(() => { assetsReady = true; });

let state = STATE_TITLE;
let level = 0;
let lives = 3;
let score = 0;
let highScore = parseInt(localStorage.getItem('fireballHigh') || '0', 10);
let dodged = 0;
let needed = 0;
let fireballs = [];
let particles = [];
let spawnTimer = 0;
let invuln = 0;
let levelTimer = 0;
let animT = 0;
let flash = 0;

const player = { x: 210, y: 600, speed: 5.8, facing: 1 };
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 100));

const keys = {};
let touchActive = false;
let touchStartX = 0;
let touchPlayerX = 0;

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space', 'Enter'].includes(e.code)) e.preventDefault();
    if ((e.code === 'Enter' || e.code === 'Space') &&
        (state === STATE_TITLE || state === STATE_GAME_OVER || state === STATE_VICTORY)) startGame();
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

function getTouchX(e) {
    const t = e.touches ? e.touches[0] : e.changedTouches[0];
    const r = canvas.getBoundingClientRect();
    return ((t.clientX - r.left) / r.width) * CW;
}

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (state === STATE_TITLE || state === STATE_GAME_OVER || state === STATE_VICTORY) { startGame(); return; }
    if (state !== STATE_PLAYING) return;
    touchActive = true;
    touchStartX = getTouchX(e);
    touchPlayerX = player.x;
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!touchActive || state !== STATE_PLAYING) return;
    const dx = getTouchX(e) - touchStartX;
    player.x = Math.max(36, Math.min(CW - 36, touchPlayerX + dx * 1.15));
    player.facing = dx >= 0 ? 1 : -1;
}, { passive: false });

canvas.addEventListener('touchend', (e) => { e.preventDefault(); touchActive = false; }, { passive: false });
canvas.addEventListener('mousedown', () => {
    if (state === STATE_TITLE || state === STATE_GAME_OVER || state === STATE_VICTORY) startGame();
});

function startGame() {
    level = 0; lives = 3; score = 0;
    fireballs = []; particles = [];
    player.x = CW / 2;
    player.y = CH - 120;
    invuln = 0; flash = 0;
    beginLevel();
    state = STATE_PLAYING;
}

function beginLevel() {
    needed = LEVELS[level].count;
    dodged = 0; fireballs = []; spawnTimer = 0.5; levelTimer = 0;
}

function spawnFireball() {
    const L = LEVELS[level];
    const size = 28 + Math.random() * 22;
    let x = Math.random() < 0.4
        ? player.x + (Math.random() - 0.5) * 50
        : 40 + Math.random() * (CW - 80);
    fireballs.push({
        x: Math.max(30, Math.min(CW - 30, x)),
        y: -size - 10,
        r: size,
        vy: L.speed * (0.88 + Math.random() * 0.3),
        vx: (Math.random() - 0.5) * 0.6,
        spin: Math.random() * Math.PI * 2,
        frame: 0
    });
}

function spawnBurst(x, y, color, n, spd) {
    for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = spd * (0.4 + Math.random());
        particles.push({
            x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
            life: 18 + Math.random() * 20, max: 38, color, size: 2 + Math.random() * 4
        });
    }
}

function update(dt) {
    animT += dt;
    if (flash > 0) flash -= dt;

    if (state === STATE_LEVEL_UP) {
        levelTimer += dt;
        if (levelTimer > 2.2) {
            if (level >= LEVELS.length) state = STATE_VICTORY;
            else { beginLevel(); state = STATE_PLAYING; }
        }
        return;
    }
    if (state !== STATE_PLAYING) return;

    const L = LEVELS[level];
    if (invuln > 0) invuln -= dt;

    if (!touchActive) {
        let mx = 0;
        if (keys['ArrowLeft'] || keys['KeyA']) mx -= 1;
        if (keys['ArrowRight'] || keys['KeyD']) mx += 1;
        if (mx) { player.x += mx * player.speed * 60 * dt; player.facing = mx; }
        player.x = Math.max(36, Math.min(CW - 36, player.x));
    }

    spawnTimer -= dt;
    if (spawnTimer <= 0 && dodged + fireballs.length < needed) {
        spawnFireball();
        spawnTimer = L.spawn * (0.75 + Math.random() * 0.4);
    }

    for (let i = fireballs.length - 1; i >= 0; i--) {
        const f = fireballs[i];
        f.y += f.vy * 60 * dt;
        f.x += f.vx * 60 * dt;
        f.spin += dt * 6;
        f.frame += dt * 10;

        if (invuln <= 0) {
            const dx = f.x - player.x;
            const dy = f.y - (player.y - 28);
            if (Math.hypot(dx, dy) < f.r * 0.45 + 18) {
                lives--;
                invuln = 1.4;
                flash = 0.35;
                spawnBurst(player.x, player.y - 20, '#ffaa00', 24, 6);
                fireballs.splice(i, 1);
                if (lives <= 0) {
                    if (score > highScore) {
                        highScore = score;
                        localStorage.setItem('fireballHigh', String(highScore));
                    }
                    state = STATE_GAME_OVER;
                }
                continue;
            }
        }

        if (f.y - f.r > CH + 10) {
            fireballs.splice(i, 1);
            dodged++;
            score += 10 + level * 5;
            if (dodged >= needed) {
                score += 100 * (level + 1);
                level++;
                levelTimer = 0;
                state = STATE_LEVEL_UP;
                spawnBurst(CW / 2, CH / 2, '#ffe566', 40, 8);
            }
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function drawBackground() {
    const key = state === STATE_TITLE ? 'bg_papaya' : LEVELS[Math.min(level, LEVELS.length - 1)].bg;
    const bg = imgs[key];
    if (bg) {
        // Cover canvas
        const scale = Math.max(CW / bg.width, CH / bg.height);
        const w = bg.width * scale;
        const h = bg.height * scale;
        ctx.drawImage(bg, (CW - w) / 2, (CH - h) / 2, w, h);
        // Soft vignette for readability
        const v = ctx.createLinearGradient(0, 0, 0, CH);
        v.addColorStop(0, 'rgba(0,0,0,0.25)');
        v.addColorStop(0.5, 'rgba(0,0,0,0)');
        v.addColorStop(1, 'rgba(0,0,0,0.35)');
        ctx.fillStyle = v;
        ctx.fillRect(0, 0, CW, CH);
    } else {
        ctx.fillStyle = '#1a0a2e';
        ctx.fillRect(0, 0, CW, CH);
    }
}

function drawPlayer() {
    const blink = invuln > 0 && Math.floor(animT * 12) % 2 === 0;
    if (blink) return;

    const sprite = (level >= 3 && imgs.goku_ssj) ? imgs.goku_ssj : imgs.goku;
    const h = 100;
    const w = sprite ? (sprite.width / sprite.height) * h : 50;

    // Soft golden aura (anime style)
    const aura = ctx.createRadialGradient(player.x, player.y - 50, 8, player.x, player.y - 50, 70);
    aura.addColorStop(0, level >= 3 ? 'rgba(255,230,80,0.5)' : 'rgba(255,200,60,0.28)');
    aura.addColorStop(1, 'rgba(255,100,0,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(player.x, player.y - 45, 40 + Math.sin(animT * 8) * 4, 62, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(player.x, player.y + 6, 32, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    if (sprite) {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.scale(player.facing, 1);
        ctx.drawImage(sprite, -w / 2, -h, w, h);
        ctx.restore();
    }
}

function drawFireball(f) {
    const pulse = 1 + Math.sin(f.spin * 2.5) * 0.07;
    const R = f.r * pulse;

    // Soft bloom — luminosité réduite pour coller au fond
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const bloom = ctx.createRadialGradient(f.x, f.y, R * 0.15, f.x, f.y, R * 2.1);
    bloom.addColorStop(0, 'rgba(255,240,180,0.45)');
    bloom.addColorStop(0.3, 'rgba(255,170,40,0.28)');
    bloom.addColorStop(0.65, 'rgba(255,80,10,0.12)');
    bloom.addColorStop(1, 'rgba(255,40,0,0)');
    ctx.fillStyle = bloom;
    ctx.beginPath();
    ctx.arc(f.x, f.y, R * 2.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Core ki orb
    const core = ctx.createRadialGradient(
        f.x - R * 0.2, f.y - R * 0.25, R * 0.05,
        f.x, f.y, R
    );
    core.addColorStop(0, '#fff8e0');
    core.addColorStop(0.2, '#ffe566');
    core.addColorStop(0.45, '#ffb020');
    core.addColorStop(0.7, '#ff7010');
    core.addColorStop(0.9, '#cc3000');
    core.addColorStop(1, 'rgba(120, 10, 0, 0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(f.x, f.y, R, 0, Math.PI * 2);
    ctx.fill();

    // Thin energy arcs
    ctx.strokeStyle = 'rgba(255, 230, 160, 0.45)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
        const a = f.spin + i * (Math.PI * 2 / 3);
        ctx.beginPath();
        ctx.moveTo(f.x + Math.cos(a) * R * 0.3, f.y + Math.sin(a) * R * 0.3);
        ctx.lineTo(f.x + Math.cos(a + 0.3) * R * 0.9, f.y + Math.sin(a + 0.3) * R * 0.9);
        ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255,255,240,0.55)';
    ctx.beginPath();
    ctx.arc(f.x - R * 0.12, f.y - R * 0.15, R * 0.14, 0, Math.PI * 2);
    ctx.fill();
}

function drawHUD() {
    const L = LEVELS[Math.min(level, LEVELS.length - 1)];
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, CW, 52);
    ctx.fillStyle = '#ffe566';
    ctx.font = 'bold 15px Segoe UI, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Niv. ${Math.min(level + 1, LEVELS.length)} — ${L.name}`, 12, 22);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Segoe UI, sans-serif';
    ctx.fillText(`Score: ${score}`, 12, 42);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff6688';
    ctx.font = '16px Segoe UI, sans-serif';
    ctx.fillText('♥'.repeat(Math.max(0, lives)), CW - 12, 24);
    ctx.fillStyle = '#ccc';
    ctx.font = '12px Segoe UI, sans-serif';
    ctx.fillText(`${dodged}/${needed}`, CW - 12, 42);
    const pct = needed ? dodged / needed : 0;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(12, 56, CW - 24, 5);
    ctx.fillStyle = L.color;
    ctx.fillRect(12, 56, (CW - 24) * pct, 5);
}

function drawOverlay(title, sub, tip) {
    ctx.fillStyle = 'rgba(8,4,16,0.72)';
    ctx.fillRect(0, 0, CW, CH);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe566';
    ctx.font = 'bold 34px Segoe UI, sans-serif';
    ctx.fillText(title, CW / 2, CH / 2 - 50);
    ctx.fillStyle = '#ff8844';
    ctx.font = '17px Segoe UI, sans-serif';
    ctx.fillText(sub, CW / 2, CH / 2);
    ctx.fillStyle = '#ccc';
    ctx.font = '13px Segoe UI, sans-serif';
    ctx.fillText(tip, CW / 2, CH / 2 + 40);
    if (highScore > 0 && state !== STATE_LEVEL_UP) {
        ctx.fillStyle = '#888';
        ctx.fillText(`Record: ${highScore}`, CW / 2, CH / 2 + 68);
    }
}

function draw() {
    drawBackground();

    for (const p of particles) {
        ctx.globalAlpha = p.life / p.max;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    for (const f of fireballs) drawFireball(f);

    if (state === STATE_PLAYING || state === STATE_LEVEL_UP) drawPlayer();

    if (flash > 0) {
        ctx.fillStyle = `rgba(255,50,20,${flash * 1.4})`;
        ctx.fillRect(0, 0, CW, CH);
    }

    if (state === STATE_PLAYING) drawHUD();

    if (!assetsReady) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, CW, CH);
        ctx.fillStyle = '#ffe566';
        ctx.font = '16px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText('Chargement des sprites…', CW / 2, CH / 2);
        return;
    }

    if (state === STATE_TITLE) {
        drawFireball({ x: CW / 2 - 100, y: CH / 2 - 170, r: 28, spin: animT * 4 });
        drawFireball({ x: CW / 2 + 105, y: CH / 2 - 150, r: 20, spin: animT * 5 });
        drawPlayer();
        drawOverlay('ÉCLAIR DE FEU', 'Esquive les Kikōha !', '← → ou glisse · Entrée pour jouer');
    } else if (state === STATE_LEVEL_UP) {
        const next = level < LEVELS.length ? LEVELS[level].name : 'Victoire';
        drawOverlay('NIVEAU RÉUSSI !', level < LEVELS.length ? `Prochain: ${next}` : 'Tous les niveaux !', 'Les boules vont plus vite...');
    } else if (state === STATE_GAME_OVER) {
        drawOverlay('K.O. !', `Score: ${score}`, 'Entrée / tap pour recommencer');
    } else if (state === STATE_VICTORY) {
        drawOverlay('SUPER SAIYAN !', `Score final: ${score}`, 'Tu as tout esquivé !');
    }
}

let last = performance.now();
function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
