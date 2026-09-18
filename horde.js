// ============================================
// LAST SAIYAN — Last Z style, sprites DB, difficulté allégée
// ============================================

const CW = 420;
const CH = 740;

const STATE_TITLE = 'TITLE';
const STATE_PLAYING = 'PLAYING';
const STATE_GAME_OVER = 'GAME_OVER';
const STATE_VICTORY = 'VICTORY';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CW;
canvas.height = CH;

const PLAYER_Y = CH - 95; // bas de l'écran (au-dessus de la barre skills)
const ROAD_LEFT = 50;
const ROAD_RIGHT = CW - 50;
const ROAD_W = ROAD_RIGHT - ROAD_LEFT;

// Escouade = persos Dragon Ball distincts (pas des clones de Goku)
const ROSTER = ['goku', 'vegeta', 'piccolo', 'gohan', 'trunks', 'krillin', 'goku_ssj'];

const imgs = {};
const IMG_LIST = [
    'goku', 'goku_ssj', 'vegeta', 'piccolo', 'gohan', 'trunks', 'krillin',
    'saibaman', 'soldier', 'frieza', 'cell',
    'bg_road', 'bg_namek'
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
let score = 0;
let highScore = parseInt(localStorage.getItem('saiyanHigh') || '0', 10);
let animT = 0;
let scroll = 0;
let scrollSpeed = 50;
let stage = 1;
let distance = 0;
let nextWaveAt = 0;
let nextBossAt = 2400;
let particles = [];
let screenFlash = 0;
let message = '';
let messageT = 0;

const squad = {
    x: CW / 2,
    count: 2,
    fireRate: 4.5,
    damage: 1.2,
    fireCD: 0,
    weapon: 'ki'
};

let bullets = [];
let barriers = [];
let bonuses = [];
let enemies = [];
let boss = null;

const skills = {
    airstrike: { name: 'Frappe', cd: 0, maxCd: 10, icon: '☢' },
    pierce:    { name: 'Perce',  cd: 0, maxCd: 8,  icon: '⚡' },
    barrier:   { name: 'Bouclier', cd: 0, maxCd: 12, icon: '🛡' }
};
let pierceT = 0;
let shieldT = 0;

const keys = {};
let touchActive = false;
let touchStartX = 0;
let touchSquadX = 0;

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space', 'Enter', 'Digit1', 'Digit2', 'Digit3'].includes(e.code)) e.preventDefault();
    if ((e.code === 'Enter' || e.code === 'Space') &&
        (state === STATE_TITLE || state === STATE_GAME_OVER || state === STATE_VICTORY)) {
        startGame();
        return;
    }
    if (state === STATE_PLAYING) {
        if (e.code === 'Digit1') useSkill('airstrike');
        if (e.code === 'Digit2') useSkill('pierce');
        if (e.code === 'Digit3') useSkill('barrier');
    }
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

function cx(clientX) {
    const r = canvas.getBoundingClientRect();
    return ((clientX - r.left) / r.width) * CW;
}
function cy(clientY) {
    const r = canvas.getBoundingClientRect();
    return ((clientY - r.top) / r.height) * CH;
}

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (state === STATE_TITLE || state === STATE_GAME_OVER || state === STATE_VICTORY) { startGame(); return; }
    const t = e.touches[0];
    const x = cx(t.clientX), y = cy(t.clientY);
    if (y > CH - 56) {
        if (x < CW / 3) useSkill('airstrike');
        else if (x < (CW * 2) / 3) useSkill('pierce');
        else useSkill('barrier');
        return;
    }
    touchActive = true;
    touchStartX = x;
    touchSquadX = squad.x;
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!touchActive || state !== STATE_PLAYING) return;
    squad.x = clampSquad(touchSquadX + (cx(e.touches[0].clientX) - touchStartX) * 1.2);
}, { passive: false });

canvas.addEventListener('touchend', (e) => { e.preventDefault(); touchActive = false; }, { passive: false });

