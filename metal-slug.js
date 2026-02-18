// ============================================
// METAL SLUG - Run & Gun (Metal Slug style)
// ============================================

const CW = 1200;
const CH = 600;
const GRAVITY = 0.7;
const GROUND_Y = CH - 60;
const PLAYER_SPEED = 6;
const JUMP_STRENGTH = -14;
const INVINCIBLE_FRAMES = 90;

const STATE_TITLE = 'TITLE';
const STATE_PLAYING = 'PLAYING';
const STATE_GAME_OVER = 'GAME_OVER';
const STATE_VICTORY = 'VICTORY';
const STATE_LEVEL_TRANSITION = 'LEVEL_TRANSITION';

const WEAPON_PISTOL = 'PISTOL';
const WEAPON_HMG = 'HMG';
const WEAPON_ROCKET = 'ROCKET';

const WEAPON_NAMES_FR = { 'PISTOL': 'Pistolet', 'HMG': 'Mitrailleuse', 'ROCKET': 'Roquette' };

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CW;
canvas.height = CH;

let gameState = STATE_TITLE;
let currentLevel = 1;
let cameraX = 0;
let worldWidth = 4000;
let particles = [];
let screenShake = 0;
let levelTransitionTimer = 0;

const keys = {};
let jumpPressed = false;
let shootPressed = false;
let grenadePressed = false;
let meleePressed = false;

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyX', 'KeyZ', 'KeyJ', 'KeyC', 'KeyK', 'KeyV', 'KeyL', 'KeyE', 'KeyF'].includes(e.code)) e.preventDefault();
    if (e.code === 'Enter' && (gameState === STATE_TITLE || gameState === STATE_GAME_OVER || gameState === STATE_VICTORY)) {
        startGame();
        e.preventDefault();
    }
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

function isLeft()   { return keys['ArrowLeft']  || keys['KeyA']; }
function isRight()  { return keys['ArrowRight'] || keys['KeyD']; }
function isJump()   { return keys['Space']      || keys['ArrowUp'] || keys['KeyW']; }
function isCrouch() { return keys['ArrowDown']  || keys['KeyS']; }
function isShoot()  { return keys['KeyX']       || keys['KeyZ'] || keys['KeyJ']; }
function isGrenade() { return keys['KeyC']      || keys['KeyK']; }
function isMelee()  { return keys['KeyV']       || keys['KeyL']; }

