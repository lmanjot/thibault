// ============================================
// DRAGON STONES KNIGHT - Main Game File
// ============================================

// ============================================
// SECTION 1: CONSTANTS AND CONFIGURATION
// ============================================

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 600;
const GRAVITY = 0.6;
const PLAYER_SPEED = 5;
const JUMP_STRENGTH = -13;
const GROUND_Y = CANVAS_HEIGHT - 50;
const INVINCIBILITY_FRAMES = 45;

const STATE_TITLE = 'TITLE';
const STATE_PLAYING = 'PLAYING';
const STATE_LEVEL_TRANSITION = 'LEVEL_TRANSITION';
const STATE_GAME_OVER = 'GAME_OVER';
const STATE_VICTORY = 'VICTORY';

const STONE_FIRE = 'FIRE';
const STONE_WATER = 'WATER';
const STONE_LIGHTNING = 'LIGHTNING';

// ============================================
// SECTION 2: GAME STATE
// ============================================

let gameState = STATE_TITLE;
let currentLevel = 1;
let levelTransitionTimer = 0;
let levelTransitionMessage = '';
let particles = [];
let screenShake = 0;

// ============================================
// SECTION 3: CANVAS SETUP
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// ============================================
// SECTION 4: INPUT HANDLING
// ============================================