canvas.addEventListener('mousedown', (e) => {
    if (state === STATE_TITLE || state === STATE_GAME_OVER || state === STATE_VICTORY) { startGame(); return; }
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * CW;
    const y = ((e.clientY - r.top) / r.height) * CH;
    if (y > CH - 56) {
        if (x < CW / 3) useSkill('airstrike');
        else if (x < (CW * 2) / 3) useSkill('pierce');
        else useSkill('barrier');
    }
});

function clampSquad(x) {
    const spread = Math.min(100, squad.count * 6);
    return Math.max(ROAD_LEFT + 24 + spread / 2, Math.min(ROAD_RIGHT - 24 - spread / 2, x));
}

function showMsg(t) { message = t; messageT = 1.6; }

function startGame() {
    score = 0; scroll = 0; distance = 0; stage = 1;
    scrollSpeed = 50;
    nextWaveAt = 50;
    nextBossAt = 2400;
    bullets = []; barriers = []; bonuses = []; enemies = [];
    boss = null; particles = [];
    squad.x = CW / 2;
    squad.count = 2;
    squad.fireRate = 4.5;
    squad.damage = 1.2;
    squad.fireCD = 0;
    squad.weapon = 'ki';
    pierceT = 0; shieldT = 0;
    skills.airstrike.cd = 0;
    skills.pierce.cd = 0;
    skills.barrier.cd = 0;
    state = STATE_PLAYING;
    showMsg('En avant !');
    spawnWave();
}

function useSkill(id) {
    const s = skills[id];
    if (!s || s.cd > 0 || state !== STATE_PLAYING) return;
    s.cd = s.maxCd;
    if (id === 'airstrike') {
        showMsg('FRAPPE AÉRIENNE !');
        screenFlash = 0.35;
        for (const b of barriers) { b.hp -= 60; burst(b.x, b.y, '#ff4400', 10, 5); }
        for (const e of enemies) { e.hp -= 30; burst(e.x, e.y, '#ff6600', 8, 4); }
        for (const bo of bonuses) { bo.hp -= 40; }
        if (boss) { boss.hp -= 100; burst(boss.x, boss.y, '#ff0044', 25, 8); }
        for (let i = 0; i < 10; i++) {
            particles.push({
                x: ROAD_LEFT + Math.random() * ROAD_W, y: -10,
                vx: 0, vy: 22, life: 28, max: 28, color: '#ffe566', size: 5, beam: true
            });
        }
    } else if (id === 'pierce') {
        showMsg('TIRS PERFORANTS !');
        pierceT = 6;
    } else if (id === 'barrier') {
        showMsg('BOUCLIER !');
        shieldT = 6;
        burst(squad.x, PLAYER_Y - 20, '#4fc3f7', 16, 4);
    }
}

function burst(x, y, color, n, spd) {
    for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = spd * (0.3 + Math.random());
        particles.push({
            x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
            life: 14 + Math.random() * 16, max: 30, color, size: 2 + Math.random() * 3
        });
    }
}

function activateBonus(bo) {
    if (bo.kind === 'add') {
        squad.count = Math.min(36, squad.count + bo.value);
        showMsg(`+${bo.value} Guerriers !`);
    } else if (bo.kind === 'mult') {
        squad.count = Math.min(36, Math.max(1, Math.floor(squad.count * bo.value)));
        showMsg(`×${bo.value} Escouade !`);
    } else if (bo.kind === 'rate') {
        squad.fireRate = Math.min(14, squad.fireRate + bo.value);
        showMsg('Cadence ↑');
    } else if (bo.kind === 'dmg') {
        squad.damage += bo.value;
        showMsg('Ki ↑');
    } else if (bo.kind === 'weapon') {
        squad.weapon = bo.value;
        showMsg(bo.value === 'beam' ? 'Kamehameha !' : 'Tir rapide !');
    }
    burst(bo.x, bo.y, '#44ff88', 22, 6);
    score += 80;
}

function laneX(lane, lanes) {
    const pad = 30;
    const usable = ROAD_W - pad * 2;
    if (lanes <= 1) return ROAD_LEFT + ROAD_W / 2;
    return ROAD_LEFT + pad + (usable / (lanes - 1)) * lane;
}

