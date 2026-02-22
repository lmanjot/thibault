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

const BONUS_HORNS = 'HORNS';
const BONUS_PISTOL = 'PISTOL';
const BONUS_FLAMETHROWER = 'FLAMETHROWER';

const STATE_UNDERGROUND = 'UNDERGROUND';

// ============================================
// SECTION 2: GAME STATE
// ============================================

let gameState = STATE_TITLE;
let currentLevel = 1;
let levelTransitionTimer = 0;
let levelTransitionMessage = '';
let particles = [];
let screenShake = 0;
let bonuses = [];
let bonusSpawnTimer = 0;
let cameraX = 0;
let playerBullets = [];

let secretWells = [];
let inUnderground = false;
let undergroundPlatforms = [];
let undergroundEnemies = [];
let undergroundBonuses = [];
let savedOverworldState = null;
let undergroundExitX = 0;
let undergroundTimer = 0;
let kamehamehaBeam = null;
let kamehamehaChargeTimer = 0;
let keySequence = [];
let lastKeyTime = 0;
let flameProjectiles = [];

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

    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
    }

    if (e.code === 'Enter') {
        if (gameState === STATE_TITLE || gameState === STATE_GAME_OVER || gameState === STATE_VICTORY) {
            startGame();
        }
        e.preventDefault();
    }

    // Kamehameha combo detection: C, X, C pressed rapidly
    if (gameState === STATE_PLAYING && player && player.isSuperSaiyan) {
        const now = performance.now();
        if (e.code === 'KeyC' || e.code === 'KeyX') {
            if (now - lastKeyTime > 800) keySequence = [];
            keySequence.push(e.code);
            lastKeyTime = now;

            if (keySequence.length >= 3) {
                const last3 = keySequence.slice(-3);
                if (last3[0] === 'KeyC' && last3[1] === 'KeyX' && last3[2] === 'KeyC') {
                    if (!kamehamehaBeam && kamehamehaChargeTimer <= 0) {
                        kamehamehaChargeTimer = 45;
                        if (sounds.kamehameha) sounds.kamehameha();
                    }
                    keySequence = [];
                }
            }
        }
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
function isShoot()  { return keys['KeyC']       || keys['KeyK']; }
function isDown()   { return keys['ArrowDown']  || keys['KeyS']; }

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
// SECTION 5.5: SOUND SYSTEM
// ============================================

const sounds = {
    attack: null,
    jump: null,
    hit: null,
    enemyHit: null,
    bonusPickup: null,
    bossHit: null,
    kamehameha: null,
    enterPipe: null
};

function initSounds() {
    // Create audio context for sound generation
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Generate attack sound (sword swipe)
    sounds.attack = () => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.value = 200;
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0.1, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.1);
    };
    
    // Generate jump sound
    sounds.jump = () => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.setValueAtTime(300, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.15);
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.15, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.15);
    };
    
    // Generate hit sound (player takes damage)
    sounds.hit = () => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.value = 150;
        osc.type = 'square';
        gain.gain.setValueAtTime(0.2, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.2);
    };
    
    // Generate enemy hit sound
    sounds.enemyHit = () => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.setValueAtTime(400, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.15, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.1);
    };
    
    // Generate bonus pickup sound
    sounds.bonusPickup = () => {
        const osc1 = audioContext.createOscillator();
        const osc2 = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioContext.destination);
        osc1.frequency.value = 600;
        osc2.frequency.value = 800;
        osc1.type = 'sine';
        osc2.type = 'sine';
        gain.gain.setValueAtTime(0.2, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        osc1.start(audioContext.currentTime);
        osc2.start(audioContext.currentTime);
        osc1.stop(audioContext.currentTime + 0.3);
        osc2.stop(audioContext.currentTime + 0.3);
    };
    
    sounds.kamehameha = () => {
        const osc = audioContext.createOscillator();
        const osc2 = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.setValueAtTime(150, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(500, audioContext.currentTime + 0.3);
        osc2.frequency.setValueAtTime(200, audioContext.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.3);
        osc.type = 'sawtooth';
        osc2.type = 'sine';
        gain.gain.setValueAtTime(0.15, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        osc.start(audioContext.currentTime);
        osc2.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.5);
        osc2.stop(audioContext.currentTime + 0.5);
    };
    
    sounds.enterPipe = () => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.setValueAtTime(600, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.25);
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.2, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.25);
    };
    
    // Generate boss hit sound
    sounds.bossHit = () => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.setValueAtTime(250, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.15);
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0.2, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.15);
    };
}

// Initialize sounds when page loads
initSounds();

// ============================================
// SECTION 5.6: ENTITY - BONUS
// ============================================