const keys = {};
let jumpPressed = false;
let attackPressed = false;

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;

    // Prevent scrolling for game keys
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
    }

    if (e.code === 'Enter') {
        if (gameState === STATE_TITLE || gameState === STATE_GAME_OVER || gameState === STATE_VICTORY) {
            startGame();
        }
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Helper to check if a movement/action key is held
function isLeft()   { return keys['ArrowLeft']  || keys['KeyA']; }
function isRight()  { return keys['ArrowRight'] || keys['KeyD']; }
function isJump()   { return keys['Space']      || keys['ArrowUp'] || keys['KeyW']; }
function isAttack() { return keys['KeyX']       || keys['KeyZ'] || keys['KeyJ']; }

// ============================================
// SECTION 5: PARTICLE SYSTEM
// ============================================

function spawnParticles(x, y, color, count, speed) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * speed,
            vy: (Math.random() - 0.5) * speed - 1,
            life: 20 + Math.random() * 20,
            maxLife: 40,
            color: color,
            size: 2 + Math.random() * 4
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.life--;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function renderParticles() {
    for (const p of particles) {
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
}

// ============================================
// SECTION 6: ENTITY - PLAYER
// ============================================

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 36;
        this.height = 48;
        this.vx = 0;
        this.vy = 0;
        this.maxHp = 100;
        this.hp = this.maxHp;
        this.onGround = false;
        this.facing = 1;
        this.attackCooldown = 0;
        this.attackDuration = 0;
        this.attackHitIds = new Set();
        this.stones = [];
        this.damageMultiplier = 1;
        this.invincible = 0;
        this.flashTimer = 0;
        this.animTimer = 0;
    }

    update(platforms) {
        this.animTimer++;

        // Horizontal movement
        if (isLeft()) {
            this.vx = -PLAYER_SPEED;
            this.facing = -1;
        } else if (isRight()) {
            this.vx = PLAYER_SPEED;
            this.facing = 1;
        } else {
            this.vx *= 0.75;
            if (Math.abs(this.vx) < 0.3) this.vx = 0;
        }

        // Jump - requires releasing and re-pressing space
        if (isJump() && this.onGround && !jumpPressed) {
            this.vy = JUMP_STRENGTH;
            this.onGround = false;
            jumpPressed = true;
            spawnParticles(this.x + this.width / 2, this.y + this.height, '#aaa', 5, 3);
        }
        if (!isJump()) {
            jumpPressed = false;
        }

        // Gravity
        this.vy += GRAVITY;
        if (this.vy > 15) this.vy = 15;

        // Move horizontally, then vertically (separated for better collision)
        this.x += this.vx;
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > CANVAS_WIDTH) this.x = CANVAS_WIDTH - this.width;

        this.y += this.vy;

        // Ground + platform collision
        this.onGround = false;

        // Check ground
        if (this.y + this.height >= GROUND_Y) {
            this.y = GROUND_Y - this.height;
            this.vy = 0;
            this.onGround = true;
        }

        // Check platforms (only land on top when falling)
        for (const plat of platforms) {
            if (this.vy >= 0 &&
                this.x + this.width > plat.x && this.x < plat.x + plat.width &&
                this.y + this.height >= plat.y && this.y + this.height <= plat.y + plat.height + 8) {
                this.y = plat.y - this.height;
                this.vy = 0;
                this.onGround = true;
            }
        }

        // Attack handling - requires releasing and re-pressing
        if (isAttack() && this.attackCooldown <= 0 && !attackPressed) {
            this.attackDuration = 12;
            this.attackCooldown = 20;
            this.attackHitIds.clear();
            attackPressed = true;
            spawnParticles(
                this.x + this.width / 2 + this.facing * 30,
                this.y + this.height / 2,
                this.getSwordColor(),
                4, 4
            );
        }
        if (!isAttack()) {
            attackPressed = false;
        }

        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.attackDuration > 0) this.attackDuration--;

        // Invincibility countdown
        if (this.invincible > 0) this.invincible--;
        if (this.flashTimer > 0) this.flashTimer--;

        this.updateDamageMultiplier();
    }

    getSwordColor() {
        if (this.hasAllStones()) return '#ffffff';
        if (this.stones.includes(STONE_LIGHTNING)) return '#ffd700';
        if (this.stones.includes(STONE_WATER)) return '#00bfff';
        if (this.stones.includes(STONE_FIRE)) return '#ff4500';
        return '#cccccc';
    }

    getAttackHitbox() {
        if (this.attackDuration <= 0) return null;
        const w = 55;
        const h = 36;
        return {
            x: this.facing === 1 ? this.x + this.width : this.x - w,
            y: this.y + 8,
            width: w,
            height: h
        };
    }

    takeDamage(amount) {
        if (this.invincible > 0) return;
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
        this.invincible = INVINCIBILITY_FRAMES;
        this.flashTimer = 20;
        screenShake = 6;
        spawnParticles(this.x + this.width / 2, this.y + this.height / 2, '#ff0000', 8, 5);
    }

    addStone(stoneType) {
        if (!this.stones.includes(stoneType)) {
            this.stones.push(stoneType);
        }
    }

    updateDamageMultiplier() {
        let m = 1;
        if (this.stones.includes(STONE_FIRE)) m = 1.5;
        if (this.stones.includes(STONE_WATER)) m = 2.0;
        if (this.stones.includes(STONE_LIGHTNING)) m = 2.5;
        this.damageMultiplier = m;
    }

    hasAllStones() {
        return this.stones.includes(STONE_FIRE) &&
               this.stones.includes(STONE_WATER) &&
               this.stones.includes(STONE_LIGHTNING);
    }

    render(ctx) {
        // Blink when invincible
        if (this.invincible > 0 && Math.floor(this.invincible / 3) % 2 === 0) return;

        ctx.save();

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height + 3, this.width / 2.5, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Flash red when hit
        const flash = this.flashTimer > 0;

        // Body
        const bx = this.x, by = this.y, bw = this.width, bh = this.height;
        const grad = ctx.createLinearGradient(bx, by, bx, by + bh);
        grad.addColorStop(0, flash ? '#ff6666' : '#6aaef0');
        grad.addColorStop(1, flash ? '#cc3333' : '#3a70b2');
        ctx.fillStyle = grad;
        ctx.fillRect(bx, by, bw, bh);

        // Armor outline
        ctx.strokeStyle = flash ? '#ff0000' : '#2a5a92';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx + 1, by + 1, bw - 2, bh - 2);

        // Helmet visor
        ctx.fillStyle = '#2a5a92';
        ctx.fillRect(bx + 6, by + 4, bw - 12, 14);
        ctx.fillStyle = '#1a4a82';
        ctx.fillRect(bx + 8, by + 6, bw - 16, 10);

        // Eyes (two bright dots)
        ctx.fillStyle = '#fff';
        if (this.facing === 1) {
            ctx.fillRect(bx + 18, by + 8, 4, 5);
            ctx.fillRect(bx + 26, by + 8, 4, 5);
        } else {
            ctx.fillRect(bx + 8, by + 8, 4, 5);
            ctx.fillRect(bx + 16, by + 8, 4, 5);
        }

        // Belt
        ctx.fillStyle = '#8b6914';
        ctx.fillRect(bx + 2, by + bh * 0.55, bw - 4, 5);

        // Sword
        const sLen = 38;
        const sX = this.facing === 1 ? bx + bw : bx - sLen;
        const sY = by + 20;

        // Sword handle
        const handleX = this.facing === 1 ? bx + bw - 2 : bx - 6;
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(handleX, sY - 3, 8, 12);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(handleX - 2, sY - 1, 12, 3);

        // Blade
        ctx.fillStyle = '#ddd';
        ctx.fillRect(sX, sY, sLen, 5);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(sX, sY, sLen, 2);

        // Sword glow
        if (this.stones.length > 0) {
            ctx.save();
            ctx.shadowBlur = 25;
            if (this.hasAllStones()) {
                const t = Date.now() * 0.005;
                const r = Math.sin(t) * 127 + 128;
                const g = Math.sin(t + 2.1) * 127 + 128;
                const b = Math.sin(t + 4.2) * 127 + 128;
                ctx.shadowColor = `rgb(${r|0},${g|0},${b|0})`;
                ctx.fillStyle = `rgba(${r|0},${g|0},${b|0},0.6)`;
            } else if (this.stones.includes(STONE_LIGHTNING)) {
                ctx.shadowColor = '#ffd700';
                ctx.fillStyle = 'rgba(255,215,0,0.5)';
            } else if (this.stones.includes(STONE_WATER)) {
                ctx.shadowColor = '#00bfff';
                ctx.fillStyle = 'rgba(0,191,255,0.5)';
            } else {
                ctx.shadowColor = '#ff4500';
                ctx.fillStyle = 'rgba(255,69,0,0.5)';
            }
            ctx.fillRect(sX, sY - 1, sLen, 7);
            ctx.restore();
        }

        // Attack slash arc
        if (this.attackDuration > 0) {
            ctx.save();
            const progress = 1 - this.attackDuration / 12;
            ctx.globalAlpha = 0.5 * (1 - progress);
            ctx.strokeStyle = this.getSwordColor();
            ctx.lineWidth = 4;
            ctx.shadowBlur = 12;
            ctx.shadowColor = this.getSwordColor();
            ctx.beginPath();
            const cx = bx + bw / 2 + this.facing * 20;
            const cy = by + bh / 2;
            const startAngle = this.facing === 1 ? -Math.PI * 0.6 : Math.PI * 0.4;
            const sweep = this.facing * Math.PI * 0.8 * progress;
            ctx.arc(cx, cy, 45, startAngle, startAngle + sweep);
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();
    }
}