/** DPS effectif si le joueur concentre le tir sur UNE cible (~55% des projectiles). */
function squadDPS() {
    const visual = Math.min(squad.count, 12);
    const extra = squad.count > 12 ? Math.min(8, Math.floor((squad.count - 12) / 2)) : 0;
    const rate = squad.weapon === 'rapid' ? squad.fireRate * 1.7 : squad.fireRate;
    let dmg = squad.damage;
    if (squad.weapon === 'beam') dmg *= 1.7;
    const focus = 0.55;
    return Math.max(1, (visual + extra) * rate * dmg * focus);
}

/** HP pour qu'une cible tienne `seconds` sous tir concentré. */
function hpForSeconds(seconds, stageScale = true) {
    const scale = stageScale ? (1 + (stage - 1) * 0.18) : 1;
    return Math.max(3, Math.round(squadDPS() * seconds * scale));
}

/** Temps avant contact selon la vitesse de scroll actuelle. */
function timeToContact(fromY) {
    const dist = Math.max(80, (PLAYER_Y - 25) - fromY);
    return dist / Math.max(20, scrollSpeed);
}

function spawnWave() {
    const pattern = Math.random();
    const y = -70;
    const ttc = timeToContact(y); // ~12–14s en début de partie

    if (pattern < 0.38) {
        const cols = 3;
        for (let c = 0; c < cols; c++) {
            // Barrière : ~35% du temps avant contact
            const hp = hpForSeconds(ttc * 0.32 + Math.random() * 0.4);
            barriers.push({
                x: laneX(c, cols), y, w: Math.min(72, ROAD_W / cols - 8),
                h: 46, hp, maxHp: hp, style: Math.random() < 0.5 ? 'rock' : 'capsule'
            });
        }
    } else if (pattern < 0.72) {
        const cols = 2;
        for (let c = 0; c < cols; c++) {
            const bx = laneX(c, cols);
            const hp = hpForSeconds(ttc * 0.28 + 0.3);
            barriers.push({ x: bx, y, w: 82, h: 50, hp, maxHp: hp, style: 'energy' });
            spawnBonusAbove(bx, y - 55);
        }
    } else {
        const n = 3 + Math.floor(Math.random() * (1 + Math.min(3, stage)));
        for (let i = 0; i < n; i++) {
            const elite = Math.random() < 0.2;
            const hp = hpForSeconds(elite ? ttc * 0.25 : ttc * 0.14);
            enemies.push({
                x: ROAD_LEFT + 40 + Math.random() * (ROAD_W - 80),
                y: y - Math.random() * 40,
                r: elite ? 20 : 17,
                hp, maxHp: hp,
                kind: elite ? 'elite' : 'grunt'
            });
        }
    }

    if (Math.random() < 0.75) {
        spawnBonusAbove(laneX(Math.floor(Math.random() * 3), 3), y - 110);
    }
}

function spawnBonusAbove(x, y) {
    const roll = Math.random();
    let kind, value, label, color, icon;
    if (roll < 0.32) {
        kind = 'add'; value = 1 + Math.floor(Math.random() * 2); label = `+${value}`; color = '#44ff88'; icon = 'saiyan';
    } else if (roll < 0.45) {
        kind = 'mult'; value = 2; label = '×2'; color = '#ffe566'; icon = 'star';
    } else if (roll < 0.65) {
        kind = 'rate'; value = 0.6; label = 'CAD'; color = '#4fc3f7'; icon = 'gun';
    } else if (roll < 0.82) {
        kind = 'dmg'; value = 0.4; label = 'KI'; color = '#ff8844'; icon = 'fist';
    } else {
        kind = 'weapon'; value = Math.random() < 0.5 ? 'beam' : 'rapid';
        label = value === 'beam' ? 'KAME' : 'RAPIDE'; color = '#88aaff'; icon = 'beam';
    }
    // Bonus : ~1.6–2.2 s de tir concentré
    const hp = hpForSeconds(1.6 + Math.random() * 0.6);
    bonuses.push({ x, y, r: 30, hp, maxHp: hp, kind, value, label, color, icon });
}