class Bonus {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 24;
        this.type = type;
        this.vy = 0;
        this.onGround = false;
        this.pulseTimer = 0;
        this.collected = false;
    }
    
    update(platforms) {
        this.pulseTimer++;
        
        // Gravity
        this.vy += GRAVITY;
        if (this.vy > 15) this.vy = 15;
        this.y += this.vy;
        
        // Ground collision
        this.onGround = false;
        if (this.y + this.height >= GROUND_Y) {
            this.y = GROUND_Y - this.height;
            this.vy = 0;
            this.onGround = true;
        }
        
        // Platform collision
        for (const plat of platforms) {
            if (this.vy >= 0 &&
                this.x + this.width > plat.x && this.x < plat.x + plat.width &&
                this.y + this.height >= plat.y && this.y + this.height <= plat.y + plat.height + 8) {
                this.y = plat.y - this.height;
                this.vy = 0;
                this.onGround = true;
            }
        }
    }
    
    render(ctx) {
        ctx.save();
        
        // Pulse effect
        const pulse = Math.sin(this.pulseTimer * 0.15) * 0.15 + 1;
        const size = this.width * pulse;
        const offsetX = (this.width - size) / 2;
        const offsetY = (this.height - size) / 2;
        
        if (this.type === BONUS_HORNS) {
            // Glow effect
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ffaa00';
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = '#ffaa00';
            ctx.fillRect(this.x + offsetX, this.y + offsetY, size, size);
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
            
            // Horns icon
            ctx.fillStyle = '#ff8800';
            // Left horn
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2 - 6, this.y + this.height / 2 + 4);
            ctx.lineTo(this.x + this.width / 2 - 8, this.y + this.height / 2 - 4);
            ctx.lineTo(this.x + this.width / 2 - 2, this.y + this.height / 2);
            ctx.closePath();
            ctx.fill();
            // Right horn
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2 + 6, this.y + this.height / 2 + 4);
            ctx.lineTo(this.x + this.width / 2 + 8, this.y + this.height / 2 - 4);
            ctx.lineTo(this.x + this.width / 2 + 2, this.y + this.height / 2);
            ctx.closePath();
            ctx.fill();
        } else if (this.type === BONUS_PISTOL) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#4444ff';
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = '#4444ff';
            ctx.fillRect(this.x + offsetX, this.y + offsetY, size, size);
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x + this.width / 2 - 4, this.y + this.height / 2 + 2, 8, 6);
            ctx.fillRect(this.x + this.width / 2 + 4, this.y + this.height / 2, 6, 4);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2 + 4, 3, 0, Math.PI);
            ctx.stroke();
        } else if (this.type === BONUS_FLAMETHROWER) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ff4400';
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = '#ff4400';
            ctx.fillRect(this.x + offsetX, this.y + offsetY, size, size);
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
            // Flamethrower icon
            ctx.fillStyle = '#555';
            ctx.fillRect(this.x + 4, this.y + this.height / 2, 16, 4);
            ctx.fillStyle = '#ff6600';
            ctx.fillRect(this.x + 18, this.y + this.height / 2 - 2, 5, 8);
            ctx.fillStyle = '#ffcc00';
            ctx.fillRect(this.x + 20, this.y + this.height / 2 - 1, 3, 6);
        }
        
        ctx.restore();
    }
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
        this.hasHorns = false;
        this.hornsTimer = 0;
        this.swordAngle = 0;
        this.swordSwingProgress = 0;
        this.hornHitIds = new Set();
        this.hornHitCooldowns = new Map();
        this.hasPistol = false;
        this.pistolTimer = 0;
        this.shootCooldown = 0;
        this.shootPressed = false;
        this.isSuperSaiyan = false;
        this.ssAuraTimer = 0;
        this.hasFlamethrower = false;
        this.flamethrowerTimer = 0;
        this.flameShootCooldown = 0;
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
            if (sounds.jump) sounds.jump();
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
        if (this.x + this.width > worldWidth) this.x = worldWidth - this.width;

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
            this.swordSwingProgress = 0;
            attackPressed = true;
            spawnParticles(
                this.x + this.width / 2 + this.facing * 30,
                this.y + this.height / 2,
                this.getSwordColor(),
                4, 4
            );
            if (sounds.attack) sounds.attack();
        }
        if (!isAttack()) {
            attackPressed = false;
        }

        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.attackDuration > 0) {
            this.attackDuration--;
            // Sword swing animation
            this.swordSwingProgress = 1 - (this.attackDuration / 12);
            this.swordAngle = this.facing === 1 
                ? -Math.PI * 0.6 + (Math.PI * 0.8 * this.swordSwingProgress)
                : Math.PI * 0.4 - (Math.PI * 0.8 * this.swordSwingProgress);
        } else {
            this.swordAngle = 0;
            this.swordSwingProgress = 0;
        }
        
        // Horns timer countdown
        if (this.hornsTimer > 0) {
            this.hornsTimer--;
            if (this.hornsTimer <= 0) {
                this.hasHorns = false;
                this.hornHitIds.clear();
                this.hornHitCooldowns.clear();
            }
        }
        
        // Update horn hit cooldowns
        for (const [id, cooldown] of this.hornHitCooldowns.entries()) {
            const newCooldown = cooldown - 1;
            if (newCooldown <= 0) {
                this.hornHitCooldowns.delete(id);
                this.hornHitIds.delete(id);
            } else {
                this.hornHitCooldowns.set(id, newCooldown);
            }
        }
        
        // Pistol timer countdown
        if (this.pistolTimer > 0) {
            this.pistolTimer--;
            if (this.pistolTimer <= 0) {
                this.hasPistol = false;
            }
        }
        
        // Shooting with pistol
        if (this.shootCooldown > 0) this.shootCooldown--;
        if (isShoot() && this.hasPistol && this.shootCooldown <= 0 && !this.shootPressed) {
            // Create bullet
            const bulletX = this.facing === 1 ? this.x + this.width : this.x;
            const bulletY = this.y + this.height / 2;
            playerBullets.push({
                x: bulletX,
                y: bulletY,
                vx: this.facing * 12,
                vy: 0,
                width: 8,
                height: 4,
                damage: 15
            });
            this.shootCooldown = 10; // Fast shooting rate
            this.shootPressed = true;
            if (sounds.attack) sounds.attack();
        }
        if (!isShoot()) {
            this.shootPressed = false;
        }

        // Flamethrower shooting
        if (this.flameShootCooldown > 0) this.flameShootCooldown--;
        if (this.hasFlamethrower && this.flamethrowerTimer > 0) {
            this.flamethrowerTimer--;
            if (this.flamethrowerTimer <= 0) {
                this.hasFlamethrower = false;
            }
            if (isShoot() && this.flameShootCooldown <= 0) {
                for (let i = 0; i < 3; i++) {
                    const bulletX = this.facing === 1 ? this.x + this.width : this.x;
                    const bulletY = this.y + this.height / 2 + (Math.random() - 0.5) * 16;
                    flameProjectiles.push({
                        x: bulletX,
                        y: bulletY,
                        vx: this.facing * (8 + Math.random() * 4),
                        vy: (Math.random() - 0.5) * 2,
                        life: 25 + Math.random() * 15,
                        size: 6 + Math.random() * 6,
                        damage: 8
                    });
                }
                this.flameShootCooldown = 4;
            }
        }

        // Super Saiyan aura
        if (this.isSuperSaiyan) {
            this.ssAuraTimer++;
            if (this.ssAuraTimer % 3 === 0) {
                spawnParticles(
                    this.x + this.width / 2 + (Math.random() - 0.5) * 20,
                    this.y + this.height + 5,
                    Math.random() < 0.5 ? '#ffd700' : '#ffaa00',
                    1, 3
                );
            }
        }

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
        // Horns power-up makes player invincible to enemy damage
        if (this.hasHorns) return;
        if (this.invincible > 0) return;
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
        this.invincible = INVINCIBILITY_FRAMES;
        this.flashTimer = 20;
        screenShake = 6;
        spawnParticles(this.x + this.width / 2, this.y + this.height / 2, '#ff0000', 8, 5);
        if (sounds.hit) sounds.hit();
    }
    
    getHornHitbox() {
        if (!this.hasHorns) return null;
        const w = 40;
        const h = 30;
        return {
            x: this.facing === 1 ? this.x + this.width - 10 : this.x - w + 10,
            y: this.y + 5,
            width: w,
            height: h
        };
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

        // Sword with animation
        const sLen = 38;
        const handleX = this.facing === 1 ? bx + bw - 2 : bx - 6;
        const handleY = by + 20;
        const handleCenterX = handleX + 4;
        const handleCenterY = handleY + 3;
        
        ctx.save();
        ctx.translate(handleCenterX, handleCenterY);
        ctx.rotate(this.swordAngle);
        
        // Sword handle
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-4, -3, 8, 12);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-6, -1, 12, 3);
        
        // Blade (positioned relative to handle)
        const bladeX = this.facing === 1 ? 0 : -sLen;
        const bladeY = -3;
        ctx.fillStyle = '#ddd';
        ctx.fillRect(bladeX, bladeY, sLen, 5);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(bladeX, bladeY, sLen, 2);
        
        // Sword glow
        if (this.stones.length > 0) {
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
            ctx.fillRect(bladeX, bladeY - 1, sLen, 7);
        }
        
        ctx.restore();

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
        
        // Horns power-up visual
        if (this.hasHorns) {
            ctx.save();
            const hornColor = '#ffaa00';
            ctx.fillStyle = hornColor;
            ctx.shadowBlur = 15;
            ctx.shadowColor = hornColor;
            
            // Left horn
            ctx.beginPath();
            ctx.moveTo(bx + 8, by + 4);
            ctx.lineTo(bx + 4, by - 8);
            ctx.lineTo(bx + 14, by + 2);
            ctx.closePath();
            ctx.fill();
            
            // Right horn
            ctx.beginPath();
            ctx.moveTo(bx + bw - 8, by + 4);
            ctx.lineTo(bx + bw - 4, by - 8);
            ctx.lineTo(bx + bw - 14, by + 2);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        }
        
        // Super Saiyan hair (yellow spiky hair above helmet)
        if (this.isSuperSaiyan) {
            ctx.save();
            const hairColor = '#ffd700';
            const hairGlow = '#ffee44';
            ctx.shadowBlur = 25;
            ctx.shadowColor = hairGlow;
            ctx.fillStyle = hairColor;

            // Main hair spikes
            ctx.beginPath();
            ctx.moveTo(bx + 4, by + 2);
            ctx.lineTo(bx - 2, by - 18);
            ctx.lineTo(bx + 12, by - 4);
            ctx.lineTo(bx + 10, by - 22);
            ctx.lineTo(bx + 20, by - 6);
            ctx.lineTo(bx + bw / 2, by - 26);
            ctx.lineTo(bx + bw - 16, by - 6);
            ctx.lineTo(bx + bw - 8, by - 20);
            ctx.lineTo(bx + bw - 8, by - 2);
            ctx.lineTo(bx + bw + 2, by - 16);
            ctx.lineTo(bx + bw - 2, by + 2);
            ctx.closePath();
            ctx.fill();

            // Saiyan aura glow around body
            ctx.globalAlpha = 0.12 + Math.sin(Date.now() * 0.01) * 0.06;
            ctx.shadowBlur = 50;
            ctx.shadowColor = '#ffd700';
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(bx - 8, by - 8, bw + 16, bh + 16);
            ctx.globalAlpha = 1;

            ctx.restore();
        }

        // Flamethrower visual (when equipped)
        if (this.hasFlamethrower) {
            ctx.save();
            const ftX = this.facing === 1 ? bx + bw - 4 : bx - 20;
            const ftY = by + 16;
            ctx.fillStyle = '#555';
            ctx.fillRect(ftX, ftY, 24, 6);
            ctx.fillStyle = '#777';
            ctx.fillRect(ftX, ftY, 24, 3);
            ctx.fillStyle = '#333';
            ctx.fillRect(this.facing === 1 ? ftX + 20 : ftX, ftY - 2, 6, 10);
            // Pilot flame
            if (Math.random() > 0.3) {
                ctx.fillStyle = '#ff6600';
                const tip = this.facing === 1 ? ftX + 26 : ftX - 6;
                ctx.fillRect(tip, ftY, 4 + Math.random() * 4, 4);
            }
            ctx.restore();
        }

        // Pistol visual (when equipped)
        if (this.hasPistol) {
            ctx.save();
            const pistolX = this.facing === 1 ? bx + bw - 8 : bx - 12;
            const pistolY = by + 20;
            
            // Pistol handle
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(pistolX, pistolY, 6, 8);
            // Barrel
            ctx.fillStyle = '#333';
            ctx.fillRect(this.facing === 1 ? pistolX + 6 : pistolX - 10, pistolY + 2, 10, 4);
            // Muzzle flash (when shooting)
            if (this.shootCooldown > 7) {
                ctx.fillStyle = '#ffff00';
                ctx.fillRect(this.facing === 1 ? pistolX + 16 : pistolX - 16, pistolY + 1, 4, 6);
            }
            
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
        if (sounds.enemyHit) sounds.enemyHit();
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
        if (sounds.bossHit) sounds.bossHit();
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
        worldWidth: 4000,
        platforms: [
            { x: 200, y: 420, width: 150, height: 18 },
            { x: 500, y: 370, width: 150, height: 18 },
            { x: 800, y: 320, width: 150, height: 18 },
            { x: 1200, y: 420, width: 150, height: 18 },
            { x: 1500, y: 370, width: 150, height: 18 },
            { x: 1800, y: 320, width: 150, height: 18 },
            { x: 2200, y: 420, width: 150, height: 18 },
            { x: 2500, y: 370, width: 150, height: 18 },
            { x: 2800, y: 320, width: 150, height: 18 },
            { x: 3200, y: 420, width: 150, height: 18 },
            { x: 3500, y: 370, width: 150, height: 18 }
        ],
        enemies: [
            { x: 350, y: 100, type: 'basic' },
            { x: 650, y: 100, type: 'basic' },
            { x: 950, y: 100, type: 'basic' },
            { x: 1300, y: 100, type: 'medium' },
            { x: 1600, y: 100, type: 'basic' },
            { x: 1900, y: 100, type: 'medium' },
            { x: 2300, y: 100, type: 'basic' },
            { x: 2600, y: 100, type: 'hard' },
            { x: 2900, y: 100, type: 'medium' },
            { x: 3300, y: 100, type: 'hard' }
        ],
        wells: [{ x: 1850, y: GROUND_Y - 40, width: 48, height: 40 }],
        bossX: 3800
    },
    {
        worldWidth: 4500,
        platforms: [
            { x: 150, y: 450, width: 130, height: 18 },
            { x: 350, y: 390, width: 130, height: 18 },
            { x: 550, y: 340, width: 130, height: 18 },
            { x: 750, y: 390, width: 130, height: 18 },
            { x: 950, y: 450, width: 130, height: 18 },
            { x: 1200, y: 320, width: 130, height: 18 },
            { x: 1500, y: 450, width: 130, height: 18 },
            { x: 1800, y: 390, width: 130, height: 18 },
            { x: 2100, y: 340, width: 130, height: 18 },
            { x: 2400, y: 390, width: 130, height: 18 },
            { x: 2700, y: 450, width: 130, height: 18 },
            { x: 3000, y: 320, width: 130, height: 18 },
            { x: 3300, y: 450, width: 130, height: 18 },
            { x: 3600, y: 390, width: 130, height: 18 }
        ],
        enemies: [
            { x: 250, y: 100, type: 'basic' },
            { x: 450, y: 100, type: 'medium' },
            { x: 700, y: 100, type: 'basic' },
            { x: 900, y: 100, type: 'medium' },
            { x: 1300, y: 100, type: 'hard' },
            { x: 1600, y: 100, type: 'medium' },
            { x: 1900, y: 100, type: 'basic' },
            { x: 2200, y: 100, type: 'hard' },
            { x: 2500, y: 100, type: 'medium' },
            { x: 2800, y: 100, type: 'hard' },
            { x: 3100, y: 100, type: 'medium' },
            { x: 3400, y: 100, type: 'hard' }
        ],
        wells: [{ x: 2600, y: GROUND_Y - 40, width: 48, height: 40 }],
        bossX: 4200
    },
    {
        worldWidth: 5000,
        platforms: [
            { x: 100, y: 460, width: 110, height: 18 },
            { x: 260, y: 410, width: 110, height: 18 },
            { x: 420, y: 360, width: 110, height: 18 },
            { x: 580, y: 410, width: 110, height: 18 },
            { x: 740, y: 460, width: 110, height: 18 },
            { x: 880, y: 360, width: 110, height: 18 },
            { x: 1020, y: 410, width: 110, height: 18 },
            { x: 1200, y: 310, width: 110, height: 18 },
            { x: 1400, y: 460, width: 110, height: 18 },
            { x: 1560, y: 410, width: 110, height: 18 },
            { x: 1720, y: 360, width: 110, height: 18 },
            { x: 1880, y: 410, width: 110, height: 18 },
            { x: 2040, y: 460, width: 110, height: 18 },
            { x: 2200, y: 360, width: 110, height: 18 },
            { x: 2360, y: 410, width: 110, height: 18 },
            { x: 2520, y: 310, width: 110, height: 18 },
            { x: 2700, y: 460, width: 110, height: 18 },
            { x: 2860, y: 410, width: 110, height: 18 },
            { x: 3020, y: 360, width: 110, height: 18 },
            { x: 3180, y: 410, width: 110, height: 18 },
            { x: 3340, y: 460, width: 110, height: 18 },
            { x: 3500, y: 360, width: 110, height: 18 },
            { x: 3660, y: 410, width: 110, height: 18 },
            { x: 3820, y: 310, width: 110, height: 18 }
        ],
        enemies: [
            { x: 200, y: 100, type: 'basic' },
            { x: 370, y: 100, type: 'medium' },
            { x: 520, y: 100, type: 'hard' },
            { x: 670, y: 100, type: 'basic' },
            { x: 820, y: 100, type: 'medium' },
            { x: 960, y: 100, type: 'hard' },
            { x: 1300, y: 100, type: 'hard' },
            { x: 1500, y: 100, type: 'medium' },
            { x: 1700, y: 100, type: 'hard' },
            { x: 1900, y: 100, type: 'basic' },
            { x: 2100, y: 100, type: 'hard' },
            { x: 2300, y: 100, type: 'medium' },
            { x: 2500, y: 100, type: 'hard' },
            { x: 2700, y: 100, type: 'hard' },
            { x: 2900, y: 100, type: 'medium' },
            { x: 3100, y: 100, type: 'hard' },
            { x: 3300, y: 100, type: 'hard' },
            { x: 3500, y: 100, type: 'hard' }
        ],
        wells: [{ x: 2000, y: GROUND_Y - 40, width: 48, height: 40 }],
        bossX: 4700
    }
];