// ---- Particles ----
function spawnParticles(x, y, color, count, speed) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * speed,
            vy: (Math.random() - 0.5) * speed - 2,
            life: 15 + Math.random() * 25,
            maxLife: 40,
            color,
            size: 2 + Math.random() * 4
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function renderParticles() {
    for (const p of particles) {
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
}

// ---- Player ----
let player = null;
let playerBullets = [];
let grenades = [];
let meleeCooldown = 0;
let meleeDuration = 0;

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.w = 28;
        this.h = 42;
        this.vx = 0;
        this.vy = 0;
        this.facing = 1;
        this.onGround = false;
        this.crouching = false;
        this.hp = 100;
        this.maxHp = 100;
        this.weapon = WEAPON_PISTOL;
        this.ammo = 0;       // for HMG/ROCKET
        this.grenades = 10;
        this.invincible = 0;
        this.flashTimer = 0;
        this.shootCooldown = 0;
        this.inTank = false;
    }

    update(platforms) {
        if (this.inTank) return;
        if (this.invincible > 0) this.invincible--;
        if (this.flashTimer > 0) this.flashTimer--;

        this.crouching = isCrouch() && this.onGround;
        const height = this.crouching ? this.h * 0.6 : this.h;
        const offsetY = this.crouching ? this.h - height : 0;

        if (!this.crouching) {
            if (isLeft())  { this.vx = -PLAYER_SPEED; this.facing = -1; }
            else if (isRight()) { this.vx = PLAYER_SPEED; this.facing = 1; }
            else this.vx *= 0.8;
            if (Math.abs(this.vx) < 0.2) this.vx = 0;
        } else {
            this.vx *= 0.5;
        }

        if (isJump() && this.onGround && !jumpPressed) {
            this.vy = JUMP_STRENGTH;
            this.onGround = false;
            jumpPressed = true;
            spawnParticles(this.x + this.w/2, this.y + this.h, '#888', 4, 2);
        }
        if (!isJump()) jumpPressed = false;

        this.vy += GRAVITY;
        if (this.vy > 16) this.vy = 16;
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0) this.x = 0;
        if (this.x + this.w > worldWidth) this.x = worldWidth - this.w;

        this.onGround = false;
        if (this.y + height >= GROUND_Y) {
            this.y = GROUND_Y - height;
            this.vy = 0;
            this.onGround = true;
        }
        for (const p of platforms) {
            if (this.vy >= 0 && this.x + this.w > p.x && this.x < p.x + p.width &&
                this.y + height >= p.y && this.y + height <= p.y + p.height + 10) {
                this.y = p.y - height;
                this.vy = 0;
                this.onGround = true;
            }
        }

        // Shooting
        if (this.shootCooldown > 0) this.shootCooldown--;
        if (isShoot() && !this.crouching) {
            if (this.weapon === WEAPON_PISTOL && this.shootCooldown <= 0) {
                this.shootCooldown = 8;
                this.fireBullet(12, 8, 1);
                shootPressed = true;
            } else if ((this.weapon === WEAPON_HMG || this.weapon === WEAPON_ROCKET) && this.ammo > 0 && this.shootCooldown <= 0) {
                if (this.weapon === WEAPON_HMG) {
                    this.shootCooldown = 4;
                    this.fireBullet(14, 6, 2);
                } else {
                    this.shootCooldown = 30;
                    this.fireRocket();
                }
                this.ammo--;
                shootPressed = true;
                if (this.ammo <= 0) this.weapon = WEAPON_PISTOL;
            }
        }
        if (!isShoot()) shootPressed = false;

        // Grenade
        if (isGrenade() && this.grenades > 0 && !grenadePressed) {
            grenades.push({
                x: this.x + this.w/2,
                y: this.y + this.h - 10,
                vx: this.facing * 6,
                vy: -10,
                timer: 90,
                owner: 'player'
            });
            this.grenades--;
            grenadePressed = true;
        }
        if (!isGrenade()) grenadePressed = false;

        // Melee
        if (meleeCooldown > 0) meleeCooldown--;
        if (meleeDuration > 0) meleeDuration--;
        if (isMelee() && meleeCooldown <= 0 && meleeDuration <= 0) {
            meleeDuration = 12;
            meleeCooldown = 25;
            meleePressed = true;
        }
        if (!isMelee()) meleePressed = false;
    }

    fireBullet(speed, damage, size) {
        playerBullets.push({
            x: this.facing === 1 ? this.x + this.w : this.x,
            y: this.y + this.h/2 - 2,
            vx: this.facing * speed,
            vy: 0,
            w: size * 4,
            h: size * 2,
            damage,
            fromRocket: false
        });
    }

    fireRocket() {
        playerBullets.push({
            x: this.facing === 1 ? this.x + this.w : this.x - 16,
            y: this.y + this.h/2 - 8,
            vx: this.facing * 11,
            vy: 0,
            w: 16,
            h: 8,
            damage: 40,
            fromRocket: true
        });
    }

    takeDamage(amount) {
        if (this.invincible > 0) return;
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
        this.invincible = INVINCIBLE_FRAMES;
        this.flashTimer = 15;
        screenShake = 8;
        spawnParticles(this.x + this.w/2, this.y + this.h/2, '#f00', 12, 6);
    }

    render() {
        if (this.inTank) return;
        if (this.invincible > 0 && Math.floor(this.invincible / 4) % 2 === 0) return;

        ctx.save();
        const flash = this.flashTimer > 0;
        const h = this.crouching ? this.h * 0.6 : this.h;
        const offsetY = this.crouching ? this.h - h : 0;

        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x + this.w/2, this.y + h + 4, this.w/2.5, 4, 0, 0, Math.PI*2);
        ctx.fill();

        ctx.fillStyle = flash ? '#f88' : '#8b7355';
        ctx.fillRect(this.x + 4, this.y + offsetY, this.w - 8, 8);
        ctx.fillStyle = flash ? '#c66' : '#4a3728';
        ctx.fillRect(this.x + 2, this.y + 8 + offsetY, this.w - 4, 6);
        ctx.fillStyle = flash ? '#faa' : '#c4a574';
        ctx.fillRect(this.x + 4, this.y + 14 + offsetY, this.w - 8, h - 18);
        ctx.fillStyle = flash ? '#800' : '#2a2a2a';
        ctx.fillRect(this.x + 6, this.y + 12 + offsetY, 6, 8);
        ctx.fillRect(this.x + this.w - 12, this.y + 12 + offsetY, 6, 8);

        if (!this.crouching) {
            const gunX = this.facing === 1 ? this.x + this.w - 4 : this.x + 4;
            const gunY = this.y + this.h/2 - 4;
            ctx.fillStyle = '#333';
            ctx.fillRect(gunX, gunY, this.facing * 14, 6);
        }

        ctx.restore();
    }
}