function spawnBoss() {
    showMsg(`BOSS — Stage ${stage}`);
    // Boss : ~14–18 s de DPS actuel
    const hp = hpForSeconds(14 + stage * 1.5, false);
    boss = { x: CW / 2, y: -80, r: 55, hp, maxHp: hp, vx: 40, t: 0 };
    for (let c = 0; c < 3; c++) {
        const h = hpForSeconds(2.2);
        barriers.push({ x: laneX(c, 3), y: 30, w: 75, h: 44, hp: h, maxHp: h, style: 'energy' });
    }
}

function gameOver() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('saiyanHigh', String(highScore));
    }
    state = STATE_GAME_OVER;
}

function shooterOffsets() {
    const n = squad.count;
    const maxShow = Math.min(n, 12);
    const spread = Math.min(180, 14 + maxShow * 12);
    const offs = [];
    for (let i = 0; i < maxShow; i++) {
        offs.push(n === 1 ? 0 : -spread / 2 + (spread / Math.max(1, maxShow - 1)) * i);
    }
    return offs;
}

function fire() {
    const offs = shooterOffsets();
    const pierce = pierceT > 0 ? 8 : 1;
    let color = '#ffe566', r = 4.5, vy = -13, dmg = squad.damage;
    if (squad.weapon === 'beam') { color = '#66ccff'; r = 6; vy = -16; dmg = squad.damage * 1.7; }
    else if (squad.weapon === 'rapid') { color = '#ffaa44'; r = 3.5; vy = -15; }
    if (pierceT > 0) color = '#00e5ff';

    for (const ox of offs) {
        bullets.push({ x: squad.x + ox, y: PLAYER_Y - 28, vy, dmg, pierce, r, color });
    }
    if (squad.count > 12) {
        const extra = Math.min(8, Math.floor((squad.count - 12) / 2));
        for (let i = 0; i < extra; i++) {
            bullets.push({
                x: squad.x + (Math.random() - 0.5) * 150,
                y: PLAYER_Y - 28, vy, dmg, pierce, r, color
            });
        }
    }
}

function hitTarget(obj, dmg, px, py) {
    obj.hp -= dmg;
    burst(px, py, '#ffaa44', 2, 2);
    return obj.hp <= 0;
}