let player = null;
let enemies = [];
let boss = null;
let platforms = [];
let worldWidth = 1200;

function loadLevel(levelNum) {
    const level = levels[levelNum - 1];

    const oldHp = player ? player.hp : 100;
    const oldStones = player ? [...player.stones] : [];
    const hadHorns = player ? player.hasHorns : false;
    const hornsTimer = player ? player.hornsTimer : 0;
    const hadPistol = player ? player.hasPistol : false;
    const pistolTimer = player ? player.pistolTimer : 0;
    const wasSS = player ? player.isSuperSaiyan : false;
    const hadFlame = player ? player.hasFlamethrower : false;
    const flameTimer = player ? player.flamethrowerTimer : 0;
    player = new Player(60, GROUND_Y - 60);
    player.stones = oldStones;
    player.hp = levelNum > 1 ? Math.min(oldHp + 30, player.maxHp) : player.maxHp;
    player.updateDamageMultiplier();
    player.hasHorns = hadHorns;
    player.hornsTimer = hornsTimer;
    player.hasPistol = hadPistol;
    player.pistolTimer = pistolTimer;
    player.isSuperSaiyan = wasSS;
    player.hasFlamethrower = hadFlame;
    player.flamethrowerTimer = flameTimer;

    worldWidth = level.worldWidth || 1200;
    platforms = level.platforms.map(p => ({ ...p }));
    enemies = level.enemies.map(e => new Enemy(e.x, e.y, e.type));
    boss = new Boss(level.bossX, 100, levelNum);
    secretWells = (level.wells || []).map(w => ({ ...w }));
    particles = [];
    bonuses = [];
    playerBullets = [];
    flameProjectiles = [];
    bonusSpawnTimer = 0;
    cameraX = 0;
    screenShake = 0;
    entityIdCounter = 100;
    inUnderground = false;
    savedOverworldState = null;
    kamehamehaBeam = null;
    kamehamehaChargeTimer = 0;
    keySequence = [];
}

