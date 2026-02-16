// ============================================
// DRAGON STONES KNIGHT - Main Game File
// ============================================

// ============================================
// CONSTANTS AND CONFIGURATION
// ============================================

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 600;
const GRAVITY = 0.5;
const PLAYER_SPEED = 4;
const JUMP_STRENGTH = -12;
const GROUND_Y = CANVAS_HEIGHT - 50;

// Game States
const STATE_TITLE = 'TITLE';
const STATE_PLAYING = 'PLAYING';
const STATE_LEVEL_TRANSITION = 'LEVEL_TRANSITION';
const STATE_GAME_OVER = 'GAME_OVER';
const STATE_VICTORY = 'VICTORY';

// Dragon Stone Types
const STONE_FIRE = 'FIRE';
const STONE_WATER = 'WATER';
const STONE_LIGHTNING = 'LIGHTNING';

// ============================================
// GAME STATE MANAGEMENT
// ============================================

let gameState = STATE_TITLE;
let currentLevel = 1;
let dragonStones = [];
let levelTransitionTimer = 0;
let levelTransitionMessage = '';

// ============================================
// CANVAS SETUP
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
canvas.focus();

// ============================================
// INPUT HANDLING
// ============================================

const keys = {
    left: false,
    right: false,
    jump: false,
    attack: false
};

function handleKeyDown(e) {
    const key = e.key.toLowerCase();
    const code = e.code;
    
    if (code === 'ArrowLeft' || key === 'a') {
        keys.left = true;
        e.preventDefault();
    } else if (code === 'ArrowRight' || key === 'd') {
        keys.right = true;
        e.preventDefault();
    } else if (code === 'Space' || key === ' ') {
        keys.jump = true;
        e.preventDefault();
    } else if (key === 'x') {
        keys.attack = true;
        e.preventDefault();
    } else if (code === 'Enter') {
        if (gameState === STATE_TITLE || gameState === STATE_GAME_OVER || gameState === STATE_VICTORY) {
            startGame();
        }
        e.preventDefault();
    }
}

function handleKeyUp(e) {
    const key = e.key.toLowerCase();
    const code = e.code;
    
    if (code === 'ArrowLeft' || key === 'a') {
        keys.left = false;
    } else if (code === 'ArrowRight' || key === 'd') {
        keys.right = false;
    } else if (code === 'Space' || key === ' ') {
        keys.jump = false;
    } else if (key === 'x') {
        keys.attack = false;
    }
}

// Add event listeners to both window and canvas
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);
canvas.addEventListener('keydown', handleKeyDown);
canvas.addEventListener('keyup', handleKeyUp);
canvas.addEventListener('click', () => canvas.focus());