// ---- Melee hitbox ----
function getMeleeHitbox() {
    if (meleeDuration <= 0 || !player || player.inTank) return null;
    const w = 40;
    return {
        x: player.facing === 1 ? player.x + player.w - 10 : player.x - w + 10,
        y: player.y + 10,
        width: w,
        height: player.h - 15
    };
}

// ---- Enemies ----
let enemies = [];
let enemyBullets = [];

class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.w = 26;
        this.h = 38;
        this.vx = 0;
        this.vy = 0;
        this.type = type || 'soldier';
        this.hp = type === 'soldier' ? 15 : type === 'heavy' ? 30 : 20;
        this.maxHp = this.hp;
        this.facing = -1;
        this.shootCooldown = 0;
        this.dead = false;
        this.flashTimer = 0;
    }

    update(platforms) {
        if (this.dead) return;
        const dx = player && !player.inTank ? player.x + player.w/2 - (this.x + this.w/2) : 0;
        if (Math.abs(dx) > 200) this.facing = dx > 0 ? 1 : -1;
        this.vx = this.facing * 1.2;
        this.vy += GRAVITY;
        if (this.vy > 14) this.vy = 14;
        this.x += this.vx;
        this.y += this.vy;

        if (this.y + this.h >= GROUND_Y) {
            this.y = GROUND_Y - this.h;
            this.vy = 0;
        }
        for (const p of platforms) {
            if (this.vy >= 0 && this.x + this.w > p.x && this.x < p.x + p.width &&
                this.y + this.h >= p.y && this.y + this.h <= p.y + p.height + 10) {
                this.y = p.y - this.h;
                this.vy = 0;
            }
        }

        if (this.shootCooldown > 0) this.shootCooldown--;
        if (player && !player.inTank && this.shootCooldown <= 0 && Math.abs(dx) < 400 && Math.abs(dx) > 50) {
            this.shootCooldown = 60;
            enemyBullets.push({
                x: this.facing === 1 ? this.x + this.w : this.x,
                y: this.y + this.h/2 - 2,
                vx: this.facing * 9,
                vy: 0,
                w: 6,
                h: 4,
                damage: 8
            });
        }

        if (this.flashTimer > 0) this.flashTimer--;
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.flashTimer = 5;
        if (this.hp <= 0) {
            this.dead = true;
            spawnParticles(this.x + this.w/2, this.y + this.h/2, '#c44', 10, 5);
        }
    }

    render() {
        if (this.dead) return;
        ctx.save();
        const flash = this.flashTimer > 0;
        ctx.fillStyle = flash ? '#fff' : '#6b5344';
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.fillStyle = flash ? '#c00' : '#4a3020';
        ctx.fillRect(this.x + 4, this.y + 8, 6, 6);
        ctx.fillRect(this.x + this.w - 10, this.y + 8, 6, 6);
        const gx = this.facing === 1 ? this.x + this.w - 4 : this.x;
        ctx.fillStyle = '#333';
        ctx.fillRect(gx, this.y + this.h/2 - 3, this.facing * 12, 4);
        ctx.restore();
    }
}

// ---- POW ----
let pows = [];

class POW {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.w = 20;
        this.h = 28;
        this.rescued = false;
        this.bob = 0;
    }

    update() {
        this.bob += 0.08;
    }

    render() {
        if (this.rescued) return;
        ctx.save();
        const by = Math.sin(this.bob) * 2;
        ctx.fillStyle = '#8b6914';
        ctx.fillRect(this.x + 4, this.y + by, this.w - 8, this.h - 4);
        ctx.fillStyle = '#c4a574';
        ctx.fillRect(this.x + 6, this.y + 6 + by, 6, 8);
        ctx.fillRect(this.x + this.w - 12, this.y + 6 + by, 6, 8);
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.fillText('PG', this.x + 2, this.y - 4 + by);
        ctx.restore();
    }
}

// ---- Tank (Metal Slug) ----
let tanks = [];
let tank = null;