// ============================================
// SECTION 10.5: SECRET WELL & UNDERGROUND WORLD
// ============================================

function renderSecretWell(well) {
    ctx.save();
    
    // Pipe/well base (like a Mario pipe)
    const wx = well.x, wy = well.y, ww = well.width, wh = well.height;
    
    // Pipe body
    const pipeGrad = ctx.createLinearGradient(wx, wy, wx + ww, wy);
    pipeGrad.addColorStop(0, '#1a6b1a');
    pipeGrad.addColorStop(0.3, '#2a9b2a');
    pipeGrad.addColorStop(0.7, '#2a9b2a');
    pipeGrad.addColorStop(1, '#1a6b1a');
    ctx.fillStyle = pipeGrad;
    ctx.fillRect(wx + 4, wy + 12, ww - 8, wh - 12);
    
    // Pipe rim (wider top)
    const rimGrad = ctx.createLinearGradient(wx, wy, wx + ww, wy);
    rimGrad.addColorStop(0, '#1a7b1a');
    rimGrad.addColorStop(0.3, '#33bb33');
    rimGrad.addColorStop(0.7, '#33bb33');
    rimGrad.addColorStop(1, '#1a7b1a');
    ctx.fillStyle = rimGrad;
    ctx.fillRect(wx, wy, ww, 14);
    
    // Dark interior
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(wx + 8, wy + 3, ww - 16, 9);
    
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(wx + 6, wy + 14, 6, wh - 16);
    
    // Outline
    ctx.strokeStyle = '#0a4a0a';
    ctx.lineWidth = 2;
    ctx.strokeRect(wx, wy, ww, 14);
    ctx.strokeRect(wx + 4, wy + 12, ww - 8, wh - 12);
    
    // Mysterious glow/sparkle
    const sparkle = Math.sin(Date.now() * 0.005) * 0.4 + 0.6;
    ctx.globalAlpha = sparkle * 0.5;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffdd00';
    ctx.fillStyle = '#ffdd00';
    ctx.fillRect(wx + ww / 2 - 3, wy - 8, 6, 6);
    ctx.globalAlpha = 1;
    
    // Down arrow hint when player is nearby
    if (player && Math.abs(player.x + player.width / 2 - (wx + ww / 2)) < 60 &&
        Math.abs(player.y + player.height - wy) < 20) {
        const bob = Math.sin(Date.now() * 0.008) * 4;
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffd700';
        ctx.fillText('\u2193', wx + ww / 2, wy - 14 + bob);
    }
    
    ctx.restore();
}