// ============================================
// ENTITY CLASSES
// ============================================

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 50;
        this.vx = 0;
        this.vy = 0;
        this.maxHp = 100;
        this.hp = this.maxHp;
        this.onGround = false;
        this.facing = 1; // 1 = right, -1 = left
        this.attackCooldown = 0;
        this.attackDuration = 0;
        this.stones = []; // Dragon stones collected
        this.damageMultiplier = 1;
    }

    update(platforms) {
        // Horizontal movement
        if (keys.left) {
            this.vx = -PLAYER_SPEED;
            this.facing = -1;
        } else if (keys.right) {
            this.vx = PLAYER_SPEED;
            this.facing = 1;
        } else {
            this.vx *= 0.8; // Friction
        }

        // Jump
        if (keys.jump && this.onGround) {
            this.vy = JUMP_STRENGTH;
            this.onGround = false;
        }

        // Gravity
        this.vy += GRAVITY;

        // Update position
        this.x += this.vx;
        this.y += this.vy;

        // Ground collision
        if (this.y + this.height >= GROUND_Y) {
            this.y = GROUND_Y - this.height;
            this.vy = 0;
            this.onGround = true;
        }

        // Platform collision
        this.onGround = false;
        for (let platform of platforms) {
            if (this.checkPlatformCollision(platform)) {
                if (this.vy > 0 && this.y < platform.y) {
                    this.y = platform.y - this.height;
                    this.vy = 0;
                    this.onGround = true;
                }
            }
        }

        // Boundary checks
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > CANVAS_WIDTH) this.x = CANVAS_WIDTH - this.width;

        // Attack handling
        if (keys.attack && this.attackCooldown <= 0) {
            this.attackDuration = 15;
            this.attackCooldown = 30;
        }

        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.attackDuration > 0) this.attackDuration--;

        // Update damage multiplier based on stones
        this.updateDamageMultiplier();
    }

    checkPlatformCollision(platform) {
        return this.x < platform.x + platform.width &&
               this.x + this.width > platform.x &&
               this.y < platform.y + platform.height &&
               this.y + this.height > platform.y;
    }

    getAttackHitbox() {
        if (this.attackDuration <= 0) return null;
        
        const hitboxWidth = 60;
        const hitboxHeight = 40;
        let hitboxX = this.x;
        
        if (this.facing === 1) {
            hitboxX = this.x + this.width;
        } else {
            hitboxX = this.x - hitboxWidth;
        }
        
        return {
            x: hitboxX,
            y: this.y + 10,
            width: hitboxWidth,
            height: hitboxHeight
        };
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
    }

    addStone(stoneType) {
        if (!this.stones.includes(stoneType)) {
            this.stones.push(stoneType);
        }
    }

    updateDamageMultiplier() {
        let multiplier = 1;
        if (this.stones.includes(STONE_FIRE)) multiplier = 1.5;
        if (this.stones.includes(STONE_WATER)) multiplier = 2.0;
        if (this.stones.includes(STONE_LIGHTNING)) multiplier = 2.5;
        this.damageMultiplier = multiplier;
    }

    hasAllStones() {
        return this.stones.includes(STONE_FIRE) &&
               this.stones.includes(STONE_WATER) &&
               this.stones.includes(STONE_LIGHTNING);
    }

    render(ctx) {
        ctx.save();
        
        // Draw shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x + 5, this.y + this.height + 2, this.width - 10, 8);
        
        // Draw player body with gradient
        const bodyGradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        bodyGradient.addColorStop(0, '#5a9fe2');
        bodyGradient.addColorStop(0.5, '#4a90e2');
        bodyGradient.addColorStop(1, '#3a80d2');
        ctx.fillStyle = bodyGradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw armor/outline
        ctx.strokeStyle = '#2a5a92';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);
        
        // Draw helmet
        ctx.fillStyle = '#3a70b2';
        ctx.fillRect(this.x + 8, this.y + 5, this.width - 16, 12);
        ctx.fillStyle = '#2a5a92';
        ctx.fillRect(this.x + 10, this.y + 7, this.width - 20, 8);
        
        // Draw sword
        const swordLength = 35;
        const swordX = this.facing === 1 ? this.x + this.width : this.x - swordLength;
        const swordY = this.y + 18;
        
        // Sword blade gradient
        const swordGradient = ctx.createLinearGradient(swordX, swordY, swordX + (this.facing === 1 ? swordLength : -swordLength), swordY);
        swordGradient.addColorStop(0, '#e0e0e0');
        swordGradient.addColorStop(0.5, '#ffffff');
        swordGradient.addColorStop(1, '#c0c0c0');
        ctx.fillStyle = swordGradient;
        ctx.fillRect(swordX, swordY, swordLength, 6);
        
        // Sword handle
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(swordX + (this.facing === 1 ? swordLength - 8 : 0), swordY - 2, 8, 10);
        
        // Draw sword glow effects based on stones
        if (this.stones.length > 0) {
            ctx.save();
            ctx.shadowBlur = 25;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            if (this.hasAllStones()) {
                // Ultimate sword - cycling colors
                const time = Date.now() * 0.005;
                const r = Math.sin(time) * 0.5 + 0.5;
                const g = Math.sin(time + 2) * 0.5 + 0.5;
                const b = Math.sin(time + 4) * 0.5 + 0.5;
                ctx.shadowColor = `rgb(${r * 255}, ${g * 255}, ${b * 255})`;
                ctx.fillStyle = `rgba(${r * 255}, ${g * 255}, ${b * 255}, 0.8)`;
            } else {
                // Individual stone glows
                if (this.stones.includes(STONE_FIRE)) {
                    ctx.shadowColor = '#ff4500';
                    ctx.fillStyle = 'rgba(255, 69, 0, 0.7)';
                }
                if (this.stones.includes(STONE_WATER)) {
                    ctx.shadowColor = '#00bfff';
                    ctx.fillStyle = 'rgba(0, 191, 255, 0.7)';
                }
                if (this.stones.includes(STONE_LIGHTNING)) {
                    ctx.shadowColor = '#ffd700';
                    ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
                }
            }
            
            ctx.fillRect(swordX, swordY, swordLength, 6);
            ctx.restore();
        }
        
        // Attack slash effect
        if (this.attackDuration > 0) {
            ctx.save();
            ctx.globalAlpha = 0.6;
            const slashX = this.facing === 1 ? this.x + this.width : this.x - 40;
            const slashY = this.y + 10;
            
            if (this.hasAllStones()) {
                const time = Date.now() * 0.01;
                ctx.fillStyle = `rgba(${Math.sin(time) * 127 + 127}, ${Math.sin(time + 2) * 127 + 127}, ${Math.sin(time + 4) * 127 + 127}, 0.5)`;
            } else if (this.stones.includes(STONE_FIRE)) {
                ctx.fillStyle = 'rgba(255, 100, 0, 0.5)';
            } else if (this.stones.includes(STONE_WATER)) {
                ctx.fillStyle = 'rgba(0, 150, 255, 0.5)';
            } else if (this.stones.includes(STONE_LIGHTNING)) {
                ctx.fillStyle = 'rgba(255, 220, 0, 0.5)';
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            }
            
            ctx.fillRect(slashX, slashY, 40, 30);
            ctx.restore();
        }
        
        ctx.restore();
    }
}