class Tank {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.w = 56;
        this.h = 36;
        this.vx = 0;
        this.vy = 0;
        this.hp = 100;
        this.maxHp = 100;
        this.facing = 1;
        this.cannonCooldown = 0;
        this.playerInside = false;
    }

    update(platforms) {
        if (!this.playerInside || !player) return;
        player.x = this.x + 8;
        player.y = this.y + 4;
        player.vx = 0;
        player.vy = 0;

        if (isLeft())  { this.vx = -5; this.facing = -1; }
        else if (isRight()) { this.vx = 5; this.facing = 1; }
        else this.vx *= 0.8;
        if (Math.abs(this.vx) < 0.2) this.vx = 0;

        this.vy += GRAVITY;
        if (this.vy > 12) this.vy = 12;
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0) this.x = 0;
        if (this.x + this.w > worldWidth) this.x = worldWidth - this.w;
        if (this.y + this.h >= GROUND_Y) {
            this.y = GROUND_Y - this.h;
            this.vy = 0;
        }
        for (const p of platforms) {
            if (this.vy >= 0 && this.x + this.w > p.x && this.x < p.x + p.width &&
                this.y + this.h >= p.y && this.y + this.h <= p.y + p.height + 10) {
                this.y = p.y - this.h;
                this.vy = 0;
            }
        }

        if (this.cannonCooldown > 0) this.cannonCooldown--;
        if (isShoot() && this.cannonCooldown <= 0) {
            this.cannonCooldown = 25;
            playerBullets.push({
                x: this.facing === 1 ? this.x + this.w - 8 : this.x - 20,
                y: this.y + this.h/2 - 6,
                vx: this.facing * 13,
                vy: 0,
                w: 20,
                h: 12,
                damage: 25,
                fromRocket: true
            });
        }

        if (keys['KeyE'] || keys['KeyF']) {
            this.playerInside = false;
            player.inTank = false;
            player.x = this.facing === 1 ? this.x + this.w + 5 : this.x - player.w - 5;
            player.y = this.y + this.h - player.h;
            player.invincible = 30;
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            if (this.playerInside && player) {
                this.playerInside = false;
                player.inTank = false;
                player.x = this.x + this.w/2 - player.w/2;
                player.y = this.y - player.h;
                player.invincible = 60;
            }
            spawnParticles(this.x + this.w/2, this.y + this.h/2, '#f80', 20, 8);
        }
    }

    render() {
        ctx.save();
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(this.x, this.y + 8, this.w, this.h - 8);
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x + 4, this.y + 4, this.w - 8, 8);
        ctx.fillRect(this.x + this.w/2 - 6, this.y - 4, 12, 12);
        const cannonX = this.facing === 1 ? this.x + this.w : this.x - 24;
        ctx.fillStyle = '#222';
        ctx.fillRect(cannonX, this.y + this.h/2 - 4, this.facing * 24, 8);
        if (this.playerInside) {
            ctx.fillStyle = '#8b7355';
            ctx.fillRect(this.x + 18, this.y + 14, 12, 10);
        }
        ctx.restore();
    }
}

// ---- Boss ----
let boss = null;

class Boss {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.w = 80;
        this.h = 70;
        this.hp = 200;
        this.maxHp = 200;
        this.vx = 0;
        this.vy = 0;
        this.attackCooldown = 0;
        this.dead = false;
        this.flashTimer = 0;
    }

    update(platforms) {
        if (this.dead) return;
        const dx = player && !player.inTank ? player.x - this.x : 0;
        this.vx = dx > 0 ? 0.8 : -0.8;
        this.vy += GRAVITY;
        this.x += this.vx;
        this.y += this.vy;
        if (this.y + this.h >= GROUND_Y) {
            this.y = GROUND_Y - this.h;
            this.vy = 0;
        }
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.attackCooldown <= 0 && player && !player.inTank) {
            this.attackCooldown = 80;
            const dir = player.x > this.x ? 1 : -1;
            enemyBullets.push({ x: this.x + this.w/2, y: this.y + 30, vx: dir * 7, vy: 0, w: 14, h: 10, damage: 15 });
        }
        if (this.flashTimer > 0) this.flashTimer--;
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.flashTimer = 6;
        if (this.hp <= 0) {
            this.dead = true;
            screenShake = 15;
            spawnParticles(this.x + this.w/2, this.y + this.h/2, '#f80', 25, 10);
        }
    }

    render() {
        if (this.dead) return;
        ctx.save();
        const flash = this.flashTimer > 0;
        ctx.fillStyle = flash ? '#faa' : '#8b2020';
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.fillStyle = flash ? '#800' : '#4a0000';
        ctx.fillRect(this.x + 10, this.y + 10, this.w - 20, 15);
        ctx.fillRect(this.x + 20, this.y + 40, 15, 15);
        ctx.fillRect(this.x + this.w - 35, this.y + 40, 15, 15);
        ctx.restore();
    }
}