function update(dt) {
    animT += dt;
    if (screenFlash > 0) screenFlash -= dt;
    if (messageT > 0) messageT -= dt;
    if (pierceT > 0) pierceT -= dt;
    if (shieldT > 0) shieldT -= dt;
    for (const k of Object.keys(skills)) {
        if (skills[k].cd > 0) skills[k].cd -= dt;
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (!p.beam) p.vy += 0.1;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }

    if (state !== STATE_PLAYING) return;

    if (!touchActive) {
        let mx = 0;
        if (keys['ArrowLeft'] || keys['KeyA']) mx -= 1;
        if (keys['ArrowRight'] || keys['KeyD']) mx += 1;
        if (mx) squad.x = clampSquad(squad.x + mx * 7.5 * 60 * dt);
    }

    const dy = scrollSpeed * dt;
    scroll += dy;
    distance += dy;
    score += Math.floor(dy * 0.08);

    for (const b of barriers) b.y += dy;
    for (const bo of bonuses) bo.y += dy;
    for (const e of enemies) {
        e.y += dy;
        e.y += (14 + stage * 2) * dt;
    }
    if (boss) {
        boss.y += dy * 0.4;
        if (boss.y < 110) boss.y += 20 * dt;
        boss.t += dt;
        boss.x += boss.vx * dt;
        if (boss.x < ROAD_LEFT + 50 || boss.x > ROAD_RIGHT - 50) boss.vx *= -1;
    }

    // Espacement large entre vagues
        if (distance >= nextWaveAt && !boss) {
        spawnWave();
        nextWaveAt = distance + 340 + Math.random() * 80;
    }
    if (distance >= nextBossAt && !boss) {
        spawnBoss();
        nextBossAt = distance + 2400 + stage * 200;
    }

    const rate = squad.weapon === 'rapid' ? squad.fireRate * 1.8 : squad.fireRate;
    squad.fireCD -= dt;
    if (squad.fireCD <= 0) {
        squad.fireCD = 1 / rate;
        fire();
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.y += b.vy * 60 * dt;
        if (b.y < -30) { bullets.splice(i, 1); continue; }

        let dead = false;

        for (let j = barriers.length - 1; j >= 0; j--) {
            const bar = barriers[j];
            if (Math.abs(b.x - bar.x) < bar.w / 2 + b.r && Math.abs(b.y - bar.y) < bar.h / 2 + b.r) {
                if (hitTarget(bar, b.dmg, b.x, b.y)) {
                    score += 20;
                    burst(bar.x, bar.y, '#ff8844', 14, 5);
                    barriers.splice(j, 1);
                }
                b.pierce--;
                if (b.pierce <= 0) { dead = true; break; }
            }
        }
        if (dead) { bullets.splice(i, 1); continue; }

        for (let j = bonuses.length - 1; j >= 0; j--) {
            const bo = bonuses[j];
            if (Math.hypot(b.x - bo.x, b.y - bo.y) < bo.r + b.r) {
                if (hitTarget(bo, b.dmg, b.x, b.y)) {
                    activateBonus(bo);
                    bonuses.splice(j, 1);
                }
                b.pierce--;
                if (b.pierce <= 0) { dead = true; break; }
            }
        }
        if (dead) { bullets.splice(i, 1); continue; }

        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (Math.hypot(b.x - e.x, b.y - e.y) < e.r + b.r) {
                if (hitTarget(e, b.dmg, b.x, b.y)) {
                    score += e.kind === 'elite' ? 35 : 12;
                    burst(e.x, e.y, '#88ff44', 12, 4);
                    enemies.splice(j, 1);
                }
                b.pierce--;
                if (b.pierce <= 0) { dead = true; break; }
            }
        }
        if (dead) { bullets.splice(i, 1); continue; }

        if (boss && Math.hypot(b.x - boss.x, b.y - boss.y) < boss.r + b.r) {
            boss.hp -= b.dmg;
            burst(b.x, b.y, '#ff44aa', 3, 2);
            b.pierce--;
            if (boss.hp <= 0) {
                score += 600 * stage;
                burst(boss.x, boss.y, '#ffe566', 50, 10);
                boss = null;
                stage++;
                scrollSpeed = Math.min(85, 50 + stage * 6);
                squad.count = Math.min(36, squad.count + 1);
                squad.damage += 0.25;
                showMsg(`Stage ${stage} !`);
                if (stage > 5) {
                    if (score > highScore) {
                        highScore = score;
                        localStorage.setItem('saiyanHigh', String(highScore));
                    }
                    state = STATE_VICTORY;
                }
            }
            if (b.pierce <= 0) bullets.splice(i, 1);
        }
    }

    const contactY = PLAYER_Y - 20;

    for (let i = barriers.length - 1; i >= 0; i--) {
        const bar = barriers[i];
        if (bar.y + bar.h / 2 >= contactY) {
            if (Math.abs(bar.x - squad.x) < bar.w / 2 + 35 + Math.min(70, squad.count * 3)) {
                if (shieldT > 0) {
                    barriers.splice(i, 1);
                    burst(bar.x, bar.y, '#4fc3f7', 12, 4);
                } else gameOver();
            } else if (bar.y > CH + 40) barriers.splice(i, 1);
        }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (e.y + e.r >= contactY) {
            if (Math.hypot(e.x - squad.x, e.y - (PLAYER_Y - 15)) < e.r + 30) {
                if (shieldT > 0) {
                    enemies.splice(i, 1);
                    burst(e.x, e.y, '#4fc3f7', 10, 3);
                } else gameOver();
            } else if (e.y > PLAYER_Y + 40) enemies.splice(i, 1);
        }
    }

    // Bonus loupé = juste raté (pas de game over), disparait hors écran
    for (let i = bonuses.length - 1; i >= 0; i--) {
        if (bonuses[i].y > CH + 40) bonuses.splice(i, 1);
    }
    barriers = barriers.filter(b => b.y < CH + 60);

    if (boss && boss.y + boss.r >= contactY) {
        if (shieldT > 0) boss.y = contactY - boss.r - 10;
        else gameOver();
    }
}