class Enemy {
    constructor(x, y, type = 'basic') {
        this.x = x;
        this.y = y;
        this.width = 35;
        this.height = 40;
        this.vx = 0;
        this.vy = 0;
        this.hp = type === 'basic' ? 20 : type === 'medium' ? 35 : 50;
        this.maxHp = this.hp;
        this.speed = type === 'basic' ? 1.5 : type === 'medium' ? 2 : 2.5;
        this.attackCooldown = 0;
        this.type = type;
        this.onGround = false;
    }

    update(player, platforms) {
        // AI: Move toward player
        if (player.x < this.x) {
            this.vx = -this.speed;
        } else if (player.x > this.x) {
            this.vx = this.speed;
        }

        // Gravity
        this.vy += GRAVITY;
        this.x += this.vx;
        this.y += this.vy;

        // Ground collision
        if (this.y + this.height >= GROUND_Y) {
            this.y = GROUND_Y - this.height;
            this.vy = 0;
            this.onGround = true;
        }

        // Platform collision
        this.onGround = false;
        for (let platform of platforms) {
            if (this.checkPlatformCollision(platform)) {
                if (this.vy > 0 && this.y < platform.y) {
                    this.y = platform.y - this.height;
                    this.vy = 0;
                    this.onGround = true;
                }
            }
        }

        // Attack player if close
        const dist = Math.abs(this.x - player.x);
        if (dist < 50 && this.attackCooldown <= 0) {
            player.takeDamage(10);
            this.attackCooldown = 60;
        }

        if (this.attackCooldown > 0) this.attackCooldown--;
    }

    checkPlatformCollision(platform) {
        return this.x < platform.x + platform.width &&
               this.x + this.width > platform.x &&
               this.y < platform.y + platform.height &&
               this.y + this.height > platform.y;
    }

    takeDamage(amount) {
        this.hp -= amount;
        return this.hp <= 0;
    }

    render(ctx) {
        ctx.save();
        
        // Draw shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x + 3, this.y + this.height + 2, this.width - 6, 6);
        
        // Draw enemy body with gradient
        const enemyGradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        if (this.type === 'basic') {
            enemyGradient.addColorStop(0, '#ff6b6b');
            enemyGradient.addColorStop(1, '#e74c3c');
        } else if (this.type === 'medium') {
            enemyGradient.addColorStop(0, '#e74c3c');
            enemyGradient.addColorStop(1, '#c0392b');
        } else {
            enemyGradient.addColorStop(0, '#c0392b');
            enemyGradient.addColorStop(1, '#8b0000');
        }
        ctx.fillStyle = enemyGradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw outline
        ctx.strokeStyle = '#8b0000';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x + 1, this.y + 1, this.width - 2, this.height - 2);
        