// ---- Destructible crates ----
let crates = [];

class Crate {
    constructor(x, y, hasItem) {
        this.x = x;
        this.y = y;
        this.w = 32;
        this.h = 28;
        this.broken = false;
        this.hasItem = hasItem;
    }

    render() {
        if (this.broken) return;
        ctx.save();
        ctx.fillStyle = '#8b6914';
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.strokeStyle = '#5a4010';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.w, this.h);
        ctx.restore();
    }
}

// ---- Weapon pickups ----
let weaponPickups = [];

// ---- Collision ----
function rectOverlap(a, b) {
    return a.x < b.x + (b.width || b.w) && a.x + (a.width || a.w) > b.x &&
           a.y < b.y + (b.height || b.h) && a.y + (a.height || a.h) > b.y;
}

// ---- Level data ----
const levels = [
    {
        worldWidth: 4000,
        platforms: [
            { x: 300, y: 450, width: 120, height: 18 },
            { x: 600, y: 400, width: 120, height: 18 },
            { x: 1000, y: 450, width: 120, height: 18 },
            { x: 1400, y: 380, width: 120, height: 18 },
            { x: 2000, y: 450, width: 120, height: 18 },
            { x: 2600, y: 400, width: 120, height: 18 },
            { x: 3200, y: 450, width: 120, height: 18 }
        ],
        enemies: [
            { x: 400, y: 100, type: 'soldier' },
            { x: 700, y: 100, type: 'soldier' },
            { x: 1100, y: 100, type: 'soldier' },
            { x: 1500, y: 100, type: 'heavy' },
            { x: 2100, y: 100, type: 'soldier' },
            { x: 2400, y: 100, type: 'soldier' },
            { x: 2700, y: 100, type: 'heavy' },
            { x: 3300, y: 100, type: 'soldier' }
        ],
        pows: [
            { x: 500, y: GROUND_Y - 60 },
            { x: 1200, y: GROUND_Y - 60 },
            { x: 2200, y: GROUND_Y - 60 }
        ],
        crates: [
            { x: 350, y: GROUND_Y - 58, item: true },
            { x: 800, y: GROUND_Y - 58, item: false },
            { x: 1600, y: GROUND_Y - 58, item: true }
        ],
        tankX: 1800,
        bossX: 3700
    },
    {
        worldWidth: 4500,
        platforms: [
            { x: 200, y: 460, width: 100, height: 18 },
            { x: 500, y: 400, width: 100, height: 18 },
            { x: 900, y: 460, width: 100, height: 18 },
            { x: 1300, y: 350, width: 100, height: 18 },
            { x: 1800, y: 460, width: 100, height: 18 },
            { x: 2200, y: 400, width: 100, height: 18 },
            { x: 2700, y: 460, width: 100, height: 18 },
            { x: 3100, y: 380, width: 100, height: 18 },
            { x: 3600, y: 460, width: 100, height: 18 }
        ],
        enemies: [
            { x: 350, y: 100, type: 'soldier' },
            { x: 600, y: 100, type: 'heavy' },
            { x: 1000, y: 100, type: 'soldier' },
            { x: 1400, y: 100, type: 'soldier' },
            { x: 1900, y: 100, type: 'heavy' },
            { x: 2300, y: 100, type: 'soldier' },
            { x: 2800, y: 100, type: 'heavy' },
            { x: 3200, y: 100, type: 'soldier' },
            { x: 3500, y: 100, type: 'heavy' }
        ],
        pows: [
            { x: 700, y: GROUND_Y - 60 },
            { x: 1700, y: GROUND_Y - 60 },
            { x: 2900, y: GROUND_Y - 60 }
        ],
        crates: [
            { x: 450, y: GROUND_Y - 58, item: true },
            { x: 1100, y: GROUND_Y - 58, item: true },
            { x: 2500, y: GROUND_Y - 58, item: false }
        ],
        tankX: 2000,
        bossX: 4200
    }
];