// ================= DRAW =================

function drawRoad() {
    const bg = imgs.bg_road || imgs.bg_namek;
    if (bg) {
        const scale = Math.max(CW / bg.width, CH / bg.height);
        const w = bg.width * scale, h = bg.height * scale;
        ctx.drawImage(bg, (CW - w) / 2, (CH - h) / 2 - (scroll * 0.02) % 40, w, h);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(0, 0, CW, CH);
    } else {
        ctx.fillStyle = '#1a3a6a';
        ctx.fillRect(0, 0, CW, CH);
    }

    // Semi-transparent road overlay for gameplay clarity
    ctx.fillStyle = 'rgba(60,60,70,0.45)';
    ctx.beginPath();
    ctx.moveTo(CW / 2 - 50, 0);
    ctx.lineTo(CW / 2 + 50, 0);
    ctx.lineTo(ROAD_RIGHT + 8, CH);
    ctx.lineTo(ROAD_LEFT - 8, CH);
    ctx.closePath();
    ctx.fill();

    const off = scroll % 70;
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 3;
    ctx.setLineDash([24, 24]);
    ctx.lineDashOffset = -off;
    ctx.beginPath();
    ctx.moveTo(CW / 2, 0);
    ctx.lineTo(CW / 2, CH);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawBarrier(bar) {
    const { x, y, w, h } = bar;
    if (bar.style === 'rock') {
        ctx.fillStyle = '#6a5a4a';
        ctx.beginPath();
        ctx.moveTo(x - w / 2, y + h / 2);
        ctx.lineTo(x - w / 2 + 6, y - h / 2);
        ctx.lineTo(x + w / 2 - 4, y - h / 2 + 4);
        ctx.lineTo(x + w / 2, y + h / 2);
        ctx.closePath();
        ctx.fill();
    } else if (bar.style === 'capsule') {
        ctx.fillStyle = '#3a8fd4';
        ctx.fillRect(x - w / 2, y - h / 2, w, h);
        ctx.strokeStyle = '#ffe566';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - w / 2, y - h / 2, w, h);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText('CAPSULE', x, y - 10);
    } else {
        const eg = ctx.createLinearGradient(x - w / 2, y, x + w / 2, y);
        eg.addColorStop(0, 'rgba(100,200,255,0.4)');
        eg.addColorStop(0.5, 'rgba(200,240,255,0.6)');
        eg.addColorStop(1, 'rgba(100,200,255,0.4)');
        ctx.fillStyle = eg;
        ctx.fillRect(x - w / 2, y - h / 2, w, h);
        ctx.strokeStyle = '#a0e8ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - w / 2, y - h / 2, w, h);
    }

    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.font = 'bold 26px Segoe UI';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const num = String(Math.max(0, Math.ceil(bar.hp)));
    ctx.strokeText(num, x, y + 4);
    ctx.fillText(num, x, y + 4);
}