function generateUndergroundWorld() {
    const ugWidth = 2400;
    undergroundPlatforms = [
        { x: 100, y: 440, width: 120, height: 18 },
        { x: 300, y: 380, width: 120, height: 18 },
        { x: 550, y: 340, width: 120, height: 18 },
        { x: 800, y: 400, width: 150, height: 18 },
        { x: 1050, y: 350, width: 120, height: 18 },
        { x: 1300, y: 420, width: 140, height: 18 },
        { x: 1550, y: 360, width: 120, height: 18 },
        { x: 1800, y: 400, width: 150, height: 18 },
        { x: 2050, y: 350, width: 120, height: 18 }
    ];
    
    undergroundEnemies = [
        new Enemy(400, 100, 'medium'),
        new Enemy(700, 100, 'hard'),
        new Enemy(1100, 100, 'medium'),
        new Enemy(1500, 100, 'hard'),
        new Enemy(1900, 100, 'hard')
    ];
    
    undergroundBonuses = [
        new Bonus(1800, 300, BONUS_FLAMETHROWER)
    ];
    
    undergroundExitX = 2200;
    undergroundTimer = 0;
    
    return ugWidth;
}

function enterUnderground(wellX) {
    savedOverworldState = {
        platforms: platforms,
        enemies: enemies,
        boss: boss,
        bonuses: bonuses,
        worldWidth: worldWidth,
        playerX: player.x,
        playerY: player.y,
        playerBullets: playerBullets,
        flameProjectiles: flameProjectiles,
        cameraX: cameraX
    };
    
    const ugWidth = generateUndergroundWorld();
    worldWidth = ugWidth;
    platforms = undergroundPlatforms;
    enemies = undergroundEnemies;
    bonuses = undergroundBonuses;
    boss = null;
    playerBullets = [];
    flameProjectiles = [];
    player.x = 60;
    player.y = GROUND_Y - 80;
    player.vy = 0;
    player.vx = 0;
    cameraX = 0;
    particles = [];
    inUnderground = true;
    
    // Super Saiyan transformation
    player.isSuperSaiyan = true;
    player.ssAuraTimer = 0;
    screenShake = 12;
    spawnParticles(player.x + player.width / 2, player.y + player.height / 2, '#ffd700', 30, 8);
    spawnParticles(player.x + player.width / 2, player.y + player.height / 2, '#ffee44', 20, 6);
    if (sounds.enterPipe) sounds.enterPipe();
}

function exitUnderground() {
    if (!savedOverworldState) return;
    
    platforms = savedOverworldState.platforms;
    enemies = savedOverworldState.enemies;
    boss = savedOverworldState.boss;
    bonuses = savedOverworldState.bonuses;
    worldWidth = savedOverworldState.worldWidth;
    playerBullets = savedOverworldState.playerBullets;
    flameProjectiles = [];
    player.x = savedOverworldState.playerX;
    player.y = savedOverworldState.playerY - 10;
    player.vy = -5;
    cameraX = savedOverworldState.cameraX;
    particles = [];
    inUnderground = false;
    savedOverworldState = null;
    
    screenShake = 6;
    spawnParticles(player.x + player.width / 2, player.y + player.height, '#ffd700', 15, 5);
}

function renderUndergroundBackground() {
    // Dark cave background
    const caveGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    caveGrad.addColorStop(0, '#0a0a12');
    caveGrad.addColorStop(0.5, '#12101a');
    caveGrad.addColorStop(1, '#1a1520');
    ctx.fillStyle = caveGrad;
    ctx.fillRect(0, 0, worldWidth, GROUND_Y);
    
    // Cave ceiling stalactites
    for (let i = 0; i < worldWidth; i += 60) {
        const h = 20 + Math.sin(i * 0.1) * 15;
        ctx.fillStyle = '#1a1825';
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 15, h);
        ctx.lineTo(i + 30, 0);
        ctx.closePath();
        ctx.fill();
    }
    
    // Glowing crystals on walls
    for (let i = 0; i < worldWidth; i += 180) {
        const cy = 80 + Math.sin(i * 0.05) * 40;
        ctx.save();
        ctx.shadowBlur = 12;
        const colors = ['#ff44ff', '#44ffff', '#ffff44'];
        const c = colors[Math.floor(i / 180) % 3];
        ctx.shadowColor = c;
        ctx.fillStyle = c;
        ctx.globalAlpha = 0.4 + Math.sin(Date.now() * 0.003 + i) * 0.2;
        ctx.beginPath();
        ctx.moveTo(i + 10, cy);
        ctx.lineTo(i + 15, cy - 12);
        ctx.lineTo(i + 20, cy);
        ctx.lineTo(i + 15, cy + 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    
    // Rocky ground
    const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_HEIGHT);
    groundGrad.addColorStop(0, '#2a2235');
    groundGrad.addColorStop(1, '#15101a');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GROUND_Y, worldWidth, CANVAS_HEIGHT - GROUND_Y);
    
    ctx.strokeStyle = '#3a3045';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(worldWidth, GROUND_Y);
    ctx.stroke();
    
    // Lava pools decorative
    for (let i = 200; i < worldWidth; i += 500) {
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff4400';
        ctx.fillStyle = '#ff4400';
        ctx.globalAlpha = 0.3 + Math.sin(Date.now() * 0.004 + i) * 0.1;
        ctx.fillRect(i, GROUND_Y + 8, 80, 6);
        ctx.fillStyle = '#ffaa00';
        ctx.globalAlpha = 0.2;
        ctx.fillRect(i + 10, GROUND_Y + 10, 60, 3);
        ctx.restore();
    }
    
    // Exit portal
    ctx.save();
    const portalX = undergroundExitX;
    const portalY = GROUND_Y - 60;
    const portalPulse = Math.sin(Date.now() * 0.005) * 5;
    ctx.shadowBlur = 30 + portalPulse;
    ctx.shadowColor = '#00ff88';
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(portalX + 25, portalY + 25, 22 + portalPulse, 28 + portalPulse, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,255,136,0.15)';
    ctx.fill();
    
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', portalX + 25, portalY - 10);
    ctx.restore();
}