// ============================================
// SECTION 7: ENTITY - ENEMY
// ============================================

let entityIdCounter = 0;

class Enemy {
    constructor(x, y, type) {
        this.id = entityIdCounter++;
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 38;
        this.vx = 0;
        this.vy = 0;
        this.type = type || 'basic';
        this.hp = this.type === 'basic' ? 20 : this.type === 'medium' ? 35 : 50;
        this.maxHp = this.hp;
        this.speed = this.type === 'basic' ? 1.2 : this.type === 'medium' ? 1.8 : 2.2;
        this.attackCooldown = 0;
        this.onGround = false;
        this.flashTimer = 0;
        this.dead = false;
    }

    update(player, platforms) {
        // Chase player
        const dx = player.x - this.x;
        if (Math.abs(dx) > 10) {
            this.vx = dx > 0 ? this.speed : -this.speed;
        } else {
            this.vx = 0;
        }

        this.vy += GRAVITY;
        if (this.vy > 15) this.vy = 15;
        this.x += this.vx;
        this.y += this.vy;

        // Ground
        this.onGround = false;
        if (this.y + this.height >= GROUND_Y) {
            this.y = GROUND_Y - this.height;
            this.vy = 0;
            this.onGround = true;
        }

        // Platforms
        for (const plat of platforms) {
            if (this.vy >= 0 &&
                this.x + this.width > plat.x && this.x < plat.x + plat.width &&
                this.y + this.height >= plat.y && this.y + this.height <= plat.y + plat.height + 8) {
                this.y = plat.y - this.height;
                this.vy = 0;
                this.onGround = true;
            }
        }

        // Melee attack - only if actually overlapping vertically (feet-to-head)
        const hDist = Math.abs(this.x + this.width / 2 - (player.x + player.width / 2));
        const enemyBottom = this.y + this.height;
        const playerBottom = player.y + player.height;
        const verticalOverlap = enemyBottom > player.y + 10 && this.y < playerBottom - 10;
        if (hDist < 45 && verticalOverlap && this.attackCooldown <= 0) {
            player.takeDamage(8);
            this.attackCooldown = 90;
        }

        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.flashTimer > 0) this.flashTimer--;
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.flashTimer = 8;
        if (this.hp <= 0) {
            this.dead = true;
            spawnParticles(this.x + this.width / 2, this.y + this.height / 2, '#ff4444', 10, 5);
        }
        return this.dead;
    }

    render(ctx) {
        ctx.save();
        const flash = this.flashTimer > 0;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height + 2, this.width / 2.5, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        const colors = {
            basic:  { top: '#ff6b6b', bot: '#cc3333' },
            medium: { top: '#e05050', bot: '#a02020' },
            hard:   { top: '#cc2222', bot: '#880000' }
        };
        const c = colors[this.type] || colors.basic;
        const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        grad.addColorStop(0, flash ? '#ffffff' : c.top);
        grad.addColorStop(1, flash ? '#ffaaaa' : c.bot);
        ctx.fillStyle = grad;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Outline
        ctx.strokeStyle = '#600';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x + 1, this.y + 1, this.width - 2, this.height - 2);

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + 6, this.y + 10, 6, 7);
        ctx.fillRect(this.x + this.width - 12, this.y + 10, 6, 7);
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 8, this.y + 12, 3, 4);
        ctx.fillRect(this.x + this.width - 10, this.y + 12, 3, 4);

        // Mouth
        ctx.fillStyle = '#600';
        ctx.fillRect(this.x + 10, this.y + 26, this.width - 20, 4);

        // HP bar (small, above head)
        if (this.hp < this.maxHp) {
            const bw = this.width;
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x, this.y - 8, bw, 4);
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(this.x, this.y - 8, bw * (this.hp / this.maxHp), 4);
        }

        ctx.restore();
    }
}