function drawBonus(bo) {
    const pulse = 1 + Math.sin(animT * 6) * 0.06;
    const glow = ctx.createRadialGradient(bo.x, bo.y, 4, bo.x, bo.y, bo.r * 1.5 * pulse);
    glow.addColorStop(0, bo.color);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(bo.x, bo.y, bo.r * 1.4 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(15,25,45,0.7)';
    ctx.beginPath();
    ctx.arc(bo.x, bo.y, bo.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = bo.color;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Mini Goku icon for add bonus
    if (bo.icon === 'saiyan' && imgs.goku) {
        ctx.drawImage(imgs.goku, bo.x - 14, bo.y - 22, 28, 36);
    } else {
        ctx.fillStyle = bo.color;
        ctx.font = 'bold 14px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText(bo.label, bo.x, bo.y + 2);
    }

    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.font = 'bold 14px Segoe UI';
    ctx.textAlign = 'center';
    const num = String(Math.ceil(bo.hp));
    ctx.strokeText(num, bo.x, bo.y + 22);
    ctx.fillText(num, bo.x, bo.y + 22);

    ctx.fillStyle = bo.color;
    ctx.font = 'bold 11px Segoe UI';
    ctx.fillText(bo.label, bo.x, bo.y - bo.r - 8);
}

function drawEnemy(e) {
    ctx.globalAlpha = 1;
    const sprite = e.kind === 'elite' ? (imgs.soldier || imgs.saibaman) : imgs.saibaman;
    const h = e.kind === 'elite' ? 52 : 48;
    if (sprite) {
        const w = (sprite.width / sprite.height) * h;
        ctx.drawImage(sprite, e.x - w / 2, e.y - h / 2, w, h);
    } else {
        ctx.fillStyle = '#3a8a30';
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fill();
    }
    if (e.hp < e.maxHp) {
        ctx.fillStyle = '#333';
        ctx.fillRect(e.x - 14, e.y - 28, 28, 4);
        ctx.fillStyle = '#44ff66';
        ctx.fillRect(e.x - 14, e.y - 28, 28 * (e.hp / e.maxHp), 4);
    }
}

function drawBoss() {
    if (!boss) return;
    const sprite = stage % 2 === 0 ? imgs.cell : imgs.frieza;
    const h = 120;
    if (sprite) {
        const w = (sprite.width / sprite.height) * h;
        // Aura
        const aura = ctx.createRadialGradient(boss.x, boss.y, 10, boss.x, boss.y, 80);
        aura.addColorStop(0, 'rgba(180,40,255,0.4)');
        aura.addColorStop(1, 'transparent');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(boss.x, boss.y, 75 + Math.sin(animT * 5) * 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.drawImage(sprite, boss.x - w / 2, boss.y - h / 2, w, h);
    }

    ctx.fillStyle = '#ff2244';
    ctx.fillRect(60, 12, CW - 120, 16);
    ctx.fillStyle = '#44ff66';
    ctx.fillRect(60, 12, (CW - 120) * Math.max(0, boss.hp / boss.maxHp), 16);
    ctx.strokeStyle = '#ffe566';
    ctx.strokeRect(60, 12, CW - 120, 16);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText(String(Math.ceil(boss.hp)), CW / 2, 25);
}

function drawSquad() {
    ctx.globalAlpha = 1;
    const offs = shooterOffsets();
    for (let i = 0; i < offs.length; i++) {
        const name = ROSTER[i % ROSTER.length];
        const sprite = imgs[name] || imgs.goku;
        const main = i === Math.floor(offs.length / 2);
        const h = main ? 72 : 58;
        if (sprite) {
            const w = (sprite.width / sprite.height) * h;
            ctx.drawImage(sprite, squad.x + offs[i] - w / 2, PLAYER_Y - h + (main ? 0 : 6), w, h);
        }
    }

    if (squad.count > 1) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath();
        ctx.arc(squad.x + 42, PLAYER_Y - 52, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffe566';
        ctx.font = 'bold 12px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText(`×${squad.count}`, squad.x + 42, PLAYER_Y - 48);
    }

    if (shieldT > 0) {
        ctx.strokeStyle = `rgba(79,195,247,${0.5 + Math.sin(animT * 10) * 0.2})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(squad.x, PLAYER_Y - 18, 52 + Math.min(30, squad.count), 0, Math.PI * 2);
        ctx.stroke();
    }
}

function drawHUD() {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, CW, 44);
    ctx.fillStyle = '#ffe566';
    ctx.font = 'bold 13px Segoe UI';
    ctx.textAlign = 'left';
    ctx.fillText(`Score ${score}`, 10, 18);
    ctx.fillStyle = '#aaa';
    ctx.font = '11px Segoe UI';
    ctx.fillText(`Stage ${stage} · Ki ${squad.damage.toFixed(1)} · Cad ${squad.fireRate.toFixed(1)}`, 10, 34);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#4fc3f7';
    ctx.font = 'bold 12px Segoe UI';
    ctx.fillText(`${squad.count} Guerriers`, CW - 10, 28);

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, CH - 54, CW, 54);
    const ids = ['airstrike', 'pierce', 'barrier'];
    const w = CW / 3;
    ids.forEach((id, i) => {
        const s = skills[id];
        const ready = s.cd <= 0;
        ctx.fillStyle = ready ? 'rgba(255,200,50,0.18)' : 'rgba(60,60,60,0.35)';
        ctx.fillRect(i * w + 4, CH - 48, w - 8, 40);
        ctx.strokeStyle = ready ? '#ffe566' : '#555';
        ctx.strokeRect(i * w + 4, CH - 48, w - 8, 40);
        ctx.fillStyle = ready ? '#ffe566' : '#777';
        ctx.font = '14px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText(s.icon, i * w + w / 2, CH - 32);
        ctx.font = '9px Segoe UI';
        ctx.fillText(ready ? `${i + 1} ${s.name}` : `${Math.ceil(s.cd)}s`, i * w + w / 2, CH - 16);
    });

    if (messageT > 0) {
        ctx.fillStyle = `rgba(255,230,100,${Math.min(1, messageT)})`;
        ctx.font = 'bold 20px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText(message, CW / 2, CH / 2 - 30);
    }
}

function drawOverlay(title, sub, tip) {
    ctx.fillStyle = 'rgba(5,12,24,0.78)';
    ctx.fillRect(0, 0, CW, CH);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#4fc3f7';
    ctx.font = 'bold 32px Segoe UI';
    ctx.fillText(title, CW / 2, CH / 2 - 70);
    ctx.fillStyle = '#ffe566';
    ctx.font = '15px Segoe UI';
    ctx.fillText(sub, CW / 2, CH / 2 - 30);
    ctx.fillStyle = '#bbb';
    ctx.font = '12px Segoe UI';
    tip.split('\n').forEach((line, i) => ctx.fillText(line, CW / 2, CH / 2 + 10 + i * 18));
    if (highScore > 0) {
        ctx.fillStyle = '#777';
        ctx.fillText(`Record: ${highScore}`, CW / 2, CH / 2 + 90);
    }
}

function draw() {
    drawRoad();

    for (const bar of barriers) drawBarrier(bar);
    for (const bo of bonuses) drawBonus(bo);
    for (const e of enemies) drawEnemy(e);
    drawBoss();

    for (const b of bullets) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * 2.5);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.35, b.color);
        g.addColorStop(1, 'rgba(255,100,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r * 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r * 0.55, 0, Math.PI * 2);
        ctx.fill();
    }

    for (const p of particles) {
        ctx.globalAlpha = p.life / p.max;
        ctx.fillStyle = p.color;
        if (p.beam) ctx.fillRect(p.x - 2, p.y, 4, 50);
        else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); }
        ctx.globalAlpha = 1;
    }

    if (state === STATE_PLAYING) {
        drawSquad();
        drawHUD();
    }

    if (screenFlash > 0) {
        ctx.fillStyle = `rgba(255,200,50,${screenFlash})`;
        ctx.fillRect(0, 0, CW, CH);
    }

    if (!assetsReady) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, CW, CH);
        ctx.fillStyle = '#ffe566';
        ctx.font = '16px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText('Chargement…', CW / 2, CH / 2);
        return;
    }

    if (state === STATE_TITLE) {
        if (imgs.goku) ctx.drawImage(imgs.goku, CW / 2 - 55, CH / 2 + 70, 50, 75);
        if (imgs.vegeta) ctx.drawImage(imgs.vegeta, CW / 2 - 15, CH / 2 + 65, 48, 72);
        if (imgs.piccolo) ctx.drawImage(imgs.piccolo, CW / 2 + 25, CH / 2 + 68, 48, 72);
        drawOverlay(
            'LAST SAIYAN',
            'Détruis les barrières & bonus !',
            '← → pour viser · Tir automatique\nLes orbes doivent être DÉTRUITS\n1 2 3 = compétences'
        );
    } else if (state === STATE_GAME_OVER) {
        drawOverlay('K.O. !', `Score: ${score}`, 'Entrée / tap pour recommencer');
    } else if (state === STATE_VICTORY) {
        drawOverlay('SUPER SAIYAN !', `Score: ${score}`, '5 stages vaincus !');
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