let platforms = [];

function loadLevel(num) {
    const level = levels[num - 1] || levels[0];
    worldWidth = level.worldWidth;
    platforms = level.platforms.map(p => ({ ...p }));

    const prevHp = player ? player.hp : 100;
    const prevGrenades = player ? player.grenades : 10;
    const prevWeapon = player ? player.weapon : WEAPON_PISTOL;
    const prevAmmo = player ? player.ammo : 0;

    player = new Player(80, GROUND_Y - 50);
    player.hp = Math.min(prevHp + 20, player.maxHp);
    player.grenades = Math.min(prevGrenades + 5, 20);
    player.weapon = prevWeapon;
    player.ammo = prevAmmo;

    enemies = level.enemies.map(e => new Enemy(e.x, e.y, e.type));
    pows = level.pows.map(p => new POW(p.x, p.y));
    crates = level.crates.map(c => new Crate(c.x, c.y, c.item));
    weaponPickups = [];

    if (level.tankX != null) {
        tank = new Tank(level.tankX, GROUND_Y - 36);
    } else {
        tank = null;
    }

    boss = level.bossX != null ? new Boss(level.bossX, GROUND_Y - 70) : null;

    playerBullets = [];
    enemyBullets = [];
    grenades = [];
    particles = [];
    cameraX = 0;
    screenShake = 0;
}

// ---- Update ----
function update() {
    if (gameState !== STATE_PLAYING) {
        if (gameState === STATE_LEVEL_TRANSITION) {
            levelTransitionTimer--;
            updateParticles();
            if (levelTransitionTimer <= 0) {
                currentLevel++;
                if (currentLevel <= levels.length) {
                    loadLevel(currentLevel);
                    gameState = STATE_PLAYING;
                } else {
                    gameState = STATE_VICTORY;
                }
            }
        }
        return;
    }

    const pl = player;
    const plat = platforms;

    pl.update(plat);
    if (tank && tank.playerInside) tank.update(plat);
    else if (tank && !tank.playerInside && rectOverlap(pl, tank) && (keys['KeyE'] || keys['KeyF']) && tank.hp > 0) {
        tank.playerInside = true;
        pl.inTank = true;
    }

    enemies.forEach(e => e.update(plat));
    enemies = enemies.filter(e => !e.dead);

    pows.forEach(p => p.update());

    if (boss && !boss.dead) boss.update(plat);

    const melee = getMeleeHitbox();
    enemies.forEach(e => {
        if (melee && rectOverlap(melee, e)) e.takeDamage(20);
    });
    pows.forEach(p => {
        if (!p.rescued && pl && (rectOverlap(pl, p) || (melee && rectOverlap(melee, p)))) {
            p.rescued = true;
            const r = Math.random();
            if (r < 0.4) { pl.weapon = WEAPON_HMG; pl.ammo = 50; }
            else if (r < 0.7) { pl.weapon = WEAPON_ROCKET; pl.ammo = 5; }
            else { pl.grenades = Math.min(pl.grenades + 5, 20); }
            spawnParticles(p.x + p.w/2, p.y + p.h/2, '#ff0', 8, 4);
        }
    });

    crates.forEach(c => {
        if (c.broken) return;
        if (melee && rectOverlap(melee, c)) {
            c.broken = true;
            spawnParticles(c.x + c.w/2, c.y + c.h/2, '#a66', 6, 4);
            if (c.hasItem) {
                weaponPickups.push({ x: c.x, y: c.y, type: Math.random() < 0.5 ? WEAPON_HMG : WEAPON_ROCKET, ammo: Math.random() < 0.5 ? 30 : 5 });
            }
        }
    });

    weaponPickups.forEach(pu => {
        if (pl && !pl.inTank && rectOverlap(pl, { x: pu.x, y: pu.y, w: 24, h: 24 })) {
            pl.weapon = pu.type;
            pl.ammo = pu.ammo;
            pu.collected = true;
            spawnParticles(pu.x + 12, pu.y + 12, '#4f4', 6, 3);
        }
    });
    weaponPickups = weaponPickups.filter(pu => !pu.collected);

    playerBullets.forEach(b => {
        b.x += b.vx;
        b.y += b.vy;
    });
    playerBullets = playerBullets.filter(b => b.x > -50 && b.x < worldWidth + 50);

    enemies.forEach(e => {
        playerBullets.forEach(b => {
            if (rectOverlap(b, e)) {
                e.takeDamage(b.damage);
                b.dead = true;
                if (b.fromRocket) spawnParticles(b.x, b.y, '#f80', 8, 5);
            }
        });
    });
    if (boss && !boss.dead) {
        playerBullets.forEach(b => {
            if (rectOverlap(b, boss)) {
                boss.takeDamage(b.damage);
                b.dead = true;
                if (b.fromRocket) spawnParticles(b.x, b.y, '#f80', 10, 6);
            }
        });
    }
    if (tank && tank.hp > 0 && !tank.playerInside) {
        playerBullets.forEach(b => {
            if (rectOverlap(b, tank)) {
                tank.takeDamage(b.damage);
                b.dead = true;
            }
        });
    }
    playerBullets = playerBullets.filter(b => !b.dead);

    enemyBullets.forEach(b => {
        b.x += b.vx;
        b.y += b.vy;
    });
    enemyBullets = enemyBullets.filter(b => b.x > -50 && b.x < worldWidth + 50);

    if (pl && !pl.inTank) {
        enemyBullets.forEach(b => {
            if (rectOverlap(pl, b)) {
                pl.takeDamage(b.damage);
                b.dead = true;
            }
        });
    }
    if (tank && tank.playerInside) {
        enemyBullets.forEach(b => {
            if (rectOverlap(tank, b)) {
                tank.takeDamage(b.damage);
                b.dead = true;
            }
        });
    }
    enemyBullets = enemyBullets.filter(b => !b.dead);

    grenades.forEach(g => {
        g.x += g.vx;
        g.y += g.vy;
        g.vy += 0.4;
        g.timer--;
        if (g.timer <= 0 || g.y >= GROUND_Y - 5) {
            g.explode = true;
            const r = 60;
            spawnParticles(g.x, g.y, '#f80', 25, 10);
            screenShake = 5;
            enemies.forEach(e => {
                if (Math.hypot(e.x + e.w/2 - g.x, e.y + e.h/2 - g.y) < r) e.takeDamage(35);
            });
            if (boss && !boss.dead && Math.hypot(boss.x + boss.w/2 - g.x, boss.y + boss.h/2 - g.y) < r) boss.takeDamage(40);
            if (tank && tank.hp > 0 && Math.hypot(tank.x + tank.w/2 - g.x, tank.y + tank.h/2 - g.y) < r) tank.takeDamage(30);
            if (pl && !pl.inTank && Math.hypot(pl.x + pl.w/2 - g.x, pl.y + pl.h/2 - g.y) < r) pl.takeDamage(20);
        }
    });
    grenades = grenades.filter(g => !g.explode);

    if (pl.hp <= 0) gameState = STATE_GAME_OVER;
    if (boss && boss.dead) {
        if (currentLevel < levels.length) {
            levelTransitionTimer = 180;
            gameState = STATE_LEVEL_TRANSITION;
        } else {
            gameState = STATE_VICTORY;
        }
    }

    updateParticles();
}