// ============================================
// SECTION 8: ENTITY - BOSS
// ============================================

class Boss {
    constructor(x, y, level) {
        this.id = entityIdCounter++;
        this.x = x;
        this.y = y;
        this.level = level;
        this.width = level === 3 ? 80 : 60;
        this.height = level === 3 ? 90 : 70;
        this.vx = 0;
        this.vy = 0;
        this.hp = level === 1 ? 80 : level === 2 ? 150 : 250;
        this.maxHp = this.hp;
        this.speed = level === 3 ? 1.2 : 1;
        this.attackTimer = 0;
        this.attackCooldown = 0;
        this.projectiles = [];
        this.onGround = false;
        this.flashTimer = 0;
        this.dead = false;
    }

    update(player, platforms) {
        // Move toward player
        const dx = player.x + player.width / 2 - (this.x + this.width / 2);
        if (Math.abs(dx) > 60) {
            this.vx = dx > 0 ? this.speed : -this.speed;
        } else {
            this.vx = 0;
        }

        this.vy += GRAVITY;
        if (this.vy > 15) this.vy = 15;
        this.x += this.vx;
        this.y += this.vy;

        // Ground
        this.onGround = false;
        if (this.y + this.height >= GROUND_Y) {
            this.y = GROUND_Y - this.height;
            this.vy = 0;
            this.onGround = true;
        }

        // Platforms
        for (const plat of platforms) {
            if (this.vy >= 0 &&
                this.x + this.width > plat.x && this.x < plat.x + plat.width &&
                this.y + this.height >= plat.y && this.y + this.height <= plat.y + plat.height + 8) {
                this.y = plat.y - this.height;
                this.vy = 0;
                this.onGround = true;
            }
        }

        // Boss attack patterns
        this.attackTimer++;
        const dist = Math.abs(dx);

        // Melee slash - only if vertically overlapping (not if player is above/below)
        const bossBottom = this.y + this.height;
        const playerBottom = player.y + player.height;
        const vertOverlap = bossBottom > player.y + 10 && this.y < playerBottom - 10;
        if (dist < 70 && vertOverlap && this.attackCooldown <= 0) {
            const meleeDmg = this.level === 3 ? 15 : this.level === 2 ? 12 : 10;
            player.takeDamage(meleeDmg);
            this.attackCooldown = this.level === 3 ? 50 : this.level === 2 ? 60 : 80;
            screenShake = 4;
        }

        // Ranged projectile
        const projInterval = this.level === 3 ? 90 : this.level === 2 ? 120 : 160;
        if (this.attackTimer >= projInterval) {
            const dir = player.x > this.x ? 1 : -1;
            const speed = this.level === 3 ? 5 : this.level === 2 ? 4 : 3;
            this.projectiles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: dir * speed,
                vy: 0,
                size: this.level === 3 ? 16 : 12
            });
            this.attackTimer = 0;
        }

        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.flashTimer > 0) this.flashTimer--;

        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx;

            // Hit player
            if (p.x < player.x + player.width && p.x + p.size > player.x &&
                p.y < player.y + player.height && p.y + p.size > player.y) {
                player.takeDamage(this.level === 3 ? 12 : 8);
                spawnParticles(p.x, p.y, '#ff6347', 6, 4);
                this.projectiles.splice(i, 1);
                continue;
            }

            if (p.x < -20 || p.x > CANVAS_WIDTH + 20) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.flashTimer = 8;
        if (this.hp <= 0) {
            this.hp = 0;
            this.dead = true;
            screenShake = 10;
            spawnParticles(this.x + this.width / 2, this.y + this.height / 2, '#ffaa00', 20, 8);
        }
        return this.dead;
    }

    render(ctx) {
        ctx.save();
        const flash = this.flashTimer > 0;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height + 4, this.width / 2.2, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.level === 3) {
            // DEMON KING
            const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
            grad.addColorStop(0, flash ? '#ff88ff' : '#5a1a8a');
            grad.addColorStop(0.5, flash ? '#ff44ff' : '#3d1260');
            grad.addColorStop(1, flash ? '#cc00cc' : '#200a35');
            ctx.fillStyle = grad;
            ctx.fillRect(this.x, this.y, this.width, this.height);

            // Inner detail
            ctx.fillStyle = flash ? '#ffaaff' : '#6a1b9a';
            ctx.fillRect(this.x + 6, this.y + 6, this.width - 12, this.height - 12);

            // Horns
            ctx.fillStyle = '#2a0a3e';
            ctx.beginPath();
            ctx.moveTo(this.x + 10, this.y);
            ctx.lineTo(this.x + 5, this.y - 20);
            ctx.lineTo(this.x + 22, this.y);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(this.x + this.width - 10, this.y);
            ctx.lineTo(this.x + this.width - 5, this.y - 20);
            ctx.lineTo(this.x + this.width - 22, this.y);
            ctx.fill();

            // Glowing eyes
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ff0000';
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(this.x + 18, this.y + 25, 14, 10);
            ctx.fillRect(this.x + this.width - 32, this.y + 25, 14, 10);
            ctx.shadowBlur = 0;

            // Pupils
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.x + 22, this.y + 28, 5, 5);
            ctx.fillRect(this.x + this.width - 28, this.y + 28, 5, 5);

            // Mouth
            ctx.fillStyle = '#1a002a';
            ctx.fillRect(this.x + 20, this.y + 50, this.width - 40, 10);
            ctx.fillStyle = '#fff';
            // Teeth
            for (let t = 0; t < 4; t++) {
                ctx.fillRect(this.x + 24 + t * 10, this.y + 50, 4, 5);
            }

            // Aura glow
            ctx.save();
            ctx.globalAlpha = 0.15 + Math.sin(Date.now() * 0.005) * 0.1;
            ctx.shadowBlur = 40;
            ctx.shadowColor = '#9900ff';
            ctx.fillStyle = '#9900ff';
            ctx.fillRect(this.x - 5, this.y - 5, this.width + 10, this.height + 10);
            ctx.restore();

        } else {
            // REGULAR BOSS
            const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
            grad.addColorStop(0, flash ? '#ffaaaa' : '#b02020');
            grad.addColorStop(1, flash ? '#ff6666' : '#6b0000');
            ctx.fillStyle = grad;
            ctx.fillRect(this.x, this.y, this.width, this.height);

            // Armor plates
            ctx.fillStyle = flash ? '#ff8888' : '#4a0000';
            ctx.fillRect(this.x + 8, this.y + 8, this.width - 16, 14);
            ctx.fillRect(this.x + 8, this.y + this.height - 22, this.width - 16, 14);

            // Eyes
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.x + 14, this.y + 18, 10, 10);
            ctx.fillRect(this.x + this.width - 24, this.y + 18, 10, 10);
            ctx.fillStyle = '#ff0';
            ctx.fillRect(this.x + 17, this.y + 20, 5, 6);
            ctx.fillRect(this.x + this.width - 21, this.y + 20, 5, 6);
        }

        // Outline
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        ctx.restore();

        // Projectiles
        for (const p of this.projectiles) {
            ctx.save();
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.level === 3 ? '#ff00ff' : '#ff4400';
            const pGrad = ctx.createRadialGradient(
                p.x + p.size / 2, p.y + p.size / 2, 0,
                p.x + p.size / 2, p.y + p.size / 2, p.size
            );
            pGrad.addColorStop(0, '#fff');
            pGrad.addColorStop(0.4, this.level === 3 ? '#ff44ff' : '#ff6347');
            pGrad.addColorStop(1, this.level === 3 ? '#880088' : '#aa2200');
            ctx.fillStyle = pGrad;
            ctx.beginPath();
            ctx.arc(p.x + p.size / 2, p.y + p.size / 2, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
}

// ============================================
// SECTION 9: COLLISION DETECTION
// ============================================

function rectsOverlap(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x &&
           a.y < b.y + b.height && a.y + a.height > b.y;
}

// ============================================
// SECTION 10: LEVEL DATA AND MANAGEMENT
// ============================================

const levels = [
    {
        platforms: [
            { x: 200, y: 420, width: 150, height: 18 },
            { x: 500, y: 370, width: 150, height: 18 },
            { x: 800, y: 320, width: 150, height: 18 },
            { x: 1000, y: 420, width: 150, height: 18 }
        ],
        enemies: [
            { x: 350, y: 100, type: 'basic' },
            { x: 650, y: 100, type: 'basic' }
        ],
        bossX: 1080
    },
    {
        platforms: [
            { x: 150, y: 450, width: 130, height: 18 },
            { x: 350, y: 390, width: 130, height: 18 },
            { x: 550, y: 340, width: 130, height: 18 },
            { x: 750, y: 390, width: 130, height: 18 },
            { x: 950, y: 450, width: 130, height: 18 },
            { x: 1050, y: 320, width: 130, height: 18 }
        ],
        enemies: [
            { x: 250, y: 100, type: 'basic' },
            { x: 450, y: 100, type: 'medium' },
            { x: 700, y: 100, type: 'basic' },
            { x: 900, y: 100, type: 'medium' }
        ],
        bossX: 1080
    },
    {
        platforms: [
            { x: 100, y: 460, width: 110, height: 18 },
            { x: 260, y: 410, width: 110, height: 18 },
            { x: 420, y: 360, width: 110, height: 18 },
            { x: 580, y: 410, width: 110, height: 18 },
            { x: 740, y: 460, width: 110, height: 18 },
            { x: 880, y: 360, width: 110, height: 18 },
            { x: 1020, y: 410, width: 110, height: 18 },
            { x: 1080, y: 310, width: 110, height: 18 }
        ],
        enemies: [
            { x: 200, y: 100, type: 'basic' },
            { x: 370, y: 100, type: 'medium' },
            { x: 520, y: 100, type: 'hard' },
            { x: 670, y: 100, type: 'basic' },
            { x: 820, y: 100, type: 'medium' },
            { x: 960, y: 100, type: 'hard' }
        ],
        bossX: 1060
    }
];

let player = null;
let enemies = [];
let boss = null;
let platforms = [];

function loadLevel(levelNum) {
    const level = levels[levelNum - 1];

    const oldHp = player ? player.hp : 100;
    const oldStones = player ? [...player.stones] : [];
    player = new Player(60, GROUND_Y - 60);
    player.stones = oldStones;
    player.hp = levelNum > 1 ? Math.min(oldHp + 30, player.maxHp) : player.maxHp;
    player.updateDamageMultiplier();

    platforms = level.platforms.map(p => ({ ...p }));
    enemies = level.enemies.map(e => new Enemy(e.x, e.y, e.type));
    boss = new Boss(level.bossX, 100, levelNum);
    particles = [];
    screenShake = 0;
    entityIdCounter = 100;
}

// ============================================
// SECTION 11: RENDERING - UI
// ============================================

function renderUI() {
    ctx.save();

    // Player health bar
    const bw = 220, bh = 22, bx = 20, by = 20;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    ctx.fillStyle = '#222';
    ctx.fillRect(bx, by, bw, bh);

    const pct = Math.max(0, player.hp / player.maxHp);
    const hpGrad = ctx.createLinearGradient(bx, by, bx + bw * pct, by);
    if (pct > 0.5) { hpGrad.addColorStop(0, '#2ecc71'); hpGrad.addColorStop(1, '#27ae60'); }
    else if (pct > 0.25) { hpGrad.addColorStop(0, '#f39c12'); hpGrad.addColorStop(1, '#e67e22'); }
    else { hpGrad.addColorStop(0, '#e74c3c'); hpGrad.addColorStop(1, '#c0392b'); }
    ctx.fillStyle = hpGrad;
    ctx.fillRect(bx + 1, by + 1, (bw - 2) * pct, bh - 2);

    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`HP: ${Math.ceil(player.hp)} / ${player.maxHp}`, bx + 8, by + 16);

    // Level label
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(CANVAS_WIDTH - 140, 18, 120, 28);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Level ${currentLevel}`, CANVAS_WIDTH - 30, 38);

    // Sword powers
    ctx.textAlign = 'left';
    ctx.font = 'bold 15px Arial';
    let py = 52;
    if (player.stones.includes(STONE_FIRE)) {
        ctx.fillStyle = 'rgba(255,69,0,0.35)';
        ctx.fillRect(18, py - 2, 95, 20);
        ctx.fillStyle = '#ff6633';
        ctx.fillText('Fire', 28, py + 14);
        py += 24;
    }
    if (player.stones.includes(STONE_WATER)) {
        ctx.fillStyle = 'rgba(0,191,255,0.35)';
        ctx.fillRect(18, py - 2, 95, 20);
        ctx.fillStyle = '#33bbff';
        ctx.fillText('Water', 28, py + 14);
        py += 24;
    }
    if (player.stones.includes(STONE_LIGHTNING)) {
        ctx.fillStyle = 'rgba(255,215,0,0.35)';
        ctx.fillRect(18, py - 2, 95, 20);
        ctx.fillStyle = '#ffcc00';
        ctx.fillText('Lightning', 28, py + 14);
        py += 24;
    }

    // Boss health bar
    if (boss && boss.hp > 0) {
        const bbw = 420, bbh = 28;
        const bbx = (CANVAS_WIDTH - bbw) / 2, bby = 18;

        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(bbx - 2, bby - 2, bbw + 4, bbh + 4);
        ctx.fillStyle = '#222';
        ctx.fillRect(bbx, bby, bbw, bbh);

        const bpct = Math.max(0, boss.hp / boss.maxHp);
        const bgCol = boss.level === 3 ? ['#9900ff', '#440088'] : ['#cc2222', '#660000'];
        const bossGrad = ctx.createLinearGradient(bbx, bby, bbx + bbw * bpct, bby);
        bossGrad.addColorStop(0, bgCol[0]);
        bossGrad.addColorStop(1, bgCol[1]);
        ctx.fillStyle = bossGrad;
        ctx.fillRect(bbx + 2, bby + 2, (bbw - 4) * bpct, bbh - 4);

        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 1;
        ctx.strokeRect(bbx, bby, bbw, bbh);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        const bossName = boss.level === 3 ? 'DEMON KING' : `BOSS Lv.${boss.level}`;
        ctx.textAlign = 'left';
        ctx.fillText(bossName, bbx + 10, bby + 20);
        ctx.textAlign = 'right';
        ctx.fillText(`${Math.ceil(boss.hp)} / ${boss.maxHp}`, bbx + bbw - 10, bby + 20);
    }

    ctx.restore();
}

// ============================================
// SECTION 12: RENDERING - SCREENS
// ============================================

function renderTitleScreen() {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bgGrad.addColorStop(0, '#1a1a3e');
    bgGrad.addColorStop(1, '#0a0e27');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Stars
    const t = Date.now() * 0.001;
    for (let i = 0; i < 80; i++) {
        const sx = (i * 37 + 11) % CANVAS_WIDTH;
        const sy = (i * 23 + 7) % CANVAS_HEIGHT;
        const brightness = 0.3 + Math.sin(t + i) * 0.3;
        ctx.fillStyle = `rgba(255,255,255,${brightness})`;
        ctx.fillRect(sx, sy, 2, 2);
    }

    ctx.textAlign = 'center';

    // Title
    ctx.save();
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ffd700';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 54px Arial';
    ctx.fillText('DRAGON STONES KNIGHT', CANVAS_WIDTH / 2, 160);
    ctx.restore();

    // Subtitle
    ctx.fillStyle = '#bbb';
    ctx.font = '22px Arial';
    ctx.fillText('Defeat enemies, collect dragon stones, forge the ultimate sword!', CANVAS_WIDTH / 2, 210);

    // Controls box
    const boxX = CANVAS_WIDTH / 2 - 220, boxY = 260, boxW = 440, boxH = 180;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 22px Arial';
    ctx.fillText('Controls', CANVAS_WIDTH / 2, boxY + 35);
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText('Arrow Keys / WASD : Move + Jump', CANVAS_WIDTH / 2, boxY + 70);
    ctx.fillText('Space / W / Up Arrow : Jump', CANVAS_WIDTH / 2, boxY + 100);
    ctx.fillText('X / Z / J : Attack', CANVAS_WIDTH / 2, boxY + 130);
    ctx.fillText('Enter : Confirm', CANVAS_WIDTH / 2, boxY + 160);

    // Blinking start prompt
    if (Math.sin(t * 3) > 0) {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffd700';
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 30px Arial';
        ctx.fillText('Press ENTER to Start', CANVAS_WIDTH / 2, 510);
        ctx.restore();
    }
}

function renderLevelTransition() {
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 40px Arial';
    ctx.fillText(levelTransitionMessage, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

    ctx.fillStyle = '#ccc';
    ctx.font = '22px Arial';
    ctx.fillText('Your sword grows stronger...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);

    // Progress bar for transition timer
    const progress = 1 - (levelTransitionTimer / 180);
    ctx.fillStyle = '#333';
    ctx.fillRect(CANVAS_WIDTH / 2 - 150, CANVAS_HEIGHT / 2 + 60, 300, 10);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(CANVAS_WIDTH / 2 - 150, CANVAS_HEIGHT / 2 + 60, 300 * progress, 10);
}

function renderGameOver() {
    ctx.fillStyle = 'rgba(80,0,0,0.92)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 52px Arial';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

    ctx.font = '24px Arial';
    ctx.fillStyle = '#ccc';
    ctx.fillText(`You reached Level ${currentLevel}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    ctx.fillText('Press ENTER to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
}

function renderVictory() {
    ctx.fillStyle = 'rgba(0,60,0,0.92)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.textAlign = 'center';

    ctx.save();
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ffd700';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 56px Arial';
    ctx.fillText('VICTORY!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    ctx.restore();

    ctx.fillStyle = '#fff';
    ctx.font = '26px Arial';
    ctx.fillText('You have defeated the Demon King!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.fillText('The Ultimate Dragon Sword is yours!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);

    ctx.font = '22px Arial';
    ctx.fillStyle = '#ccc';
    ctx.fillText('Press ENTER to Play Again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
}

// ============================================
// SECTION 13: RENDERING - GAME WORLD
// ============================================

function renderGame() {
    ctx.save();

    // Screen shake offset
    let shakeX = 0, shakeY = 0;
    if (screenShake > 0) {
        shakeX = (Math.random() - 0.5) * screenShake * 2;
        shakeY = (Math.random() - 0.5) * screenShake * 2;
        screenShake--;
    }
    ctx.translate(shakeX, shakeY);

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    skyGrad.addColorStop(0, '#1a1a3e');
    skyGrad.addColorStop(0.6, '#0f1a2e');
    skyGrad.addColorStop(1, '#0a0e27');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, GROUND_Y);

    // Stars
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 60; i++) {
        ctx.fillRect((i * 37 + 5) % CANVAS_WIDTH, (i * 23 + 3) % GROUND_Y, 2, 2);
    }

    // Ground
    const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_HEIGHT);
    groundGrad.addColorStop(0, '#3d6026');
    groundGrad.addColorStop(1, '#1d3006');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

    // Ground line
    ctx.strokeStyle = '#4d7036';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
    ctx.stroke();

    // Grass tufts
    ctx.fillStyle = '#4d7036';
    for (let i = 0; i < CANVAS_WIDTH; i += 30) {
        ctx.fillRect(i, GROUND_Y - 4, 8, 6);
    }

    // Platforms
    for (const p of platforms) {
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(p.x + 4, p.y + p.height + 2, p.width, 6);

        // Platform body
        const pGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.height);
        pGrad.addColorStop(0, '#a09070');
        pGrad.addColorStop(0.5, '#8b7355');
        pGrad.addColorStop(1, '#6b5335');
        ctx.fillStyle = pGrad;
        ctx.fillRect(p.x, p.y, p.width, p.height);

        // Top highlight
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(p.x, p.y, p.width, 3);

        // Outline
        ctx.strokeStyle = '#5b4335';
        ctx.lineWidth = 1;
        ctx.strokeRect(p.x, p.y, p.width, p.height);
    }

    // Enemies
    for (const e of enemies) {
        e.render(ctx);
    }

    // Boss
    if (boss && !boss.dead) {
        boss.render(ctx);
    }

    // Player
    player.render(ctx);

    // Particles
    renderParticles();

    ctx.restore();

    // UI on top (no shake)
    renderUI();
}

