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

// ============================================
// INPUT HANDLING
// ============================================

const keys = {
    left: false,
    right: false,
    jump: false,
    attack: false
};

document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowLeft':
            keys.left = true;
            e.preventDefault();
            break;
        case 'ArrowRight':
            keys.right = true;
            e.preventDefault();
            break;
        case ' ':
            keys.jump = true;
            e.preventDefault();
            break;
        case 'x':
        case 'X':
            keys.attack = true;
            e.preventDefault();
            break;
        case 'Enter':
            if (gameState === STATE_TITLE || gameState === STATE_GAME_OVER || gameState === STATE_VICTORY) {
                startGame();
            }
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch(e.key) {
        case 'ArrowLeft':
            keys.left = false;
            break;
        case 'ArrowRight':
            keys.right = false;
            break;
        case ' ':
            keys.jump = false;
            break;
        case 'x':
        case 'X':
            keys.attack = false;
            break;
    }
});

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
        // Draw player body
        ctx.fillStyle = '#4a90e2';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw sword
        const swordLength = 30;
        const swordX = this.facing === 1 ? this.x + this.width : this.x - swordLength;
        const swordY = this.y + 15;
        
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(swordX, swordY, swordLength, 5);

        // Draw sword glow effects based on stones
        if (this.stones.length > 0) {
            ctx.save();
            ctx.shadowBlur = 20;
            
            if (this.hasAllStones()) {
                // Ultimate sword - cycling colors
                const time = Date.now() * 0.005;
                const r = Math.sin(time) * 0.5 + 0.5;
                const g = Math.sin(time + 2) * 0.5 + 0.5;
                const b = Math.sin(time + 4) * 0.5 + 0.5;
                ctx.shadowColor = `rgb(${r * 255}, ${g * 255}, ${b * 255})`;
            } else {
                // Individual stone glows
                if (this.stones.includes(STONE_FIRE)) {
                    ctx.shadowColor = '#ff4500';
                }
                if (this.stones.includes(STONE_WATER)) {
                    ctx.shadowColor = '#00bfff';
                }
                if (this.stones.includes(STONE_LIGHTNING)) {
                    ctx.shadowColor = '#ffd700';
                }
            }
            
            ctx.fillRect(swordX, swordY, swordLength, 5);
            ctx.restore();
        }

        // Draw attack hitbox (debug - can be removed)
        if (this.attackDuration > 0) {
            const hitbox = this.getAttackHitbox();
            if (hitbox) {
                ctx.strokeStyle = 'yellow';
                ctx.lineWidth = 2;
                ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
            }
        }
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
        // Draw enemy body
        ctx.fillStyle = this.type === 'basic' ? '#e74c3c' : 
                       this.type === 'medium' ? '#c0392b' : '#8b0000';
        ctx.fillRect(this.x, this.y, this.width, this.height);
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
        // Draw boss body
        if (this.level === 3) {
            // Demon King - dark purple/black
            ctx.fillStyle = '#2d1b4e';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = '#4b0082';
            ctx.fillRect(this.x + 5, this.y + 5, this.width - 10, this.height - 10);
        } else {
            ctx.fillStyle = '#8b0000';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        // Draw projectiles
        ctx.fillStyle = '#ff6347';
        for (let proj of this.projectiles) {
            ctx.fillRect(proj.x, proj.y, proj.width, proj.height);
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
    // Player health bar
    const barWidth = 200;
    const barHeight = 20;
    const barX = 20;
    const barY = 20;
    
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    const hpPercent = player.hp / player.maxHp;
    ctx.fillStyle = hpPercent > 0.5 ? '#2ecc71' : hpPercent > 0.25 ? '#f39c12' : '#e74c3c';
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.fillText(`HP: ${Math.ceil(player.hp)}/${player.maxHp}`, barX + 5, barY + 15);
    
    // Level indicator
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(`Level ${currentLevel}`, CANVAS_WIDTH / 2 - 40, 35);
    
    // Sword powers display
    ctx.font = '14px Arial';
    let powersY = 50;
    if (player.stones.includes(STONE_FIRE)) {
        ctx.fillStyle = '#ff4500';
        ctx.fillText('🔥 Fire', 20, powersY);
        powersY += 20;
    }
    if (player.stones.includes(STONE_WATER)) {
        ctx.fillStyle = '#00bfff';
        ctx.fillText('💧 Water', 20, powersY);
        powersY += 20;
    }
    if (player.stones.includes(STONE_LIGHTNING)) {
        ctx.fillStyle = '#ffd700';
        ctx.fillText('⚡ Lightning', 20, powersY);
        powersY += 20;
    }
    
    // Boss health bar
    if (boss && boss.hp > 0) {
        const bossBarWidth = 400;
        const bossBarHeight = 25;
        const bossBarX = (CANVAS_WIDTH - bossBarWidth) / 2;
        const bossBarY = 20;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(bossBarX, bossBarY, bossBarWidth, bossBarHeight);
        
        const bossHpPercent = boss.hp / boss.maxHp;
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(bossBarX, bossBarY, bossBarWidth * bossHpPercent, bossBarHeight);
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(bossBarX, bossBarY, bossBarWidth, bossBarHeight);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        const bossName = currentLevel === 3 ? 'Demon King' : `Boss Level ${currentLevel}`;
        ctx.fillText(bossName, bossBarX + 10, bossBarY + 18);
        ctx.fillText(`${Math.ceil(boss.hp)}/${boss.maxHp}`, bossBarX + bossBarWidth - 100, bossBarY + 18);
    }
}

function renderTitleScreen() {
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DRAGON STONES KNIGHT', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100);
    
    ctx.font = '24px Arial';
    ctx.fillText('Defeat enemies, collect dragon stones,', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.fillText('and forge the ultimate sword!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    
    ctx.font = '20px Arial';
    ctx.fillText('Controls:', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
    ctx.fillText('Arrow Keys: Move', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 130);
    ctx.fillText('Space: Jump', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 155);
    ctx.fillText('X: Attack', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 180);
    
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('Press ENTER to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 250);
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
    // Clear canvas
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw ground
    ctx.fillStyle = '#2d5016';
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
    
    // Draw platforms
    ctx.fillStyle = '#8b7355';
    for (let platform of platforms) {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
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