// ---- Camera ----
function updateCamera() {
    if (!player) return;
    let tx = player.inTank && tank ? tank.x + tank.w/2 - CW/2 : player.x + player.w/2 - CW/2;
    cameraX = tx;
    if (cameraX < 0) cameraX = 0;
    if (cameraX + CW > worldWidth) cameraX = worldWidth - CW;
}

// ---- Render ----
function render() {
    if (gameState === STATE_TITLE) {
        ctx.fillStyle = '#1a0a0a';
        ctx.fillRect(0, 0, CW, CH);
        ctx.fillStyle = '#c44';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('COURSE ARMÉE', CW/2, 180);
        ctx.fillStyle = '#aaa';
        ctx.font = '20px Arial';
        ctx.fillText('Course et Tir', CW/2, 230);
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.fillText('Flèches/WASD : Déplacer, Sauter, S\'accroupir', CW/2, 320);
        ctx.fillText('X/Z/J : Tirer  |  C/K : Grenade  |  V/L : Corps à corps', CW/2, 350);
        ctx.fillText('E/F : Monter/Descendre du char', CW/2, 380);
        ctx.fillText('Sauvez les prisonniers pour des armes ! Détruisez les caisses !', CW/2, 420);
        ctx.fillStyle = '#fa0';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('Appuyez sur ENTRÉE pour commencer', CW/2, 520);
        return;
    }

    if (gameState === STATE_GAME_OVER) {
        ctx.fillStyle = 'rgba(80,0,0,0.9)';
        ctx.fillRect(0, 0, CW, CH);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 52px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PARTIE TERMINÉE', CW/2, CH/2 - 30);
        ctx.font = '22px Arial';
        ctx.fillText('Appuyez sur ENTRÉE pour recommencer', CW/2, CH/2 + 30);
        return;
    }

    if (gameState === STATE_VICTORY) {
        ctx.fillStyle = 'rgba(0,50,0,0.9)';
        ctx.fillRect(0, 0, CW, CH);
        ctx.fillStyle = '#ff0';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('MISSION ACCOMPLIE !', CW/2, CH/2 - 40);
        ctx.fillStyle = '#fff';
        ctx.font = '22px Arial';
        ctx.fillText('Appuyez sur ENTRÉE pour rejouer', CW/2, CH/2 + 30);
        return;
    }

    if (gameState === STATE_LEVEL_TRANSITION) {
        ctx.fillStyle = 'rgba(0,0,0,0.9)';
        ctx.fillRect(0, 0, CW, CH);
        ctx.fillStyle = '#ff0';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Mission ' + (currentLevel + 1), CW/2, CH/2 - 20);
        ctx.fillStyle = '#aaa';
        ctx.font = '20px Arial';
        ctx.fillText('Préparez-vous...', CW/2, CH/2 + 20);
        renderParticles();
        return;
    }

    updateCamera();
    let shakeX = 0, shakeY = 0;
    if (screenShake > 0) {
        shakeX = (Math.random() - 0.5) * screenShake;
        shakeY = (Math.random() - 0.5) * screenShake;
        screenShake--;
    }
    ctx.save();
    ctx.translate(-cameraX + shakeX, shakeY);

    ctx.fillStyle = '#1a2a1a';
    ctx.fillRect(0, 0, worldWidth, GROUND_Y);
    ctx.fillStyle = '#2d4a2d';
    ctx.fillRect(0, GROUND_Y, worldWidth, CH - GROUND_Y);
    ctx.strokeStyle = '#3a5a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(worldWidth, GROUND_Y);
    ctx.stroke();

    for (const p of platforms) {
        ctx.fillStyle = '#6b5344';
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.strokeStyle = '#4a3020';
        ctx.strokeRect(p.x, p.y, p.width, p.height);
    }

    crates.forEach(c => c.render());
    pows.forEach(p => p.render());
    enemies.forEach(e => e.render());
    if (tank && tank.hp > 0) tank.render();
    if (boss && !boss.dead) boss.render();

    weaponPickups.forEach(pu => {
        ctx.fillStyle = pu.type === WEAPON_HMG ? '#4a4' : '#a44';
        ctx.fillRect(pu.x, pu.y, 24, 24);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText(pu.type === WEAPON_HMG ? 'MIT' : 'RKT', pu.x + 4, pu.y + 16);
    });

    grenades.forEach(g => {
        ctx.fillStyle = '#2a2a0a';
        ctx.beginPath();
        ctx.arc(g.x, g.y, 6, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = '#4a4a20';
        ctx.stroke();
    });

    for (const b of playerBullets) {
        ctx.fillStyle = b.fromRocket ? '#f80' : '#ff0';
        ctx.fillRect(b.x, b.y, b.w, b.h);
    }
    for (const b of enemyBullets) {
        ctx.fillStyle = '#f44';
        ctx.fillRect(b.x, b.y, b.w, b.h);
    }

    player.render();
    renderParticles();
    ctx.restore();

    // UI (no camera)
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(10, 10, 220, 80);
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('PV : ' + (player ? player.hp : 0) + ' / ' + (player ? player.maxHp : 100), 20, 32);
    ctx.fillText('Grenades : ' + (player ? player.grenades : 0), 20, 50);
    ctx.fillText('Arme : ' + (player ? (WEAPON_NAMES_FR[player.weapon] || player.weapon) : '-') + (player && player.ammo > 0 ? ' (' + player.ammo + ')' : ''), 20, 68);
    ctx.fillText('Mission ' + currentLevel, CW - 120, 32);
    if (tank && tank.playerInside) {
        ctx.fillStyle = '#8f8';
        ctx.fillText('PV du char : ' + tank.hp, 20, 86);
    }
}

function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

function startGame() {
    currentLevel = 1;
    loadLevel(1);
    gameState = STATE_PLAYING;
}

gameLoop();