// ============================================
// SECTION 14: GAME UPDATE LOOP
// ============================================

function update() {
    if (gameState === STATE_PLAYING) {
        player.update(platforms);

        // Update enemies and remove dead ones
        for (const e of enemies) {
            e.update(player, platforms);
        }
        enemies = enemies.filter(e => !e.dead);

        // Update boss
        if (boss && !boss.dead) {
            boss.update(player, platforms);
        }

        // Player attack vs enemies
        const hitbox = player.getAttackHitbox();
        if (hitbox) {
            for (const e of enemies) {
                if (player.attackHitIds.has(e.id)) continue;
                if (rectsOverlap(hitbox, e)) {
                    const dmg = 25 * player.damageMultiplier;
                    e.takeDamage(dmg);
                    player.attackHitIds.add(e.id);

                    // Knockback from water stone
                    if (player.stones.includes(STONE_WATER)) {
                        e.x += player.facing * 40;
                    }

                    // Chain lightning
                    if (player.stones.includes(STONE_LIGHTNING) && Math.random() < 0.3) {
                        for (const other of enemies) {
                            if (other.id !== e.id && Math.abs(other.x - e.x) < 120) {
                                other.takeDamage(dmg * 0.4);
                                spawnParticles(other.x + other.width / 2, other.y + other.height / 2, '#ffd700', 4, 3);
                            }
                        }
                    }
                }
            }
            enemies = enemies.filter(e => !e.dead);

            // Player attack vs boss
            if (boss && !boss.dead && !player.attackHitIds.has(boss.id)) {
                if (rectsOverlap(hitbox, boss)) {
                    const dmg = 30 * player.damageMultiplier;
                    boss.takeDamage(dmg);
                    player.attackHitIds.add(boss.id);
                }
            }
        }

        // Boss defeated
        if (boss && boss.dead) {
            if (currentLevel === 1) {
                player.addStone(STONE_FIRE);
                levelTransitionMessage = 'Dragon Stone Acquired: FIRE';
                gameState = STATE_LEVEL_TRANSITION;
                levelTransitionTimer = 180;
            } else if (currentLevel === 2) {
                player.addStone(STONE_WATER);
                levelTransitionMessage = 'Dragon Stone Acquired: WATER';
                gameState = STATE_LEVEL_TRANSITION;
                levelTransitionTimer = 180;
            } else if (currentLevel === 3) {
                player.addStone(STONE_LIGHTNING);
                gameState = STATE_VICTORY;
            }
        }

        // Player dead
        if (player.hp <= 0) {
            gameState = STATE_GAME_OVER;
        }

        updateParticles();

    } else if (gameState === STATE_LEVEL_TRANSITION) {
        levelTransitionTimer--;
        updateParticles();
        if (levelTransitionTimer <= 0) {
            currentLevel++;
            if (currentLevel <= 3) {
                loadLevel(currentLevel);
                gameState = STATE_PLAYING;
            } else {
                gameState = STATE_VICTORY;
            }
        }
    }
}

// ============================================
// SECTION 15: MAIN LOOP
// ============================================

function gameLoop() {
    update();

    if (gameState === STATE_TITLE) {
        renderTitleScreen();
    } else if (gameState === STATE_LEVEL_TRANSITION) {
        renderGame();
        renderLevelTransition();
    } else if (gameState === STATE_GAME_OVER) {
        renderGame();
        renderGameOver();
    } else if (gameState === STATE_VICTORY) {
        renderGame();
        renderVictory();
    } else {
        renderGame();
    }

    requestAnimationFrame(gameLoop);
}

// ============================================
// SECTION 16: INITIALIZATION
// ============================================

function startGame() {
    currentLevel = 1;
    player = null;
    enemies = [];
    boss = null;
    particles = [];
    screenShake = 0;
    jumpPressed = false;
    attackPressed = false;
    loadLevel(1);
    gameState = STATE_PLAYING;
}

gameLoop();