        // Draw eyes
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x + 8, this.y + 10, 6, 6);
        ctx.fillRect(this.x + this.width - 14, this.y + 10, 6, 6);
        
        // Draw mouth
        ctx.strokeStyle = '#8b0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + 25, 8, 0, Math.PI);
        ctx.stroke();
        
        ctx.restore();
    }
}

class Boss extends Enemy {
    constructor(x, y, level) {
        super(x, y, 'boss');
        this.level = level;
        this.hp = level === 1 ? 50 : level === 2 ? 100 : 200;
        this.maxHp = this.hp;
        this.width = level === 3 ? 80 : 60;
        this.height = level === 3 ? 90 : 70;
        this.attackPattern = 0;
        this.attackTimer = 0;
        this.projectiles = [];
        this.speed = 1;
    }

    update(player, platforms) {
        // Boss AI
        const dist = Math.abs(this.x - player.x);
        
        // Move toward player but slower
        if (player.x < this.x - 50) {
            this.vx = -this.speed;
        } else if (player.x > this.x + 50) {
            this.vx = this.speed;
        } else {
            this.vx = 0;
        }

        // Gravity
        this.vy += GRAVITY;
        this.x += this.vx;
        this.y += this.vy;

        // Ground collision
        if (this.y + this.height >= GROUND_Y) {
            this.y = GROUND_Y - this.height;
            this.vy = 0;
            this.onGround = true;
        }

        // Platform collision
        this.onGround = false;
        for (let platform of platforms) {
            if (this.checkPlatformCollision(platform)) {
                if (this.vy > 0 && this.y < platform.y) {
                    this.y = platform.y - this.height;
                    this.vy = 0;
                    this.onGround = true;
                }
            }
        }

        // Attack patterns
        this.attackTimer++;
        
        if (this.level === 3) {
            // Demon King attack patterns
            if (dist < 80 && this.attackTimer > 60) {
                // Melee attack
                player.takeDamage(15);
                this.attackTimer = 0;
            } else if (this.attackTimer > 120) {
                // Ranged projectile
                this.projectiles.push({
                    x: this.x + this.width / 2,
                    y: this.y + this.height / 2,
                    vx: player.x > this.x ? 5 : -5,
                    vy: 0,
                    width: 20,
                    height: 20
                });
                this.attackTimer = 0;
            }
        } else if (this.level === 2) {
            // Level 2 boss
            if (dist < 70 && this.attackTimer > 50) {
                player.takeDamage(12);
                this.attackTimer = 0;
            } else if (this.attackTimer > 100) {
                this.projectiles.push({
                    x: this.x + this.width / 2,
                    y: this.y + this.height / 2,
                    vx: player.x > this.x ? 4 : -4,
                    vy: 0,
                    width: 15,
                    height: 15
                });
                this.attackTimer = 0;
            }
        } else {
            // Level 1 boss
            if (dist < 60 && this.attackTimer > 80) {
                player.takeDamage(10);
                this.attackTimer = 0;
            } else if (this.attackTimer > 150) {
                this.projectiles.push({
                    x: this.x + this.width / 2,
                    y: this.y + this.height / 2,
                    vx: player.x > this.x ? 3 : -3,
                    vy: 0,
                    width: 15,
                    height: 15
                });
                this.attackTimer = 0;
            }
        }

        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.x += proj.vx;
            
            // Check collision with player
            if (proj.x < player.x + player.width &&
                proj.x + proj.width > player.x &&
                proj.y < player.y + player.height &&
                proj.y + proj.height > player.y) {
                player.takeDamage(this.level === 3 ? 12 : 8);
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Remove if off screen
            if (proj.x < 0 || proj.x > CANVAS_WIDTH) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    render(ctx) {
        ctx.save();
        
        // Draw shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(this.x + 8, this.y + this.height + 3, this.width - 16, 12);
        
        if (this.level === 3) {
            // Demon King - dark purple/black with glow
            const demonGradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
            demonGradient.addColorStop(0, '#4b0082');
            demonGradient.addColorStop(0.5, '#2d1b4e');
            demonGradient.addColorStop(1, '#1a0d2e');
            ctx.fillStyle = demonGradient;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Inner glow
            ctx.fillStyle = '#6a1b9a';
            ctx.fillRect(this.x + 5, this.y + 5, this.width - 10, this.height - 10);
            
            // Eyes glow
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff0000';
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(this.x + 15, this.y + 20, 12, 12);
            ctx.fillRect(this.x + this.width - 27, this.y + 20, 12, 12);
            
            // Crown/horns
            ctx.fillStyle = '#1a0d2e';
            ctx.fillRect(this.x + this.width / 2 - 15, this.y - 10, 30, 15);
            ctx.fillRect(this.x + this.width / 2 - 20, this.y - 5, 10, 10);
            ctx.fillRect(this.x + this.width / 2 + 10, this.y - 5, 10, 10);
        } else {
            // Regular boss
            const bossGradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
            bossGradient.addColorStop(0, '#a00000');
            bossGradient.addColorStop(1, '#8b0000');
            ctx.fillStyle = bossGradient;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Armor plates
            ctx.fillStyle = '#6b0000';
            ctx.fillRect(this.x + 8, this.y + 8, this.width - 16, 12);
            ctx.fillRect(this.x + 8, this.y + this.height - 20, this.width - 16, 12);
            
            // Eyes
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(this.x + 12, this.y + 15, 10, 10);
            ctx.fillRect(this.x + this.width - 22, this.y + 15, 10, 10);
        }
        
        // Outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        ctx.restore();
        
        // Draw projectiles with glow
        for (let proj of this.projectiles) {
            ctx.save();
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ff6347';
            ctx.fillStyle = '#ff6347';
            ctx.beginPath();
            ctx.arc(proj.x + proj.width / 2, proj.y + proj.height / 2, proj.width / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
}

// ============================================
// COLLISION DETECTION
// ============================================

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// ============================================
// LEVEL DATA AND MANAGEMENT
// ============================================

const levels = [
    {
        platforms: [
            { x: 200, y: 400, width: 150, height: 20 },
            { x: 500, y: 350, width: 150, height: 20 },
            { x: 800, y: 300, width: 150, height: 20 },
            { x: 1000, y: 400, width: 150, height: 20 }
        ],
        enemies: [
            { x: 300, y: GROUND_Y - 40, type: 'basic' },
            { x: 600, y: GROUND_Y - 40, type: 'basic' }
        ],
        bossX: 1100
    },
    {
        platforms: [
            { x: 150, y: 450, width: 120, height: 20 },
            { x: 350, y: 380, width: 120, height: 20 },
            { x: 550, y: 320, width: 120, height: 20 },
            { x: 750, y: 380, width: 120, height: 20 },
            { x: 950, y: 450, width: 120, height: 20 },
            { x: 1050, y: 300, width: 120, height: 20 }
        ],
        enemies: [
            { x: 250, y: GROUND_Y - 40, type: 'basic' },
            { x: 450, y: GROUND_Y - 40, type: 'medium' },
            { x: 650, y: GROUND_Y - 40, type: 'basic' },
            { x: 850, y: GROUND_Y - 40, type: 'medium' }
        ],
        bossX: 1100
    },
    {
        platforms: [
            { x: 100, y: 450, width: 100, height: 20 },
            { x: 250, y: 400, width: 100, height: 20 },
            { x: 400, y: 350, width: 100, height: 20 },
            { x: 550, y: 400, width: 100, height: 20 },
            { x: 700, y: 450, width: 100, height: 20 },
            { x: 850, y: 350, width: 100, height: 20 },
            { x: 1000, y: 400, width: 100, height: 20 },
            { x: 1100, y: 300, width: 100, height: 20 }
        ],
        enemies: [
            { x: 200, y: GROUND_Y - 40, type: 'basic' },
            { x: 350, y: GROUND_Y - 40, type: 'medium' },
            { x: 500, y: GROUND_Y - 40, type: 'hard' },
            { x: 650, y: GROUND_Y - 40, type: 'basic' },
            { x: 800, y: GROUND_Y - 40, type: 'medium' },
            { x: 950, y: GROUND_Y - 40, type: 'hard' }
        ],
        bossX: 1100
    }
];

let player = null;
let enemies = [];
let boss = null;
let platforms = [];

function loadLevel(levelNum) {
    const level = levels[levelNum - 1];
    
    // Reset player position, keep HP and stones
    const playerHp = player ? player.hp : 100;
    const playerStones = player ? player.stones : [];
    player = new Player(50, GROUND_Y - 50);
    player.hp = Math.min(playerHp, player.maxHp);
    player.stones = [...playerStones];
    player.updateDamageMultiplier();
    
    // Restore some HP between levels
    if (levelNum > 1) {
        player.hp = Math.min(player.hp + 30, player.maxHp);
    }
    
    platforms = level.platforms.map(p => ({ ...p }));
    enemies = level.enemies.map(e => new Enemy(e.x, e.y, e.type));
    boss = new Boss(level.bossX, GROUND_Y - (levelNum === 3 ? 90 : 70), levelNum);
}

// ============================================
// RENDERING FUNCTIONS
// ============================================

function renderUI() {
    ctx.save();
    
    // Player health bar background
    const barWidth = 220;
    const barHeight = 24;
    const barX = 20;
    const barY = 20;
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX + 2, barY + 2, barWidth, barHeight);
    
    // Background
    ctx.fillStyle = '#222';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    const hpPercent = player.hp / player.maxHp;
    
    // Health bar gradient
    const hpGradient = ctx.createLinearGradient(barX, barY, barX + barWidth * hpPercent, barY);
    if (hpPercent > 0.5) {
        hpGradient.addColorStop(0, '#2ecc71');
        hpGradient.addColorStop(1, '#27ae60');
    } else if (hpPercent > 0.25) {
        hpGradient.addColorStop(0, '#f39c12');
        hpGradient.addColorStop(1, '#e67e22');
    } else {
        hpGradient.addColorStop(0, '#e74c3c');
        hpGradient.addColorStop(1, '#c0392b');
    }
    ctx.fillStyle = hpGradient;
    ctx.fillRect(barX + 2, barY + 2, (barWidth - 4) * hpPercent, barHeight - 4);
    
    // Border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // Text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`HP: ${Math.ceil(player.hp)}/${player.maxHp}`, barX + 8, barY + 17);
    
    // Level indicator with background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(CANVAS_WIDTH / 2 - 60, 20, 120, 30);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Level ${currentLevel}`, CANVAS_WIDTH / 2, 42);
    
    // Sword powers display with backgrounds
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    let powersY = 60;
    if (player.stones.includes(STONE_FIRE)) {
        ctx.fillStyle = 'rgba(255, 69, 0, 0.3)';
        ctx.fillRect(18, powersY - 16, 100, 20);
        ctx.fillStyle = '#ff4500';
        ctx.fillText('🔥 Fire', 22, powersY);
        powersY += 24;
    }
    if (player.stones.includes(STONE_WATER)) {
        ctx.fillStyle = 'rgba(0, 191, 255, 0.3)';
        ctx.fillRect(18, powersY - 16, 100, 20);
        ctx.fillStyle = '#00bfff';
        ctx.fillText('💧 Water', 22, powersY);
        powersY += 24;
    }
    if (player.stones.includes(STONE_LIGHTNING)) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.fillRect(18, powersY - 16, 120, 20);
        ctx.fillStyle = '#ffd700';
        ctx.fillText('⚡ Lightning', 22, powersY);
        powersY += 24;
    }
    
    // Boss health bar
    if (boss && boss.hp > 0) {
        const bossBarWidth = 450;
        const bossBarHeight = 30;
        const bossBarX = (CANVAS_WIDTH - bossBarWidth) / 2;
        const bossBarY = 20;
        
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(bossBarX + 3, bossBarY + 3, bossBarWidth, bossBarHeight);
        
        // Background
        ctx.fillStyle = '#222';
        ctx.fillRect(bossBarX, bossBarY, bossBarWidth, bossBarHeight);
        
        const bossHpPercent = boss.hp / boss.maxHp;
        
        // Boss HP gradient
        const bossGradient = ctx.createLinearGradient(bossBarX, bossBarY, bossBarX + bossBarWidth * bossHpPercent, bossBarY);
        bossGradient.addColorStop(0, '#8b0000');
        bossGradient.addColorStop(1, '#660000');
        ctx.fillStyle = bossGradient;
        ctx.fillRect(bossBarX + 3, bossBarY + 3, (bossBarWidth - 6) * bossHpPercent, bossBarHeight - 6);
        
        // Border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.strokeRect(bossBarX, bossBarY, bossBarWidth, bossBarHeight);
        
        // Text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        const bossName = currentLevel === 3 ? 'Demon King' : `Boss Level ${currentLevel}`;
        ctx.fillText(bossName, bossBarX + 12, bossBarY + 21);
        ctx.textAlign = 'right';
        ctx.fillText(`${Math.ceil(boss.hp)}/${boss.maxHp}`, bossBarX + bossBarWidth - 12, bossBarY + 21);
    }
    
    ctx.restore();
}

function renderTitleScreen() {
    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bgGradient.addColorStop(0, '#1a1a3e');
    bgGradient.addColorStop(0.5, '#0f1a2e');
    bgGradient.addColorStop(1, '#0a0e27');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Animated stars
    const time = Date.now() * 0.001;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (let i = 0; i < 100; i++) {
        const x = (i * 37) % CANVAS_WIDTH;
        const y = (i * 23 + time * 20) % CANVAS_HEIGHT;
        const size = Math.sin(time + i) * 0.5 + 1.5;
        ctx.fillRect(x, y, size, size);
    }
    
    // Title with shadow
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ffd700';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 56px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DRAGON STONES KNIGHT', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 120);
    ctx.shadowBlur = 0;
    
    // Subtitle
    ctx.font = '26px Arial';
    ctx.fillText('Defeat enemies, collect dragon stones,', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
    ctx.fillText('and forge the ultimate sword!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
    
    // Controls box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(CANVAS_WIDTH / 2 - 200, CANVAS_HEIGHT / 2 + 50, 400, 150);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.strokeRect(CANVAS_WIDTH / 2 - 200, CANVAS_HEIGHT / 2 + 50, 400, 150);
    
    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('Controls:', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 85);
    ctx.font = '20px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText('Arrow Keys / A/D: Move', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 115);
    ctx.fillText('Space: Jump', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 140);
    ctx.fillText('X: Attack', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 165);
    
    // Start prompt with animation
    const blink = Math.sin(time * 3) > 0;
    if (blink) {
        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = '#ffd700';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffd700';
        ctx.fillText('Press ENTER to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 250);
        ctx.shadowBlur = 0;
    }
}

function renderLevelTransition() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(levelTransitionMessage, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    ctx.font = '20px Arial';
    ctx.fillText('Preparing next level...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

function renderGameOver() {
    ctx.fillStyle = 'rgba(139, 0, 0, 0.9)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    ctx.font = '24px Arial';
    ctx.fillText('Press ENTER to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}

function renderVictory() {
    ctx.fillStyle = 'rgba(0, 100, 0, 0.9)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
    
    ctx.font = '24px Arial';
    ctx.fillText('You have defeated the Demon King!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    ctx.fillText('The Ultimate Dragon Sword is yours!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    
    ctx.font = '20px Arial';
    ctx.fillText('Press ENTER to Play Again', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 120);
}

function renderGame() {
    // Clear canvas with gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bgGradient.addColorStop(0, '#1a1a3e');
    bgGradient.addColorStop(0.5, '#0f1a2e');
    bgGradient.addColorStop(1, '#0a0e27');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw stars/background decoration
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 50; i++) {
        const x = (i * 37) % CANVAS_WIDTH;
        const y = (i * 23) % GROUND_Y;
        ctx.fillRect(x, y, 2, 2);
    }
    
    // Draw ground with gradient
    const groundGradient = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_HEIGHT);
    groundGradient.addColorStop(0, '#3d6026');
    groundGradient.addColorStop(0.5, '#2d5016');
    groundGradient.addColorStop(1, '#1d3006');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
    
    // Ground texture
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    for (let i = 0; i < CANVAS_WIDTH; i += 40) {
        ctx.fillRect(i, GROUND_Y, 1, CANVAS_HEIGHT - GROUND_Y);
    }
    
    // Draw platforms with better visuals
    for (let platform of platforms) {
        // Platform shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(platform.x + 3, platform.y + platform.height + 2, platform.width, 8);
        
        // Platform gradient
        const platformGradient = ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.height);
        platformGradient.addColorStop(0, '#9b8365');
        platformGradient.addColorStop(0.5, '#8b7355');
        platformGradient.addColorStop(1, '#6b5335');
        ctx.fillStyle = platformGradient;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // Platform top highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(platform.x, platform.y, platform.width, 3);
        
        // Platform outline
        ctx.strokeStyle = '#5b4335';
        ctx.lineWidth = 2;
        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
    }
    
    // Draw enemies
    for (let enemy of enemies) {
        enemy.render(ctx);
    }
    
    // Draw boss
    if (boss) {
        boss.render(ctx);
    }
    
    // Draw player
    player.render(ctx);
    
    // Draw UI
    renderUI();
}

// ============================================
// GAME LOOP
// ============================================

function update() {
    if (gameState === STATE_PLAYING) {
        // Update player
        player.update(platforms);
        
        // Update enemies
        for (let enemy of enemies) {
            enemy.update(player, platforms);
        }
        
        // Update boss
        if (boss) {
            boss.update(player, platforms);
        }
        
        // Check player attack vs enemies
        const attackHitbox = player.getAttackHitbox();
        if (attackHitbox) {
            for (let i = enemies.length - 1; i >= 0; i--) {
                const enemy = enemies[i];
                if (checkCollision(attackHitbox, {
                    x: enemy.x,
                    y: enemy.y,
                    width: enemy.width,
                    height: enemy.height
                })) {
                    const damage = 25 * player.damageMultiplier;
                    const killed = enemy.takeDamage(damage);
                    
                    // Water stone knockback
                    if (player.stones.includes(STONE_WATER)) {
                        enemy.x += player.facing * 30;
                    }
                    
                    // Lightning stone chain damage
                    if (player.stones.includes(STONE_LIGHTNING) && Math.random() < 0.3) {
                        for (let j = 0; j < enemies.length; j++) {
                            if (j !== i && enemies[j]) {
                                const dist = Math.abs(enemies[j].x - enemy.x);
                                if (dist < 100) {
                                    enemies[j].takeDamage(damage * 0.5);
                                }
                            }
                        }
                    }
                    
                    if (killed) {
                        enemies.splice(i, 1);
                    }
                }
            }
        }
        
        // Check player attack vs boss
        if (boss && boss.hp > 0) {
            const attackHitbox = player.getAttackHitbox();
            if (attackHitbox) {
                if (checkCollision(attackHitbox, {
                    x: boss.x,
                    y: boss.y,
                    width: boss.width,
                    height: boss.height
                })) {
                    const damage = 30 * player.damageMultiplier;
                    boss.takeDamage(damage);
                }
            }
        }
        
        // Check if boss is defeated
        if (boss && boss.hp <= 0) {
            // Award dragon stone
            if (currentLevel === 1 && !player.stones.includes(STONE_FIRE)) {
                player.addStone(STONE_FIRE);
                levelTransitionMessage = 'Dragon Stone Acquired: 🔥 FIRE';
                gameState = STATE_LEVEL_TRANSITION;
                levelTransitionTimer = 180;
            } else if (currentLevel === 2 && !player.stones.includes(STONE_WATER)) {
                player.addStone(STONE_WATER);
                levelTransitionMessage = 'Dragon Stone Acquired: 💧 WATER';
                gameState = STATE_LEVEL_TRANSITION;
                levelTransitionTimer = 180;
            } else if (currentLevel === 3 && !player.stones.includes(STONE_LIGHTNING)) {
                player.addStone(STONE_LIGHTNING);
                gameState = STATE_VICTORY;
            }
        }
        
        // Check if player is dead
        if (player.hp <= 0) {
            gameState = STATE_GAME_OVER;
        }
        
        // Check if all enemies defeated (optional - can remove if not needed)
        // For now, boss is the main objective
    } else if (gameState === STATE_LEVEL_TRANSITION) {
        levelTransitionTimer--;
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

function gameLoop() {
    update();
    
    // Render based on state
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
// INITIALIZATION
// ============================================

function startGame() {
    currentLevel = 1;
    dragonStones = [];
    player = new Player(50, GROUND_Y - 50);
    loadLevel(1);
    gameState = STATE_PLAYING;
}

// Start the game loop
gameLoop();