function renderKamehameha() {
    if (kamehamehaChargeTimer > 0) {
        // Charging effect - energy ball in hands
        ctx.save();
        const cx = player.x + player.width / 2;
        const cy = player.y + player.height / 2;
        const chargeProgress = 1 - (kamehamehaChargeTimer / 45);
        const radius = 5 + chargeProgress * 15;
        
        ctx.shadowBlur = 30 + chargeProgress * 30;
        ctx.shadowColor = '#00bbff';
        const ballGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        ballGrad.addColorStop(0, '#ffffff');
        ballGrad.addColorStop(0.4, '#88ddff');
        ballGrad.addColorStop(1, 'rgba(0,100,255,0)');
        ctx.fillStyle = ballGrad;
        ctx.beginPath();
        ctx.arc(cx + player.facing * 20, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Charge sparks
        for (let i = 0; i < 4; i++) {
            const angle = (Date.now() * 0.01 + i * Math.PI / 2) % (Math.PI * 2);
            const sr = radius + 10;
            ctx.fillStyle = '#aaeeff';
            ctx.fillRect(
                cx + player.facing * 20 + Math.cos(angle) * sr - 2,
                cy + Math.sin(angle) * sr - 2, 4, 4
            );
        }
        ctx.restore();
    }
    
    if (kamehamehaBeam) {
        ctx.save();
        const b = kamehamehaBeam;
        const beamWidth = 24 + Math.sin(Date.now() * 0.02) * 4;
        
        // Outer glow
        ctx.shadowBlur = 40;
        ctx.shadowColor = '#0088ff';
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#0066cc';
        ctx.fillRect(b.x, b.y - beamWidth / 2 - 6, b.length * b.dir, beamWidth + 12);
        
        // Main beam
        ctx.globalAlpha = 0.9;
        const beamGrad = ctx.createLinearGradient(b.x, b.y - beamWidth / 2, b.x, b.y + beamWidth / 2);
        beamGrad.addColorStop(0, '#00aaff');
        beamGrad.addColorStop(0.3, '#aaeeff');
        beamGrad.addColorStop(0.5, '#ffffff');
        beamGrad.addColorStop(0.7, '#aaeeff');
        beamGrad.addColorStop(1, '#00aaff');
        ctx.fillStyle = beamGrad;
        ctx.fillRect(
            b.dir === 1 ? b.x : b.x - b.length,
            b.y - beamWidth / 2,
            b.length,
            beamWidth
        );
        
        // Core white line
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(
            b.dir === 1 ? b.x : b.x - b.length,
            b.y - 3,
            b.length,
            6
        );
        
        // Impact flash at tip
        const tipX = b.dir === 1 ? b.x + b.length : b.x - b.length;
        const flashGrad = ctx.createRadialGradient(tipX, b.y, 0, tipX, b.y, 30);
        flashGrad.addColorStop(0, 'rgba(255,255,255,0.8)');
        flashGrad.addColorStop(0.5, 'rgba(100,200,255,0.4)');
        flashGrad.addColorStop(1, 'rgba(0,100,255,0)');
        ctx.fillStyle = flashGrad;
        ctx.beginPath();
        ctx.arc(tipX, b.y, 30, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
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
    ctx.fillText(`PV : ${Math.ceil(player.hp)} / ${player.maxHp}`, bx + 8, by + 16);

    // Level label
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(CANVAS_WIDTH - 140, 18, 120, 28);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Niveau ${currentLevel}`, CANVAS_WIDTH - 30, 38);

    // Sword powers
    ctx.textAlign = 'left';
    ctx.font = 'bold 15px Arial';
    let py = 52;
    if (player.stones.includes(STONE_FIRE)) {
        ctx.fillStyle = 'rgba(255,69,0,0.35)';
        ctx.fillRect(18, py - 2, 95, 20);
        ctx.fillStyle = '#ff6633';
        ctx.fillText('Feu', 28, py + 14);
        py += 24;
    }
    if (player.stones.includes(STONE_WATER)) {
        ctx.fillStyle = 'rgba(0,191,255,0.35)';
        ctx.fillRect(18, py - 2, 95, 20);
        ctx.fillStyle = '#33bbff';
        ctx.fillText('Eau', 28, py + 14);
        py += 24;
    }
    if (player.stones.includes(STONE_LIGHTNING)) {
        ctx.fillStyle = 'rgba(255,215,0,0.35)';
        ctx.fillRect(18, py - 2, 95, 20);
        ctx.fillStyle = '#ffcc00';
        ctx.fillText('Foudre', 28, py + 14);
        py += 24;
    }
    
    // Horns power-up indicator
    if (player.hasHorns) {
        const timeLeft = Math.ceil(player.hornsTimer / 60);
        ctx.fillStyle = 'rgba(255,170,0,0.35)';
        ctx.fillRect(18, py - 2, 95, 20);
        ctx.fillStyle = '#ffaa00';
        ctx.fillText(`Cornes (${timeLeft}s)`, 28, py + 14);
        py += 24;
    }
    
    // Pistol power-up indicator
    if (player.hasPistol) {
        const timeLeft = Math.ceil(player.pistolTimer / 60);
        ctx.fillStyle = 'rgba(68,68,255,0.35)';
        ctx.fillRect(18, py - 2, 95, 20);
        ctx.fillStyle = '#4444ff';
        ctx.fillText(`Pistolet (${timeLeft}s)`, 28, py + 14);
        py += 24;
    }
    
    // Flamethrower indicator
    if (player.hasFlamethrower) {
        const timeLeft = Math.ceil(player.flamethrowerTimer / 60);
        ctx.fillStyle = 'rgba(255,68,0,0.35)';
        ctx.fillRect(18, py - 2, 120, 20);
        ctx.fillStyle = '#ff4400';
        ctx.fillText(`Lance-flammes (${timeLeft}s)`, 28, py + 14);
        py += 24;
    }
    
    // Super Saiyan indicator
    if (player.isSuperSaiyan) {
        ctx.fillStyle = 'rgba(255,215,0,0.35)';
        ctx.fillRect(18, py - 2, 120, 20);
        ctx.fillStyle = '#ffd700';
        ctx.fillText('SUPER SAIYAN', 28, py + 14);
        py += 24;
    }
    
    // Underground indicator
    if (inUnderground) {
        ctx.fillStyle = 'rgba(0,255,136,0.3)';
        ctx.fillRect(CANVAS_WIDTH - 180, 52, 160, 24);
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('SOUTERRAIN', CANVAS_WIDTH - 30, 70);
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
        const bossName = boss.level === 3 ? 'ROI DÉMON' : `BOSS Niv.${boss.level}`;
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
    ctx.fillText('CHEVALIER DES PIERRES DE DRAGON', CANVAS_WIDTH / 2, 160);
    ctx.restore();

    // Subtitle
    ctx.fillStyle = '#bbb';
    ctx.font = '22px Arial';
    ctx.fillText('Vainquez les ennemis, collectez les pierres de dragon, forgez l\'épée ultime !', CANVAS_WIDTH / 2, 210);

    // Controls box
    const boxX = CANVAS_WIDTH / 2 - 220, boxY = 260, boxW = 440, boxH = 180;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 22px Arial';
    ctx.fillText('Contrôles', CANVAS_WIDTH / 2, boxY + 30);
    ctx.fillStyle = '#fff';
    ctx.font = '17px Arial';
    ctx.fillText('Flèches / WASD : Se déplacer + Sauter', CANVAS_WIDTH / 2, boxY + 58);
    ctx.fillText('X / Z / J : Attaquer  |  C / K : Tirer', CANVAS_WIDTH / 2, boxY + 82);
    ctx.fillText('\u2193 sur tuyau vert : Monde souterrain secret !', CANVAS_WIDTH / 2, boxY + 106);
    ctx.fillStyle = '#ffd700';
    ctx.fillText('C \u2192 X \u2192 C (rapide) : KAMEHAMEHA !', CANVAS_WIDTH / 2, boxY + 134);
    ctx.fillStyle = '#fff';
    ctx.fillText('Entrée : Confirmer', CANVAS_WIDTH / 2, boxY + 162);

    // Blinking start prompt
    if (Math.sin(t * 3) > 0) {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffd700';
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 30px Arial';
        ctx.fillText('Appuyez sur ENTRÉE pour commencer', CANVAS_WIDTH / 2, 510);
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
    ctx.fillText('Votre épée devient plus forte...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);

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
    ctx.fillText('PARTIE TERMINÉE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

    ctx.font = '24px Arial';
    ctx.fillStyle = '#ccc';
    ctx.fillText(`Vous avez atteint le niveau ${currentLevel}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    ctx.fillText('Appuyez sur ENTRÉE pour recommencer', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
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
    ctx.fillText('VICTOIRE !', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    ctx.restore();

    ctx.fillStyle = '#fff';
    ctx.font = '26px Arial';
    ctx.fillText('Vous avez vaincu le Roi Démon !', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.fillText('L\'épée ultime du dragon est à vous !', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);

    ctx.font = '22px Arial';
    ctx.fillStyle = '#ccc';
    ctx.fillText('Appuyez sur ENTRÉE pour rejouer', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
}

// ============================================
// SECTION 13: RENDERING - GAME WORLD
// ============================================

function updateCamera() {
    // Camera follows player, keeping them centered horizontally
    const targetX = player.x - CANVAS_WIDTH / 2 + player.width / 2;
    cameraX = targetX;
    
    // Clamp camera to world bounds
    if (cameraX < 0) cameraX = 0;
    if (cameraX + CANVAS_WIDTH > worldWidth) cameraX = worldWidth - CANVAS_WIDTH;
}

function renderGame() {
    ctx.save();

    // Update camera
    updateCamera();

    // Screen shake offset
    let shakeX = 0, shakeY = 0;
    if (screenShake > 0) {
        shakeX = (Math.random() - 0.5) * screenShake * 2;
        shakeY = (Math.random() - 0.5) * screenShake * 2;
        screenShake--;
    }
    ctx.translate(-cameraX + shakeX, shakeY);

    if (inUnderground) {
        renderUndergroundBackground();
    } else {
        // Sky gradient (full world width)
        const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
        skyGrad.addColorStop(0, '#1a1a3e');
        skyGrad.addColorStop(0.6, '#0f1a2e');
        skyGrad.addColorStop(1, '#0a0e27');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, worldWidth, GROUND_Y);

        // Stars
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        for (let i = 0; i < Math.ceil(worldWidth / 20); i++) {
            ctx.fillRect((i * 37 + 5) % worldWidth, (i * 23 + 3) % GROUND_Y, 2, 2);
        }

        // Ground
        const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_HEIGHT);
        groundGrad.addColorStop(0, '#3d6026');
        groundGrad.addColorStop(1, '#1d3006');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, GROUND_Y, worldWidth, CANVAS_HEIGHT - GROUND_Y);

        // Ground line
        ctx.strokeStyle = '#4d7036';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, GROUND_Y);
        ctx.lineTo(worldWidth, GROUND_Y);
        ctx.stroke();

        // Grass tufts
        ctx.fillStyle = '#4d7036';
        for (let i = 0; i < worldWidth; i += 30) {
            ctx.fillRect(i, GROUND_Y - 4, 8, 6);
        }
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

    // Secret wells (only in overworld)
    if (!inUnderground) {
        for (const well of secretWells) {
            renderSecretWell(well);
        }
    }

    // Enemies
    for (const e of enemies) {
        e.render(ctx);
    }

    // Boss
    if (boss && !boss.dead) {
        boss.render(ctx);
    }
    
    // Bonuses
    for (const bonus of bonuses) {
        bonus.render(ctx);
    }
    
    // Player bullets
    for (const bullet of playerBullets) {
        ctx.save();
        ctx.fillStyle = '#ffff00';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ffff00';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        ctx.restore();
    }

    // Flame projectiles
    for (const f of flameProjectiles) {
        ctx.save();
        const alpha = f.life / 40;
        ctx.globalAlpha = Math.min(1, alpha);
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff4400';
        const fGrad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.size);
        fGrad.addColorStop(0, '#ffee44');
        fGrad.addColorStop(0.4, '#ff6600');
        fGrad.addColorStop(1, 'rgba(255,40,0,0)');
        ctx.fillStyle = fGrad;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Player
    player.render(ctx);
    
    // Kamehameha (rendered above player)
    renderKamehameha();

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
        
        // Spawn bonuses periodically
        bonusSpawnTimer++;
        if (bonusSpawnTimer >= 600 && Math.random() < 0.02) { // Spawn chance every ~10 seconds
            const spawnX = player.x + 200 + Math.random() * 400; // Spawn ahead of player
            if (spawnX < worldWidth - 100) {
                const spawnY = 100;
                const bonusType = Math.random() < 0.5 ? BONUS_HORNS : BONUS_PISTOL;
                bonuses.push(new Bonus(spawnX, spawnY, bonusType));
                bonusSpawnTimer = 0;
            }
        }
        
        // Update bonuses
        for (let i = bonuses.length - 1; i >= 0; i--) {
            const bonus = bonuses[i];
            if (bonus.collected) {
                bonuses.splice(i, 1);
                continue;
            }
            bonus.update(platforms);
            
            // Check collision with player
            if (rectsOverlap(bonus, player)) {
                if (bonus.type === BONUS_HORNS) {
                    player.hasHorns = true;
                    player.hornsTimer = 600; // 10 seconds at 60fps
                    spawnParticles(bonus.x + bonus.width / 2, bonus.y + bonus.height / 2, '#ffaa00', 15, 6);
                    if (sounds.bonusPickup) sounds.bonusPickup();
                } else if (bonus.type === BONUS_PISTOL) {
                    player.hasPistol = true;
                    player.pistolTimer = 900;
                    spawnParticles(bonus.x + bonus.width / 2, bonus.y + bonus.height / 2, '#4444ff', 15, 6);
                    if (sounds.bonusPickup) sounds.bonusPickup();
                } else if (bonus.type === BONUS_FLAMETHROWER) {
                    player.hasFlamethrower = true;
                    player.flamethrowerTimer = 1200; // 20 seconds at 60fps
                    spawnParticles(bonus.x + bonus.width / 2, bonus.y + bonus.height / 2, '#ff4400', 20, 8);
                    spawnParticles(bonus.x + bonus.width / 2, bonus.y + bonus.height / 2, '#ffcc00', 15, 6);
                    if (sounds.bonusPickup) sounds.bonusPickup();
                }
                bonus.collected = true;
            }
        }
        
        // Update player bullets
        for (let i = playerBullets.length - 1; i >= 0; i--) {
            const bullet = playerBullets[i];
            bullet.x += bullet.vx;
            
            // Remove if off screen
            if (bullet.x < -50 || bullet.x > worldWidth + 50) {
                playerBullets.splice(i, 1);
                continue;
            }
            
            // Check collision with enemies
            let hit = false;
            for (const e of enemies) {
                if (rectsOverlap(bullet, e)) {
                    e.takeDamage(bullet.damage);
                    spawnParticles(bullet.x, bullet.y, '#ffff00', 4, 3);
                    playerBullets.splice(i, 1);
                    hit = true;
                    break;
                }
            }
            
            if (hit) continue;
            
            // Check collision with boss
            if (boss && !boss.dead && rectsOverlap(bullet, boss)) {
                boss.takeDamage(bullet.damage);
                spawnParticles(bullet.x, bullet.y, '#ffff00', 6, 4);
                playerBullets.splice(i, 1);
            }
        }

        // Player attack vs enemies (sword)
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
        
        // Horns attack (when player has horns power-up) - only when moving forward
        const hornHitbox = player.getHornHitbox();
        if (hornHitbox && Math.abs(player.vx) > 0.5) {
            for (const e of enemies) {
                if (player.hornHitIds.has(e.id)) continue;
                if (rectsOverlap(hornHitbox, e)) {
                    const dmg = 20;
                    e.takeDamage(dmg);
                    player.hornHitIds.add(e.id);
                    player.hornHitCooldowns.set(e.id, 30); // 0.5 second cooldown
                    spawnParticles(e.x + e.width / 2, e.y + e.height / 2, '#ffaa00', 6, 4);
                }
            }
            enemies = enemies.filter(e => !e.dead);
            
            // Horns attack vs boss
            if (boss && !boss.dead && !player.hornHitIds.has(boss.id) && rectsOverlap(hornHitbox, boss)) {
                const dmg = 25;
                boss.takeDamage(dmg);
                player.hornHitIds.add(boss.id);
                player.hornHitCooldowns.set(boss.id, 30);
                spawnParticles(boss.x + boss.width / 2, boss.y + boss.height / 2, '#ffaa00', 8, 5);
            }
        }

        // Boss defeated
        if (boss && boss.dead) {
            if (currentLevel === 1) {
                player.addStone(STONE_FIRE);
                levelTransitionMessage = 'Pierre de dragon acquise : FEU';
                gameState = STATE_LEVEL_TRANSITION;
                levelTransitionTimer = 180;
            } else if (currentLevel === 2) {
                player.addStone(STONE_WATER);
                levelTransitionMessage = 'Pierre de dragon acquise : EAU';
                gameState = STATE_LEVEL_TRANSITION;
                levelTransitionTimer = 180;
            } else if (currentLevel === 3) {
                player.addStone(STONE_LIGHTNING);
                gameState = STATE_VICTORY;
            }
        }

        // Secret well interaction: stand on well + press Down
        if (!inUnderground) {
            for (const well of secretWells) {
                const playerCX = player.x + player.width / 2;
                const wellCX = well.x + well.width / 2;
                if (Math.abs(playerCX - wellCX) < 30 &&
                    player.onGround &&
                    Math.abs(player.y + player.height - (well.y + well.height)) < 12 &&
                    isDown()) {
                    enterUnderground(well.x);
                    break;
                }
            }
        }
        
        // Underground exit check
        if (inUnderground) {
            undergroundTimer++;
            const playerCX = player.x + player.width / 2;
            if (Math.abs(playerCX - (undergroundExitX + 25)) < 35 &&
                player.y + player.height > GROUND_Y - 80) {
                exitUnderground();
            }
        }
        
        // Flame projectiles update
        for (let i = flameProjectiles.length - 1; i >= 0; i--) {
            const f = flameProjectiles[i];
            f.x += f.vx;
            f.y += f.vy;
            f.life--;
            f.size *= 0.97;
            
            if (f.life <= 0 || f.x < -50 || f.x > worldWidth + 50) {
                flameProjectiles.splice(i, 1);
                continue;
            }
            
            // Spawn fire particles
            if (Math.random() < 0.4) {
                spawnParticles(f.x, f.y, Math.random() < 0.5 ? '#ff6600' : '#ffcc00', 1, 2);
            }
            
            // Hit enemies
            let hit = false;
            for (const e of enemies) {
                if (rectsOverlap({ x: f.x - f.size / 2, y: f.y - f.size / 2, width: f.size, height: f.size }, e)) {
                    e.takeDamage(f.damage);
                    spawnParticles(f.x, f.y, '#ff4400', 3, 3);
                    flameProjectiles.splice(i, 1);
                    hit = true;
                    break;
                }
            }
            if (hit) continue;
            
            // Hit boss
            if (boss && !boss.dead) {
                if (rectsOverlap({ x: f.x - f.size / 2, y: f.y - f.size / 2, width: f.size, height: f.size }, boss)) {
                    boss.takeDamage(f.damage);
                    spawnParticles(f.x, f.y, '#ff4400', 4, 4);
                    flameProjectiles.splice(i, 1);
                }
            }
        }
        
        // Kamehameha charge and beam
        if (kamehamehaChargeTimer > 0) {
            kamehamehaChargeTimer--;
            if (kamehamehaChargeTimer <= 0) {
                kamehamehaBeam = {
                    x: player.x + (player.facing === 1 ? player.width : 0),
                    y: player.y + player.height / 2,
                    dir: player.facing,
                    length: 0,
                    maxLength: 600,
                    life: 50,
                    damage: 60
                };
                screenShake = 15;
                spawnParticles(player.x + player.width / 2, player.y + player.height / 2, '#00bbff', 20, 8);
            }
        }
        
        if (kamehamehaBeam) {
            kamehamehaBeam.life--;
            if (kamehamehaBeam.length < kamehamehaBeam.maxLength) {
                kamehamehaBeam.length += 40;
            }
            kamehamehaBeam.x = player.x + (player.facing === 1 ? player.width : 0);
            kamehamehaBeam.y = player.y + player.height / 2;
            kamehamehaBeam.dir = player.facing;
            
            // Beam hitbox
            const beamRect = {
                x: kamehamehaBeam.dir === 1 ? kamehamehaBeam.x : kamehamehaBeam.x - kamehamehaBeam.length,
                y: kamehamehaBeam.y - 18,
                width: kamehamehaBeam.length,
                height: 36
            };
            
            // Hit all enemies in path
            for (const e of enemies) {
                if (rectsOverlap(beamRect, e)) {
                    e.takeDamage(3);
                    if (Math.random() < 0.3) {
                        spawnParticles(e.x + e.width / 2, e.y + e.height / 2, '#00bbff', 2, 4);
                    }
                }
            }
            enemies = enemies.filter(e => !e.dead);
            
            // Hit boss
            if (boss && !boss.dead && rectsOverlap(beamRect, boss)) {
                boss.takeDamage(2);
                if (Math.random() < 0.2) {
                    spawnParticles(boss.x + boss.width / 2, boss.y + boss.height / 2, '#00bbff', 3, 5);
                }
            }
            
            if (kamehamehaBeam.life <= 0) {
                kamehamehaBeam = null;
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
    bonuses = [];
    bonusSpawnTimer = 0;
    screenShake = 0;
    jumpPressed = false;
    attackPressed = false;
    kamehamehaBeam = null;
    kamehamehaChargeTimer = 0;
    keySequence = [];
    flameProjectiles = [];
    inUnderground = false;
    savedOverworldState = null;
    loadLevel(1);
    gameState = STATE_PLAYING;
}

gameLoop();
