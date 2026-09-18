(function () {
    'use strict';

    const SAVE_KEY = 'mine-nain-elfe-save-v1';
    const CANVAS_W = 1200;
    const CANVAS_H = 600;
    const TILE = 24;
    const WORLD_W = 56;
    const WORLD_H = 96;
    const BARRIER_ROW = 42;
    const INVINCIBILITY_FRAMES = 45;
    const BASE_INV_SLOTS = 8;
    const SLOT_PER_UPGRADE = 4;

    const STATE_TITLE = 'TITLE';
    const STATE_PLAYING = 'PLAYING';
    const STATE_INV = 'INV';
    const STATE_COLLECTION = 'COLLECTION';
    const STATE_SHOP = 'SHOP';
    const STATE_GAME_OVER = 'GAME_OVER';

    const T = MINE_TILE;
    const DEFS = MINE_TILE_DEFS;

    const canvas = document.getElementById('mineCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;

    let gameState = STATE_TITLE;
    let world = [];
    let particles = [];
    let enemies = [];
    let projectiles = [];
    let floatingTexts = [];
    let screenMessage = '';
    let screenMessageTimer = 0;

    const keys = Object.create(null);

    const meta = {
        gold: 0,
        pickaxeLevel: 1,
        maxHp: 100,
        hp: 100,
        inventory: {},
        collection: [],
        depthUnlocked: false,
        invUpgrades: 0,
        mutantKills: 0,
        maxDepthReached: 0
    };

    const player = {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        w: 20,
        h: 32,
        facing: 1,
        onGround: false,
        digCooldown: 0,
        attackCooldown: 0,
        invuln: 0,
        digTarget: null,
        _animFrame: 0,
        _animTimer: 0,
        _idleTime: 0
    };

    /** Même pipeline que main.js — PNG dans assets/characters/knight/ */
    const mineKnightSprites = {};

    function mineLoadKnightFrames(baseName, srcs) {
        const imgs = srcs.map((src) => {
            const img = new Image();
            img.src = src;
            return img;
        });
        mineKnightSprites[baseName] = {
            frames: imgs,
            loaded: false,
            frameCount: srcs.length,
            isSingleFrames: true
        };
        let pending = imgs.length;
        imgs.forEach((img) => {
            const fin = () => {
                if (--pending === 0) {
                    mineKnightSprites[baseName].loaded = imgs.some(
                        (im) => im.complete && im.naturalWidth > 0
                    );
                }
            };
            img.onload = fin;
            img.onerror = fin;
        });
    }

    function mineDrawKnightSprite(ctx, name, frame, x, y, w, h, flipX) {
        const s = mineKnightSprites[name];
        if (!s || !s.loaded || !s.isSingleFrames) return false;
        const f = Math.floor(frame) % s.frameCount;
        const img = s.frames[f];
        if (!img || !img.complete || img.naturalWidth === 0) return false;
        ctx.save();
        if (flipX) {
            ctx.translate(x + w, y);
            ctx.scale(-1, 1);
            ctx.drawImage(img, 0, 0, w, h);
        } else {
            ctx.drawImage(img, x, y, w, h);
        }
        ctx.restore();
        return true;
    }

    function loadMineKnightSprites() {
        const knightBase = 'assets/characters/knight';
        mineLoadKnightFrames(
            'knight_idle',
            Array.from({ length: 12 }, (_, i) => `${knightBase}/Idle/idle${i + 1}.png`)
        );
        mineLoadKnightFrames(
            'knight_run',
            Array.from({ length: 8 }, (_, i) => `${knightBase}/Run/run${i + 1}.png`)
        );
        mineLoadKnightFrames('knight_attack', Array.from({ length: 5 }, (_, i) => `${knightBase}/Attack/attack${i}.png`));
        mineLoadKnightFrames(
            'knight_hurt',
            Array.from({ length: 4 }, (_, i) => `${knightBase}/Hurt/hurt${i + 1}.png`)
        );
        mineLoadKnightFrames(
            'knight_walk',
            Array.from({ length: 6 }, (_, i) => `${knightBase}/Walk/walk${i + 1}.png`)
        );
        mineLoadKnightFrames(
            'knight_run_attack',
            Array.from({ length: 8 }, (_, i) => `${knightBase}/Run_Attack/run_attack${i + 1}.png`)
        );
        mineLoadKnightFrames(
            'knight_jump',
            Array.from({ length: 7 }, (_, i) => `${knightBase}/Jump/jump${i + 1}.png`)
        );
    }

    /** Même feuilles que main.js — PNG dans assets/enemies/orc1 (goule), orc2 (mutant). */
    const mineOrcSprites = {};
    const ORC_SHEET_ROW = 3;

    function mineLoadSpriteSheet(name, src, frameW, frameH, srcRow) {
        const img = new Image();
        img.src = src;
        const rowY = (srcRow || 0) * frameH;
        mineOrcSprites[name] = {
            img,
            frameW,
            frameH,
            rowY,
            loaded: false,
            frameCount: 1
        };
        const entry = mineOrcSprites[name];
        let finished = false;
        const done = () => {
            if (finished) return;
            finished = true;
            if (!img.complete || img.naturalWidth === 0) {
                entry.loaded = false;
                return;
            }
            entry.loaded = true;
            entry.frameCount = Math.max(1, Math.floor(img.width / frameW));
        };
        img.onload = done;
        img.onerror = () => {
            entry.loaded = false;
            finished = true;
        };
        if (img.complete) done();
    }

    function mineDrawOrcSprite(ctx_, name, frame, x, y, w, h, flipX) {
        const s = mineOrcSprites[name];
        if (!s || !s.loaded || !s.img.complete) return false;
        const f = Math.floor(frame) % s.frameCount;
        ctx_.save();
        if (flipX) {
            ctx_.translate(x + w, y);
            ctx_.scale(-1, 1);
            ctx_.drawImage(s.img, f * s.frameW, s.rowY, s.frameW, s.frameH, 0, 0, w, h);
        } else {
            ctx_.drawImage(s.img, f * s.frameW, s.rowY, s.frameW, s.frameH, x, y, w, h);
        }
        ctx_.restore();
        return true;
    }

    function loadMineOrcSprites() {
        for (const o of ['orc1', 'orc2']) {
            const base = `assets/enemies/${o}`;
            mineLoadSpriteSheet(`${o}_idle`, `${base}/idle.png`, 64, 64, ORC_SHEET_ROW);
            mineLoadSpriteSheet(`${o}_run`, `${base}/run.png`, 64, 64, ORC_SHEET_ROW);
            mineLoadSpriteSheet(`${o}_hurt`, `${base}/hurt.png`, 64, 64, ORC_SHEET_ROW);
        }
    }

    let camX = 0;
    let camY = 0;
    let lastTime = 0;
    let selectedRecipeIndex = 0;
    let shopIndex = 0;

    let audioCtx = null;
    const sounds = {};

    function ensureAudio() {
        if (audioCtx) return;
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            audioCtx = null;
        }
    }

    function beep(freq, dur, type = 'sine', vol = 0.12) {
        if (!audioCtx) return;
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g);
        g.connect(audioCtx.destination);
        o.frequency.value = freq;
        o.type = type;
        g.gain.setValueAtTime(vol, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur);
        o.start();
        o.stop(audioCtx.currentTime + dur);
    }

    sounds.dig = () => beep(120, 0.06, 'square', 0.08);
    sounds.pickup = () => beep(520, 0.08, 'sine', 0.1);
    sounds.hit = () => beep(150, 0.15, 'sawtooth', 0.15);
    sounds.enemyHit = () => beep(280, 0.08, 'sine', 0.1);
    sounds.craft = () => { beep(400, 0.06); beep(600, 0.06); };
    sounds.shop = () => beep(350, 0.1, 'triangle', 0.12);
    sounds.bomb = () => beep(80, 0.2, 'sawtooth', 0.2);
    sounds.death = () => beep(100, 0.4, 'sawtooth', 0.08);

    function invCapacity() {
        return BASE_INV_SLOTS + meta.invUpgrades * SLOT_PER_UPGRADE;
    }

    function countInvKinds() {
        return Object.keys(meta.inventory).filter((k) => meta.inventory[k] > 0).length;
    }

    function addItem(itemId, qty) {
        if (!itemId) return;
        if (itemId === 'gold_nugget') {
            meta.gold += qty;
            return;
        }
        const cap = invCapacity();
        if (!meta.inventory[itemId]) {
            if (countInvKinds() >= cap) {
                showMessage('Sac plein !');
                return;
            }
        }
        meta.inventory[itemId] = (meta.inventory[itemId] || 0) + qty;
        // L’HUD « Or : » suit meta.gold ; le minerai d’or brut rapporte aussi des pièces (en plus du lingot pour le craft).
        if (itemId === 'ore_gold') {
            const g = (12 + Math.floor(Math.random() * 13)) * qty;
            meta.gold += g;
            floatingTexts.push({
                x: player.x + player.w / 2,
                y: player.y + player.h / 2 - 8,
                text: '+' + g + ' or',
                life: 55
            });
        }
    }

    function tryConsume(items) {
        for (const id of Object.keys(items)) {
            if ((meta.inventory[id] || 0) < items[id]) return false;
        }
        for (const id of Object.keys(items)) {
            meta.inventory[id] -= items[id];
            if (meta.inventory[id] <= 0) delete meta.inventory[id];
        }
        return true;
    }

    function showMessage(text) {
        screenMessage = text;
        screenMessageTimer = 120;
    }

    function tileAt(tx, ty) {
        if (tx < 0 || ty < 0 || tx >= WORLD_W || ty >= WORLD_H) return T.BEDROCK;
        return world[ty][tx];
    }

    function setTile(tx, ty, v) {
        if (tx < 0 || ty < 0 || tx >= WORLD_W || ty >= WORLD_H) return;
        world[ty][tx] = v;
    }

    function isSolid(tile) {
        return tile !== T.AIR && tile !== T.CAVERN_MARKER;
    }

    function generateWorld() {
        world = [];
        for (let y = 0; y < WORLD_H; y++) {
            const row = [];
            for (let x = 0; x < WORLD_W; x++) {
                if (y < 7) row.push(T.AIR);
                else if (y < 11) row.push(T.DIRT);
                else if (y === BARRIER_ROW && !meta.depthUnlocked) row.push(T.BARRIER);
                else if (y >= WORLD_H - 2) row.push(T.BEDROCK);
                else {
                    const depth = y - 11;
                    let t = T.STONE;
                    const r = Math.random();
                    if (r < 0.08 + depth * 0.002) t = T.DIRT;
                    if (depth > 5 && Math.random() < 0.04 + depth * 0.0015) t = T.ORE_COPPER;
                    if (depth > 10 && Math.random() < 0.035 + depth * 0.001) t = T.ORE_IRON;
                    if (depth > 22 && Math.random() < 0.025) t = T.ORE_SILVER;
                    if (depth > 24 && Math.random() < 0.034) t = T.ORE_GOLD;
                    if (meta.depthUnlocked && depth > 35 && Math.random() < 0.012) t = T.ORE_CRYSTAL;
                    if (meta.depthUnlocked && depth > 48 && Math.random() < 0.008) t = T.ORE_MYTHRIL;
                    if (depth > 15 && Math.random() < 0.02) t = T.STONE_HARD;
                    if (meta.depthUnlocked && depth > 40 && Math.random() < 0.12) t = T.STONE_HARD;
                    row.push(t);
                }
            }
            world.push(row);
        }
        carveCaverns();
    }

    function carveCaverns() {
        for (let i = 0; i < 35; i++) {
            const cx = 4 + Math.floor(Math.random() * (WORLD_W - 8));
            const cy = 18 + Math.floor(Math.random() * (WORLD_H - 28));
            const rad = 2 + Math.floor(Math.random() * 4);
            for (let dy = -rad; dy <= rad; dy++) {
                for (let dx = -rad; dx <= rad; dx++) {
                    if (dx * dx + dy * dy <= rad * rad + 1) {
                        const t = tileAt(cx + dx, cy + dy);
                        if (t !== T.BEDROCK && t !== T.BARRIER) {
                            setTile(cx + dx, cy + dy, T.AIR);
                        }
                    }
                }
            }
            if (cy > 20) setTile(cx, cy, T.CAVERN_MARKER);
        }
    }

    function removeBarriers() {
        for (let x = 0; x < WORLD_W; x++) {
            if (tileAt(x, BARRIER_ROW) === T.BARRIER) setTile(x, BARRIER_ROW, T.STONE_HARD);
        }
    }

    function resetRun() {
        generateWorld();
        player.x = (WORLD_W / 2) * TILE + 2;
        player.y = 5 * TILE;
        player.vx = 0;
        player.vy = 0;
        player.facing = 1;
        player.digTarget = null;
        player.invuln = 0;
        enemies = [];
        projectiles = [];
        floatingTexts = [];
        particles = [];
        meta.hp = Math.min(meta.maxHp, meta.hp == null ? meta.maxHp : meta.hp);
    }

    function loadSave() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return false;
            const d = JSON.parse(raw);
            meta.gold = d.gold | 0;
            meta.pickaxeLevel = Math.max(1, Math.min(3, d.pickaxeLevel | 0 || 1));
            meta.maxHp = Math.max(40, d.maxHp | 0 || 100);
            meta.inventory = typeof d.inventory === 'object' && d.inventory ? d.inventory : {};
            meta.collection = Array.isArray(d.collection) ? d.collection : [];
            meta.depthUnlocked = !!d.depthUnlocked;
            meta.invUpgrades = Math.max(0, Math.min(3, d.invUpgrades | 0));
            meta.mutantKills = d.mutantKills | 0;
            meta.maxDepthReached = d.maxDepthReached | 0;
            meta.hp = d.hp != null ? Math.min(meta.maxHp, d.hp | 0) : meta.maxHp;
            return true;
        } catch (e) {
            return false;
        }
    }

    function saveGame() {
        try {
            localStorage.setItem(
                SAVE_KEY,
                JSON.stringify({
                    gold: meta.gold,
                    pickaxeLevel: meta.pickaxeLevel,
                    maxHp: meta.maxHp,
                    hp: meta.hp,
                    inventory: meta.inventory,
                    collection: meta.collection,
                    depthUnlocked: meta.depthUnlocked,
                    invUpgrades: meta.invUpgrades,
                    mutantKills: meta.mutantKills,
                    maxDepthReached: meta.maxDepthReached
                })
            );
        } catch (e) { /* ignore */ }
    }

    function recipeUnlocked(rec) {
        const u = rec.unlock;
        if (u.minDepth != null) {
            const py = Math.floor((player.y + player.h) / TILE);
            if (py < u.minDepth && meta.maxDepthReached < u.minDepth) return false;
        }
        if (u.itemDiscovered) {
            const need = u.itemDiscovered;
            if (need === 'ore_crystal' && !meta.collection.includes('crystal')) return false;
        }
        if (u.killMutants != null && meta.mutantKills < u.killMutants) return false;
        return true;
    }

    function canCraft(rec) {
        if (!recipeUnlocked(rec)) return false;
        for (const id of Object.keys(rec.ingredients)) {
            if ((meta.inventory[id] || 0) < rec.ingredients[id]) return false;
        }
        return countInvKinds() < invCapacity() || rec.product.item in meta.inventory;
    }

    function doCraft(rec) {
        if (!canCraft(rec)) return;
        if (!tryConsume(rec.ingredients)) return;
        addItem(rec.product.item, rec.product.qty);
        sounds.craft();
        showMessage(rec.name + ' fabriqué !');
        saveGame();
    }

    function doCraftWithFeedback(rec) {
        if (!recipeUnlocked(rec)) {
            showMessage('Recette encore verrouillée.');
            return;
        }
        if (!canCraft(rec)) {
            const miss = Object.keys(rec.ingredients).some(
                (id) => (meta.inventory[id] || 0) < rec.ingredients[id]
            );
            if (miss) showMessage('Pas assez d’ingrédients.');
            else showMessage('Sac plein : libérez un type d’objet.');
            return;
        }
        doCraft(rec);
    }

    /** Articles encore proposés (achats uniques / sac max déjà pris = retirés de la liste). */
    function shopEntryStillListed(entry) {
        if (entry.id === 'pickaxe2' && meta.pickaxeLevel >= 2) return false;
        if (entry.id === 'pickaxe3' && meta.pickaxeLevel >= 3) return false;
        if (entry.id === 'unlock_depth' && meta.depthUnlocked) return false;
        if (entry.id === 'inv_up') {
            const cap = entry.maxStacks != null ? entry.maxStacks : 99;
            if (meta.invUpgrades >= cap) return false;
        }
        return true;
    }

    function getShopList() {
        return MINE_SHOP.filter(shopEntryStillListed);
    }

    function clampShopIndex() {
        const list = getShopList();
        if (list.length === 0) {
            shopIndex = 0;
            return;
        }
        shopIndex = Math.min(shopIndex, list.length - 1);
    }

    function applyShopItem(entry) {
        if (entry.id === 'pickaxe2' && meta.pickaxeLevel >= 2) {
            showMessage('Déjà possédée.');
            return;
        }
        if (entry.id === 'pickaxe3' && meta.pickaxeLevel >= 3) {
            showMessage('Déjà possédée.');
            return;
        }
        if (entry.id === 'unlock_depth' && meta.depthUnlocked) {
            showMessage('Descente déjà achetée.');
            return;
        }
        if (entry.requiresPick && meta.pickaxeLevel < entry.requiresPick) {
            showMessage('Pioche insuffisante.');
            return;
        }
        if (entry.requiresMutantKills && meta.mutantKills < entry.requiresMutantKills) {
            showMessage(
                'Encore ' +
                    (entry.requiresMutantKills - meta.mutantKills) +
                    ' mutant(s) (grands orcs) — les goules ne comptent pas.'
            );
            return;
        }
        if (entry.id === 'inv_up' && meta.invUpgrades >= 3) {
            showMessage('Sac déjà au maximum.');
            return;
        }
        if (meta.gold < entry.price) {
            showMessage('Pas assez d\'or.');
            return;
        }
        meta.gold -= entry.price;
        sounds.shop();
        if (entry.id === 'pickaxe2') meta.pickaxeLevel = 2;
        else if (entry.id === 'pickaxe3') meta.pickaxeLevel = 3;
        else if (entry.id === 'hp_up') {
            meta.maxHp += 20;
            meta.hp += 20;
        } else if (entry.id === 'inv_up') meta.invUpgrades = Math.min(3, meta.invUpgrades + 1);
        else if (entry.id === 'unlock_depth') {
            meta.depthUnlocked = true;
            removeBarriers();
        }
        showMessage(entry.name + ' !');
        saveGame();
        clampShopIndex();
    }

    function playerRect() {
        return { x: player.x, y: player.y, w: player.w, h: player.h };
    }

    function collideTiles(rect) {
        const x0 = Math.floor(rect.x / TILE);
        const x1 = Math.floor((rect.x + rect.w - 0.01) / TILE);
        const y0 = Math.floor(rect.y / TILE);
        const y1 = Math.floor((rect.y + rect.h - 0.01) / TILE);
        for (let ty = y0; ty <= y1; ty++) {
            for (let tx = x0; tx <= x1; tx++) {
                if (isSolid(tileAt(tx, ty))) return true;
            }
        }
        return false;
    }

    /**
     * Pieds au sol : bande fine sous la hitbox (comme un overlap AABB étendu vers le bas).
     * L’ancien seul pixel ty = floor((y+h+0.12)/T) ratait le sol dès que les pieds flottaient
     * de quelques dixièmes au-dessus du bloc (ty tombait sur la ligne d’air au-dessus).
     */
    function feetTouchGround() {
        const r = playerRect();
        const probePad = 3;
        const py = r.y + r.h;
        const x0 = Math.floor(r.x / TILE);
        const x1 = Math.floor((r.x + r.w - 0.01) / TILE);
        const y0 = Math.floor(py / TILE);
        const y1 = Math.floor((py + probePad) / TILE);
        for (let ty = y0; ty <= y1; ty++) {
            for (let tx = x0; tx <= x1; tx++) {
                if (isSolid(tileAt(tx, ty))) return true;
            }
        }
        return false;
    }

    function clearJumpKeys() {
        keys['Space'] = false;
        keys['ArrowUp'] = false;
        keys['KeyW'] = false;
        keys['KeyZ'] = false;
    }

    function tryMove(dx, dy) {
        const r = playerRect();
        r.x += dx;
        if (!collideTiles(r)) {
            player.x = r.x;
            return true;
        }
        r.x = player.x;
        r.y += dy;
        if (!collideTiles(r)) {
            player.y = r.y;
            return true;
        }
        return false;
    }

    function resolvePhysics() {
        const GRAVITY = 0.45;
        const MAX_FALL = 11;
        const MOVE = 0.55;

        const grounded = feetTouchGround();
        if (
            grounded &&
            (keys['Space'] || keys['KeyW'] || keys['KeyZ'] || keys['ArrowUp'])
        ) {
            player.vy = -9.2;
        }

        player.vy += GRAVITY;
        if (player.vy > MAX_FALL) player.vy = MAX_FALL;

        const stepX = player.vx;
        let wallBlockedDir = 0;
        player.x += stepX;
        if (collideTiles(playerRect())) {
            player.x -= stepX;
            if (stepX > 0.04) wallBlockedDir = 1;
            else if (stepX < -0.04) wallBlockedDir = -1;
            player.vx = 0;
        }
        player.y += player.vy;
        if (collideTiles(playerRect())) {
            player.y -= player.vy;
            player.vy = 0;
        }

        if (keys['ArrowLeft'] || keys['KeyA'] || keys['KeyQ']) {
            player.vx -= MOVE;
            player.facing = -1;
        }
        if (keys['ArrowRight'] || keys['KeyD']) {
            player.vx += MOVE;
            player.facing = 1;
        }
        player.vx *= 0.82;
        if (Math.abs(player.vx) < 0.05) player.vx = 0;

        const wantRight = keys['ArrowRight'] || keys['KeyD'];
        const wantLeft = keys['ArrowLeft'] || keys['KeyA'] || keys['KeyQ'];
        if (wantRight && player.facing === 1 && (wallBlockedDir === 1 || wallProbeHitsSolid(1))) {
            dig('forward');
        } else if (wantLeft && player.facing === -1 && (wallBlockedDir === -1 || wallProbeHitsSolid(-1))) {
            dig('forward');
        }

        player.onGround = feetTouchGround();
    }

    /**
     * Sonde devant le buste (pas les pieds) : évite de creuser en marchant sur un sol plat,
     * tout en détectant un mur la 1ère frame où vx = 0.
     */
    function wallProbeHitsSolid(side) {
        const r = playerRect();
        const probeW = 5;
        const px0 = side > 0 ? r.x + r.w - 1 : r.x - probeW + 1;
        const py0 = r.y + Math.max(4, r.h * 0.22);
        const ph = Math.max(8, r.h * 0.48);
        const x0 = Math.floor(px0 / TILE);
        const x1 = Math.floor((px0 + probeW - 0.01) / TILE);
        const y0 = Math.floor(py0 / TILE);
        const y1 = Math.floor((py0 + ph - 0.01) / TILE);
        for (let ty = y0; ty <= y1; ty++) {
            for (let tx = x0; tx <= x1; tx++) {
                const t = tileAt(tx, ty);
                if (isSolid(t) || t === T.BARRIER) return true;
            }
        }
        return false;
    }

    /** Ligne de tuiles sur laquelle on « pose » le pied (comme les collisions). */
    function footTileRow() {
        return Math.floor((player.y + player.h - 0.02) / TILE);
    }

    /** Plusieurs hauteurs devant soi : sol, buste, tête — pour creuser sur le côté en sautant. */
    function forwardDigCellRows() {
        const y0 = player.y;
        const h = player.h;
        return [
            Math.floor((y0 + h * 0.78) / TILE),
            footTileRow(),
            Math.floor((y0 + h * 0.45) / TILE),
            Math.floor((y0 + h * 0.2) / TILE),
            Math.floor((y0 + 2) / TILE)
        ];
    }

    function pickForwardDigCell() {
        const cx = player.x + player.w / 2 + player.facing * (TILE * 0.85);
        const tx = Math.floor(cx / TILE);
        for (const ty of forwardDigCellRows()) {
            if (tx < 0 || ty < 0 || tx >= WORLD_W || ty >= WORLD_H) continue;
            const tile = tileAt(tx, ty);
            if (isSolid(tile) || tile === T.BARRIER) return { tx, ty, tile };
        }
        return null;
    }

    /** Case sous les pieds (descendre dans la mine). */
    function downDigCell() {
        const tx = Math.floor((player.x + player.w / 2) / TILE);
        return { tx, ty: footTileRow() + 1 };
    }

    /**
     * @param {'forward'|'down'} mode
     * @param {boolean} [fromAttack] forward depuis [F] : pas le même cooldown que pousser un mur
     * @returns {boolean} true si un coup de pioche a touché de la roche (SFX déjà joué)
     */
    function dig(mode, fromAttack) {
        const skipDigCd = fromAttack === true && mode === 'forward';
        if (!skipDigCd && player.digCooldown > 0) return false;
        let tx;
        let ty;
        let tile;
        if (mode === 'down') {
            const d = downDigCell();
            tx = d.tx;
            ty = d.ty;
            if (tx < 0 || ty < 0 || tx >= WORLD_W || ty >= WORLD_H) return false;
            tile = tileAt(tx, ty);
        } else {
            const pick = pickForwardDigCell();
            if (!pick) return false;
            tx = pick.tx;
            ty = pick.ty;
            tile = pick.tile;
        }
        if (!isSolid(tile) && tile !== T.BARRIER) return false;
        const def = DEFS[tile];
        if (!def) return false;
        if (tile === T.BARRIER) {
            showMessage('Sceau magique : achetez « Descendre » à la boutique.');
            if (!skipDigCd) player.digCooldown = 20;
            return false;
        }
        if (tile === T.BEDROCK) {
            showMessage('Roche impénétrable.');
            if (!skipDigCd) player.digCooldown = 15;
            return false;
        }
        if (meta.pickaxeLevel < def.minPick) {
            showMessage('Pioche trop faible pour : ' + def.name);
            if (!skipDigCd) player.digCooldown = 20;
            return false;
        }

        if (!player.digTarget || player.digTarget.tx !== tx || player.digTarget.ty !== ty || player.digTarget.mode !== mode) {
            player.digTarget = { tx, ty, mode, dmg: 0 };
        }
        const pickDmg = 1.15 + meta.pickaxeLevel * 0.55;
        player.digTarget.dmg += pickDmg;
        sounds.dig();
        spawnParticles(tx * TILE + TILE / 2, ty * TILE + TILE / 2, def.color, 6);

        if (player.digTarget.dmg >= def.hardness) {
            setTile(tx, ty, T.AIR);
            if (def.drop) {
                addItem(def.drop, 1);
                if (def.rareCard && !meta.collection.includes(def.rareCard)) {
                    meta.collection.push(def.rareCard);
                    showMessage('Carte collection : ' + (MINE_CARDS[def.rareCard] || {}).title);
                }
                sounds.pickup();
                saveGame();
            }
            player.digTarget = null;
        }
        if (!skipDigCd) player.digCooldown = Math.max(8, 16 - meta.pickaxeLevel * 2);
        player.attackCooldown = 22;
        return true;
    }

    /** [F] : combat + même creusage devant que la pioche (sans bloquer le cooldown du mur). */
    function swingPickaxe() {
        if (player.attackCooldown > 0) return;
        player.attackCooldown = 22;

        const chipped = dig('forward', true);

        const px = player.x + player.w / 2 + player.facing * 28;
        const py = player.y + player.h / 2;
        let hitEnemy = false;
        for (const e of enemies) {
            if (e.hp <= 0) continue;
            const dx = e.x + e.w / 2 - px;
            const dy = e.y + e.h / 2 - py;
            if (dx * dx + dy * dy < 42 * 42) {
                e.hp -= 8 + meta.pickaxeLevel * 2;
                e.hitFlash = 8;
                hitEnemy = true;
                sounds.enemyHit();
                spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#ff6666', 8);
            }
        }
        if (!hitEnemy && !chipped) {
            sounds.dig();
        }
    }

    function useBomb() {
        if ((meta.inventory.bomb || 0) < 1) {
            showMessage('Pas de bombe — artisanat [I] (fer + cuivre).');
            return;
        }
        meta.inventory.bomb--;
        if (meta.inventory.bomb <= 0) delete meta.inventory.bomb;
        sounds.bomb();
        const cx = player.x + player.w / 2 + player.facing * 48;
        const cy = player.y + player.h / 2;
        spawnParticles(cx, cy, '#ffaa00', 30);
        for (const e of enemies) {
            if (e.hp <= 0) continue;
            const dx = e.x + e.w / 2 - cx;
            const dy = e.y + e.h / 2 - cy;
            if (dx * dx + dy * dy < 56 * 56) {
                e.hp -= 28;
                e.hitFlash = 12;
            }
        }
        const tx = Math.floor(cx / TILE);
        const ty = Math.floor(cy / TILE);
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                const t = tileAt(tx + dx, ty + dy);
                const d = DEFS[t];
                if (d && d.hardness <= 5 && t !== T.BEDROCK && t !== T.BARRIER) {
                    if (Math.random() < 0.45) setTile(tx + dx, ty + dy, T.AIR);
                }
            }
        }
        saveGame();
    }

    function useSpray() {
        if ((meta.inventory.spray || 0) < 1) {
            showMessage('Pas de fiole — cristal + cuivre (recette).');
            return;
        }
        meta.inventory.spray--;
        if (meta.inventory.spray <= 0) delete meta.inventory.spray;
        beep(200, 0.1, 'triangle', 0.1);
        const px = player.x + player.w / 2 + player.facing * 40;
        const py = player.y + player.h / 2;
        spawnParticles(px, py, '#88ffcc', 20);
        for (const e of enemies) {
            if (e.hp <= 0) continue;
            const dx = e.x + e.w / 2 - px;
            const dy = e.y + e.h / 2 - py;
            if (Math.abs(dx) < 70 && Math.abs(dy) < 40 && Math.sign(dx) === player.facing) {
                e.slowTimer = 150;
                e.poison = 90;
            }
        }
        saveGame();
    }

    function useHeal() {
        if ((meta.inventory.heal_salve || 0) < 1) {
            showMessage('Pas de baume de soin.');
            return;
        }
        meta.inventory.heal_salve--;
        if (meta.inventory.heal_salve <= 0) delete meta.inventory.heal_salve;
        meta.hp = Math.min(meta.maxHp, meta.hp + 35);
        sounds.pickup();
        saveGame();
    }

    function spawnEnemy(type, x, y) {
        if (type === 'zombie') {
            enemies.push({
                type,
                x,
                y,
                w: 22,
                h: 30,
                vx: 0,
                hp: 22,
                dmg: 5,
                speed: 0.35,
                attackCd: 0,
                hitFlash: 0,
                slowTimer: 0,
                poison: 0,
                _animTimer: 0,
                _animFrame: 0
            });
        } else {
            enemies.push({
                type: 'mutant',
                x,
                y,
                w: 26,
                h: 34,
                vx: 0,
                hp: 38,
                dmg: 8,
                speed: 0.75,
                attackCd: 0,
                shootCd: 40 + Math.floor(Math.random() * 50),
                hitFlash: 0,
                slowTimer: 0,
                poison: 0,
                _animTimer: 0,
                _animFrame: 0
            });
        }
    }

    function tileFreeForEnemy(tx, ty) {
        for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
                if (isSolid(tileAt(tx + dx, ty + dy))) return false;
            }
        }
        return true;
    }

    function maybeSpawnEnemy() {
        const ty = Math.floor((player.y + player.h) / TILE);
        if (ty < 18) return;
        if (enemies.length >= 6) return;
        if (Math.random() > 0.003) return;
        if (!isSolid(tileAt(Math.floor(player.x / TILE), ty))) {
            const depth = ty;
            const side = player.x + (Math.random() > 0.5 ? -100 : 100);
            const sx = Math.max(TILE, Math.min(WORLD_W * TILE - 48, side));
            const stx = Math.floor(sx / TILE);
            if (!tileFreeForEnemy(stx, ty - 2)) return;
            // Mutants dès la zone minière (y≥20) : nécessaire pour débloquer « Descendre » (2 kills).
            // Après ouverture du sceau, un peu plus de mutants en profondeur.
            let mutChance = 0.36;
            if (meta.depthUnlocked && depth > BARRIER_ROW + 3) mutChance = 0.48;
            const mut = depth >= 20 && Math.random() < mutChance;
            spawnEnemy(mut ? 'mutant' : 'zombie', stx * TILE, (ty - 2) * TILE);
        }
    }

    function updateEnemies() {
        const pr = playerRect();
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            if (e.hp <= 0) {
                const goldDrop =
                    e.type === 'mutant'
                        ? 20 + Math.floor(Math.random() * 16)
                        : 10 + Math.floor(Math.random() * 12);
                meta.gold += goldDrop;
                if (e.type === 'mutant') meta.mutantKills++;
                floatingTexts.push({ x: e.x, y: e.y, text: '+' + goldDrop + ' or', life: 60 });
                spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#ffd700', 15);
                enemies.splice(i, 1);
                saveGame();
                continue;
            }
            if (e.poison > 0) {
                e.poison--;
                if (e.poison % 12 === 0) e.hp -= 2;
            }
            if (e._animTimer === undefined) e._animTimer = 0;
            if (e._animFrame === undefined) e._animFrame = 0;
            e._animTimer++;
            if (e._animTimer % 7 === 0) e._animFrame++;

            const sp = e.slowTimer > 0 ? e.speed * 0.35 : e.speed;
            if (e.slowTimer > 0) e.slowTimer--;
            const dir = Math.sign(pr.x + pr.w / 2 - (e.x + e.w / 2));
            e.vx = dir * sp;
            e.x += e.vx;
            if (collideEnemyWorld(e)) e.x -= e.vx;
            e.y += 0.55;
            if (collideEnemyWorld(e)) {
                e.y -= 0.55;
            }
            if (e.hitFlash > 0) e.hitFlash--;

            const ax = Math.abs(pr.x + pr.w / 2 - (e.x + e.w / 2));
            const ay = Math.abs(pr.y + pr.h / 2 - (e.y + e.h / 2));
            if (ax < 20 && ay < 26 && player.invuln <= 0) {
                if (e.attackCd <= 0) {
                    meta.hp -= e.dmg;
                    player.invuln = INVINCIBILITY_FRAMES;
                    e.attackCd = 50;
                    sounds.hit();
                    saveGame();
                }
            }
            if (e.attackCd > 0) e.attackCd--;

            if (e.type === 'mutant') {
                e.shootCd--;
                if (e.shootCd <= 0 && ax < 220) {
                    e.shootCd = 70 + Math.floor(Math.random() * 40);
                    const bx = e.x + e.w / 2;
                    const by = e.y + e.h / 2;
                    const vx = Math.sign(pr.x - e.x) * 4.2;
                    projectiles.push({ x: bx, y: by, vx, vy: 0.3, life: 120, dmg: 6 });
                }
            }
        }

        for (let j = projectiles.length - 1; j >= 0; j--) {
            const p = projectiles[j];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) {
                projectiles.splice(j, 1);
                continue;
            }
            if (p.x > pr.x && p.x < pr.x + pr.w && p.y > pr.y && p.y < pr.y + pr.h && player.invuln <= 0) {
                meta.hp -= p.dmg;
                player.invuln = INVINCIBILITY_FRAMES;
                sounds.hit();
                saveGame();
                projectiles.splice(j, 1);
            }
        }
    }

    function collideEnemyWorld(e) {
        const r = { x: e.x, y: e.y, w: e.w, h: e.h };
        return collideTiles(r);
    }

    function spawnParticles(x, y, color, n) {
        for (let i = 0; i < n; i++) {
            particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4 - 1,
                life: 20 + Math.floor(Math.random() * 20),
                color,
                size: 2 + Math.random() * 3
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
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            const f = floatingTexts[i];
            f.y -= 0.6;
            f.life--;
            if (f.life <= 0) floatingTexts.splice(i, 1);
        }
    }

    function updateCamera() {
        const targetX = player.x + player.w / 2 - CANVAS_W / 2;
        const targetY = player.y + player.h / 2 - CANVAS_H / 2;
        const maxX = WORLD_W * TILE - CANVAS_W;
        const maxY = WORLD_H * TILE - CANVAS_H;
        camX = Math.max(0, Math.min(maxX, targetX));
        camY = Math.max(0, Math.min(maxY, targetY));
    }

    /** Repère d’affichage aligné sur Player.render (main.js) : pieds sur la hitbox. */
    const KNIGHT_SPRITE_W = 100;
    const KNIGHT_SPRITE_H = 100;
    const KNIGHT_FEET_OFFSET = 14;

    function drawFallbackMinePlayer(ctx_, bx, by, bw, bh) {
        const sx = bx;
        const sy = by;
        ctx_.save();
        if (player.facing < 0) {
            ctx_.translate(sx + bw, sy);
            ctx_.scale(-1, 1);
            ctx_.translate(-sx, -sy);
        }
        ctx_.fillStyle = '#5a6a7a';
        ctx_.fillRect(sx + 3, sy + 12, 14, 16);
        ctx_.fillStyle = '#c9a86c';
        ctx_.fillRect(sx + 5, sy + 7, 10, 9);
        ctx_.fillStyle = '#d4b896';
        ctx_.fillRect(sx + 5, sy + 3, 4, 5);
        ctx_.fillRect(sx + 11, sy + 3, 4, 5);
        ctx_.restore();
    }

    function drawPlayer(ctx_) {
        const bx = Math.floor(player.x - camX);
        const by = Math.floor(player.y - camY);
        const bw = player.w;
        const bh = player.h;

        player._animTimer++;
        if (player._animTimer % 6 === 0) player._animFrame++;

        const invincibleBlink = player.invuln > 0 && Math.floor(player.invuln / 4) % 2 === 0;
        const flash = false;

        const isIdle =
            !flash &&
            player.attackCooldown <= 12 &&
            Math.abs(player.vy) < 1 &&
            Math.abs(player.vx) < 0.1;
        if (isIdle) player._idleTime++;
        else player._idleTime = 0;

        let spriteName = 'knight_idle';
        let useStaticFrame = false;
        if (flash) {
            spriteName = 'knight_hurt';
        } else if (player.invuln > INVINCIBILITY_FRAMES - 14) {
            spriteName = 'knight_hurt';
        } else if (player.attackCooldown > 12 && Math.abs(player.vx) > 0.5) {
            spriteName = 'knight_run_attack';
        } else if (player.attackCooldown > 12) {
            spriteName = 'knight_attack';
        } else if (player.vy < -1) {
            spriteName = 'knight_jump';
        } else if (Math.abs(player.vx) > 0.5) {
            spriteName = 'knight_run';
        } else if (Math.abs(player.vx) > 0.1) {
            spriteName = 'knight_walk';
        } else if (player._idleTime > 180) {
            spriteName = 'knight_idle';
        } else {
            spriteName = 'knight_idle';
            useStaticFrame = true;
        }

        const drawFrame = useStaticFrame ? 0 : player._animFrame;
        const flipX = player.facing === -1;
        const px = bx + bw / 2 - KNIGHT_SPRITE_W / 2;
        const py = by + bh - KNIGHT_SPRITE_H + KNIGHT_FEET_OFFSET;

        ctx_.save();
        if (invincibleBlink) ctx_.globalAlpha = 0.55;

        ctx_.fillStyle = 'rgba(0,0,0,0.2)';
        ctx_.beginPath();
        ctx_.ellipse(bx + bw / 2, by + bh + 2, KNIGHT_SPRITE_W / 4 + 8, 6, 0, 0, Math.PI * 2);
        ctx_.fill();

        const drawn = mineDrawKnightSprite(
            ctx_,
            spriteName,
            drawFrame,
            px,
            py,
            KNIGHT_SPRITE_W,
            KNIGHT_SPRITE_H,
            flipX
        );
        if (!drawn) {
            drawFallbackMinePlayer(ctx_, bx, by, bw, bh);
        }

        if (invincibleBlink && drawn) {
            ctx_.save();
            ctx_.globalAlpha = 0.35;
            ctx_.shadowBlur = 18;
            ctx_.shadowColor = '#ffffff';
            ctx_.beginPath();
            ctx_.ellipse(px + KNIGHT_SPRITE_W / 2, py + KNIGHT_SPRITE_H / 2, KNIGHT_SPRITE_W / 2, KNIGHT_SPRITE_H / 2, 0, 0, Math.PI * 2);
            ctx_.fillStyle = 'rgba(255,255,255,0.12)';
            ctx_.fill();
            ctx_.restore();
        }

        ctx_.restore();
    }

    function drawWorld(ctx_) {
        const t0x = Math.floor(camX / TILE);
        const t0y = Math.floor(camY / TILE);
        const tw = Math.ceil(CANVAS_W / TILE) + 2;
        const th = Math.ceil(CANVAS_H / TILE) + 2;
        for (let ty = t0y; ty < t0y + th; ty++) {
            for (let tx = t0x; tx < t0x + tw; tx++) {
                let tile = tileAt(tx, ty);
                if (tile === T.CAVERN_MARKER) tile = T.AIR;
                const def = DEFS[tile];
                if (!def) continue;
                const px = tx * TILE - camX;
                const py = ty * TILE - camY;
                ctx_.fillStyle = def.color;
                ctx_.fillRect(px, py, TILE, TILE);
                if (def.glow) {
                    ctx_.save();
                    ctx_.shadowBlur = 10;
                    ctx_.shadowColor = def.glow;
                    ctx_.fillStyle = def.color;
                    ctx_.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
                    ctx_.restore();
                }
                ctx_.strokeStyle = 'rgba(0,0,0,0.25)';
                ctx_.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
            }
        }
    }

    function drawEnemies(ctx_) {
        for (const e of enemies) {
            if (e.hp <= 0) continue;
            const sx = Math.floor(e.x - camX);
            const sy = Math.floor(e.y - camY);
            ctx_.save();
            if (e.hitFlash > 0) ctx_.filter = 'brightness(1.8)';

            const prefix = e.type === 'mutant' ? 'orc2' : 'orc1';
            let animKey = 'idle';
            if (e.hitFlash > 0) animKey = 'hurt';
            else if (Math.abs(e.vx) > 0.06) animKey = 'run';
            const spriteName = prefix + '_' + animKey;
            const flipX = e.vx < 0;
            const sw = e.type === 'mutant' ? 92 : 86;
            const sh = sw;
            const feetOff = e.type === 'mutant' ? 30 : 26;
            const px = sx + e.w / 2 - sw / 2;
            const py = sy + e.h - sh + feetOff;
            const drawn = mineDrawOrcSprite(ctx_, spriteName, e._animFrame || 0, px, py, sw, sh, flipX);
            if (!drawn) {
                if (e.type === 'zombie') {
                    ctx_.fillStyle = '#4a6a4a';
                    ctx_.fillRect(sx, sy + 8, e.w, e.h - 8);
                    ctx_.fillStyle = '#8a9a7a';
                    ctx_.fillRect(sx + 4, sy, 14, 12);
                    ctx_.fillStyle = '#223322';
                    ctx_.fillRect(sx + 6, sy + 4, 4, 3);
                    ctx_.fillRect(sx + 12, sy + 4, 4, 3);
                } else {
                    ctx_.fillStyle = '#6a3a5a';
                    ctx_.fillRect(sx, sy + 6, e.w, e.h - 6);
                    ctx_.fillStyle = '#ff4488';
                    ctx_.fillRect(sx + 4, sy + 2, 18, 14);
                    ctx_.fillStyle = '#ffff00';
                    ctx_.fillRect(sx + 8, sy + 6, 6, 4);
                    ctx_.fillRect(sx + 16, sy + 6, 6, 4);
                }
            }

            ctx_.restore();
            const bw = 20;
            ctx_.fillStyle = '#222';
            ctx_.fillRect(sx, sy - 6, bw, 4);
            ctx_.fillStyle = '#c44';
            ctx_.fillRect(sx, sy - 6, bw * (e.hp / (e.type === 'mutant' ? 38 : 22)), 4);
        }
        for (const p of projectiles) {
            ctx_.save();
            ctx_.shadowBlur = 8;
            ctx_.shadowColor = '#ff00aa';
            ctx_.fillStyle = '#ff66cc';
            ctx_.fillRect(p.x - camX - 3, p.y - camY - 3, 6, 6);
            ctx_.restore();
        }
    }

    function drawHud(ctx_) {
        ctx_.save();
        ctx_.fillStyle = 'rgba(0,0,0,0.55)';
        ctx_.fillRect(8, 8, 280, 86);
        ctx_.fillStyle = '#ccc';
        ctx_.font = '14px system-ui,Segoe UI,sans-serif';
        const py = Math.floor((player.y + player.h) / TILE);
        meta.maxDepthReached = Math.max(meta.maxDepthReached, py);
        ctx_.fillText('PV', 16, 28);
        ctx_.fillStyle = '#333';
        ctx_.fillRect(48, 16, 120, 12);
        ctx_.fillStyle = '#3a7a3a';
        ctx_.fillRect(48, 16, 120 * (meta.hp / meta.maxHp), 12);
        ctx_.fillStyle = '#ccc';
        ctx_.fillText(Math.floor(meta.hp) + ' / ' + meta.maxHp, 175, 27);
        ctx_.fillText('Or : ' + meta.gold, 16, 48);
        ctx_.fillText('Couche : ' + mineLayerNameForDepth(py) + ' (y≈' + py + ')', 16, 66);
        ctx_.fillText('Pioche niv. ' + meta.pickaxeLevel, 16, 84);

        ctx_.fillStyle = 'rgba(0,0,0,0.45)';
        ctx_.fillRect(CANVAS_W - 320, 8, 312, 102);
        ctx_.fillStyle = '#aaa';
        ctx_.font = '12px system-ui';
        ctx_.fillText('Mur : pousser le bloc  |  [F] combat + pioche devant  |  [↓] sous les pieds  |  [1/G]…', CANVAS_W - 312, 22);
        ctx_.fillText('Déplac. : flèches ou WASD / ZQSD (AZERTY)', CANVAS_W - 312, 38);
        ctx_.fillText('[I] craft  [C] collection  [B] boutique  [Échap] fermer', CANVAS_W - 312, 54);
        ctx_.fillText('Goule = petit orc · Mutant = grand orc (tirs)', CANVAS_W - 312, 70);
        ctx_.fillText(
            'Mutants vaincus : ' +
                meta.mutantKills +
                (!meta.depthUnlocked ? ' / 2 (boutique « Descendre »)' : '  (sceau levé)'),
            CANVAS_W - 312,
            86
        );
        ctx_.restore();
    }

    /** Au-dessus des popups (boutique, craft…) : dessiné en dernier dans render(). */
    function drawScreenMessage(ctx_) {
        if (screenMessageTimer <= 0) return;
        screenMessageTimer--;
        ctx_.save();
        ctx_.fillStyle = 'rgba(0,0,0,0.88)';
        ctx_.strokeStyle = '#8899bb';
        ctx_.lineWidth = 2;
        const mw = Math.min(560, CANVAS_W - 40);
        const mx = (CANVAS_W - mw) / 2;
        const my = 96;
        const mh = 44;
        ctx_.fillRect(mx, my, mw, mh);
        ctx_.strokeRect(mx + 0.5, my + 0.5, mw - 1, mh - 1);
        ctx_.fillStyle = '#f5f5ff';
        ctx_.font = '15px system-ui,Segoe UI,sans-serif';
        ctx_.textAlign = 'center';
        ctx_.fillText(screenMessage, CANVAS_W / 2, my + 28);
        ctx_.textAlign = 'left';
        ctx_.restore();
    }

    function drawOverlayTitle(ctx_) {
        ctx_.fillStyle = 'rgba(10,14,39,0.92)';
        ctx_.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx_.fillStyle = '#ddeeff';
        ctx_.font = 'bold 36px system-ui';
        ctx_.textAlign = 'center';
        ctx_.fillText('Mine du Nain-Elfe', CANVAS_W / 2, 160);
        ctx_.font = '18px system-ui';
        ctx_.fillStyle = '#aaccee';
        ctx_.fillText('Creusez, collectez, craftez, combattez, enrichissez-vous.', CANVAS_W / 2, 210);
        ctx_.fillText('Choisissez une option ci-dessous (cliquez ou touche)', CANVAS_W / 2, 240);
        ctx_.fillStyle = '#446688';
        ctx_.fillRect(CANVAS_W / 2 - 120, 280, 240, 44);
        ctx_.fillRect(CANVAS_W / 2 - 120, 340, 240, 44);
        ctx_.fillStyle = '#fff';
        ctx_.font = '20px system-ui';
        ctx_.fillText('Nouvelle partie', CANVAS_W / 2, 310);
        ctx_.fillText('Continuer', CANVAS_W / 2, 370);
        ctx_.textAlign = 'left';
    }

    function drawOverlayGameOver(ctx_) {
        ctx_.fillStyle = 'rgba(20,10,10,0.88)';
        ctx_.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx_.fillStyle = '#ffaaaa';
        ctx_.font = 'bold 32px system-ui';
        ctx_.textAlign = 'center';
        ctx_.fillText('Fin de l\'aventure', CANVAS_W / 2, 200);
        ctx_.fillStyle = '#ccc';
        ctx_.font = '18px system-ui';
        ctx_.fillText('Profondeur max : ' + meta.maxDepthReached + '  |  Or : ' + meta.gold, CANVAS_W / 2, 250);
        ctx_.fillStyle = '#664444';
        ctx_.fillRect(CANVAS_W / 2 - 100, 300, 200, 40);
        ctx_.fillStyle = '#fff';
        ctx_.fillText('Menu (titre)', CANVAS_W / 2, 327);
        ctx_.textAlign = 'left';
    }

    function drawPanel(ctx_, title, lines, scroll, sel, selectable) {
        ctx_.fillStyle = 'rgba(8,12,28,0.92)';
        ctx_.fillRect(80, 40, CANVAS_W - 160, CANVAS_H - 100);
        ctx_.strokeStyle = '#556';
        ctx_.lineWidth = 2;
        ctx_.strokeRect(80, 40, CANVAS_W - 160, CANVAS_H - 100);
        ctx_.fillStyle = '#eef';
        ctx_.font = 'bold 22px system-ui';
        ctx_.fillText(title, 100, 78);
        ctx_.font = '15px system-ui';
        ctx_.fillStyle = '#aab';
        let y = 110 - scroll * 22;
        for (let i = 0; i < lines.length; i++) {
            if (y > 90 && y < CANVAS_H - 70) {
                if (selectable && i === sel) {
                    ctx_.fillStyle = 'rgba(80,100,160,0.5)';
                    ctx_.fillRect(95, y - 16, CANVAS_W - 210, 22);
                }
                ctx_.fillStyle = i === sel && selectable ? '#fff' : '#ccd';
                ctx_.fillText(lines[i], 100, y);
            }
            y += 22;
        }
        ctx_.fillStyle = '#668';
        ctx_.font = '13px system-ui';
        ctx_.fillText('Flèches / Entrée — Échap pour fermer', 100, CANVAS_H - 58);
    }

    function drawInvCraft(ctx_) {
        ctx_.fillStyle = 'rgba(8,12,28,0.92)';
        ctx_.fillRect(80, 40, CANVAS_W - 160, CANVAS_H - 100);
        ctx_.strokeStyle = '#556';
        ctx_.lineWidth = 2;
        ctx_.strokeRect(80, 40, CANVAS_W - 160, CANVAS_H - 100);
        ctx_.fillStyle = '#eef';
        ctx_.font = 'bold 22px system-ui';
        ctx_.fillText('Inventaire & artisanat', 100, 78);
        let y = 108;
        ctx_.font = '14px system-ui';
        ctx_.fillStyle = '#9ab';
        ctx_.fillText('Inventaire', 100, y);
        y += 24;
        ctx_.fillStyle = '#ccd';
        const keysSorted = Object.keys(meta.inventory).sort();
        let any = false;
        for (const k of keysSorted) {
            if (meta.inventory[k] > 0) {
                any = true;
                ctx_.fillText(k + ' : ' + meta.inventory[k], 110, y);
                y += 20;
            }
        }
        if (!any) {
            ctx_.fillText('(vide)', 110, y);
            y += 20;
        }
        y += 16;
        ctx_.fillStyle = '#9ab';
        ctx_.fillText('Recettes — Entrée ou Espace pour fabriquer — flèches ↑↓', 100, y);
        y += 26;
        for (let i = 0; i < MINE_RECIPES.length; i++) {
            const rec = MINE_RECIPES[i];
            const ok = recipeUnlocked(rec);
            const ing = Object.entries(rec.ingredients)
                .map(([k, v]) => k + ':' + v)
                .join(' ');
            if (i === selectedRecipeIndex) {
                ctx_.fillStyle = 'rgba(80,100,160,0.55)';
                ctx_.fillRect(95, y - 14, CANVAS_W - 210, 22);
            }
            ctx_.fillStyle = ok ? '#fff' : '#666';
            ctx_.fillText(
                (ok ? '' : '[verrouillé] ') + rec.name + '  ' + ing + ' → ' + rec.product.item + '×' + rec.product.qty,
                100,
                y
            );
            y += 22;
        }
        ctx_.fillStyle = '#668';
        ctx_.font = '13px system-ui';
        ctx_.fillText('Échap — fermer', 100, CANVAS_H - 58);
    }

    function drawCollection(ctx_) {
        const lines = ['Cartes de minerais rares :'];
        if (meta.collection.length === 0) lines.push('(aucune — extrayez cristal ou mythril)');
        for (const id of meta.collection) {
            const c = MINE_CARDS[id];
            lines.push(c ? '★ ' + c.title + ' — ' + c.desc : id);
        }
        drawPanel(ctx_, 'Collection', lines, 0, 0, false);
    }

    function drawShop(ctx_) {
        clampShopIndex();
        const avail = getShopList();
        const lines = avail.map((s) => {
            let t = s.name + ' — ' + s.price + ' or';
            if (s.desc) t += '  (' + s.desc + ')';
            if (s.requiresMutantKills) t += ' [mutants: ' + meta.mutantKills + '/' + s.requiresMutantKills + ']';
            return t;
        });
        if (lines.length === 0) lines.push('(Rien en vente.)');
        drawPanel(
            ctx_,
            'Boutique (Entrée ou Espace pour acheter)',
            lines,
            0,
            shopIndex,
            avail.length > 0
        );
    }

    function render() {
        ctx.fillStyle = '#0a0e27';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        if (gameState === STATE_TITLE) {
            drawOverlayTitle(ctx);
            return;
        }
        if (gameState === STATE_GAME_OVER) {
            drawWorld(ctx);
            drawPlayer(ctx);
            drawOverlayGameOver(ctx);
            return;
        }

        drawWorld(ctx);
        drawEnemies(ctx);
        drawPlayer(ctx);

        for (const p of particles) {
            ctx.save();
            ctx.globalAlpha = p.life / 35;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - camX - p.size / 2, p.y - camY - p.size / 2, p.size, p.size);
            ctx.restore();
        }
        for (const f of floatingTexts) {
            ctx.save();
            ctx.globalAlpha = f.life / 60;
            ctx.fillStyle = '#ffd700';
            ctx.font = '14px system-ui';
            ctx.fillText(f.text, f.x - camX, f.y - camY);
            ctx.restore();
        }

        drawHud(ctx);

        if (gameState === STATE_INV) drawInvCraft(ctx);
        else if (gameState === STATE_COLLECTION) drawCollection(ctx);
        else if (gameState === STATE_SHOP) drawShop(ctx);

        drawScreenMessage(ctx);
    }

    function tick(now) {
        if (!lastTime) lastTime = now;
        const dt = Math.min(40, now - lastTime);
        lastTime = now;

        if (gameState === STATE_PLAYING) {
            if (player.digCooldown > 0) player.digCooldown--;
            if (player.attackCooldown > 0) player.attackCooldown--;
            if (player.invuln > 0) player.invuln--;

            resolvePhysics();
            maybeSpawnEnemy();
            updateEnemies();
            updateParticles();
            updateCamera();

            if (keys['ArrowDown']) dig('down');
            if (keys['KeyF']) swingPickaxe();

            if (meta.hp <= 0) {
                meta.hp = 0;
                gameState = STATE_GAME_OVER;
                sounds.death();
                saveGame();
            }
        }

        render();
        requestAnimationFrame(tick);
    }

    function useConsumableFromKey(code) {
        if (code === 'Digit1' || code === 'Numpad1' || code === 'KeyG') useBomb();
        else if (code === 'Digit2' || code === 'Numpad2' || code === 'KeyV') useSpray();
        else if (code === 'Digit3' || code === 'Numpad3' || code === 'KeyH') useHeal();
    }

    window.addEventListener(
        'keydown',
        (e) => {
            keys[e.code] = true;

            const craftConfirm =
                e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space';

            if (gameState === STATE_INV && craftConfirm && !e.repeat) {
                e.preventDefault();
                e.stopImmediatePropagation();
                const rec = MINE_RECIPES[selectedRecipeIndex];
                if (rec) doCraftWithFeedback(rec);
                return;
            }
            if (
                gameState === STATE_SHOP &&
                (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') &&
                !e.repeat
            ) {
                e.preventDefault();
                e.stopImmediatePropagation();
                const shopList = getShopList();
                if (shopList.length > 0 && shopList[shopIndex]) applyShopItem(shopList[shopIndex]);
                return;
            }

            if (e.code === 'KeyI' || e.code === 'Tab') {
                if (gameState === STATE_PLAYING) {
                    e.preventDefault();
                    clearJumpKeys();
                    gameState = STATE_INV;
                    selectedRecipeIndex = 0;
                    canvas.focus();
                } else if (gameState === STATE_INV) {
                    e.preventDefault();
                    gameState = STATE_PLAYING;
                }
            }
            if (e.code === 'KeyC') {
                if (gameState === STATE_PLAYING) {
                    clearJumpKeys();
                    gameState = STATE_COLLECTION;
                } else if (gameState === STATE_COLLECTION) gameState = STATE_PLAYING;
            }
            if (e.code === 'KeyB') {
                if (gameState === STATE_PLAYING) {
                    clearJumpKeys();
                    gameState = STATE_SHOP;
                    shopIndex = 0;
                    canvas.focus();
                } else if (gameState === STATE_SHOP) gameState = STATE_PLAYING;
            }
            if (e.code === 'Escape') {
                if (gameState === STATE_INV || gameState === STATE_COLLECTION || gameState === STATE_SHOP) {
                    clearJumpKeys();
                    gameState = STATE_PLAYING;
                }
            }
            if (gameState === STATE_INV) {
                if (e.code === 'ArrowUp') {
                    e.preventDefault();
                    selectedRecipeIndex = Math.max(0, selectedRecipeIndex - 1);
                }
                if (e.code === 'ArrowDown') {
                    e.preventDefault();
                    selectedRecipeIndex = Math.min(MINE_RECIPES.length - 1, selectedRecipeIndex + 1);
                }
            }
            if (gameState === STATE_SHOP) {
                const shopList = getShopList();
                const maxI = Math.max(0, shopList.length - 1);
                if (e.code === 'ArrowUp') {
                    e.preventDefault();
                    shopIndex = Math.max(0, shopIndex - 1);
                }
                if (e.code === 'ArrowDown') {
                    e.preventDefault();
                    shopIndex = Math.min(maxI, shopIndex + 1);
                }
            }
            if (gameState === STATE_PLAYING && !e.repeat) {
                if (
                    e.code === 'Digit1' ||
                    e.code === 'Numpad1' ||
                    e.code === 'Digit2' ||
                    e.code === 'Numpad2' ||
                    e.code === 'Digit3' ||
                    e.code === 'Numpad3' ||
                    e.code === 'KeyG' ||
                    e.code === 'KeyV' ||
                    e.code === 'KeyH'
                ) {
                    e.preventDefault();
                    useConsumableFromKey(e.code);
                }
            }
            if (
                gameState === STATE_PLAYING &&
                (e.code === 'Space' ||
                    e.code === 'ArrowUp' ||
                    e.code === 'ArrowDown' ||
                    e.code === 'KeyW' ||
                    e.code === 'KeyZ' ||
                    e.code === 'KeyA' ||
                    e.code === 'KeyQ' ||
                    e.code === 'KeyS' ||
                    e.code === 'KeyD')
            ) {
                e.preventDefault();
            }
        },
        true
    );

    window.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });

    canvas.addEventListener('click', (ev) => {
        ensureAudio();
        const rect = canvas.getBoundingClientRect();
        const mx = ev.clientX - rect.left;
        const my = ev.clientY - rect.top;
        if (gameState === STATE_TITLE) {
            ensureAudio();
            if (mx > CANVAS_W / 2 - 120 && mx < CANVAS_W / 2 + 120) {
                if (my > 280 && my < 324) {
                    Object.assign(meta, {
                        gold: 0,
                        pickaxeLevel: 1,
                        maxHp: 100,
                        hp: 100,
                        inventory: {},
                        collection: [],
                        depthUnlocked: false,
                        invUpgrades: 0,
                        mutantKills: 0,
                        maxDepthReached: 0
                    });
                    resetRun();
                    gameState = STATE_PLAYING;
                    saveGame();
                }
                if (my > 340 && my < 384) {
                    loadSave();
                    if (meta.hp <= 0) meta.hp = Math.max(25, Math.floor(meta.maxHp * 0.5));
                    resetRun();
                    gameState = STATE_PLAYING;
                }
            }
        } else if (gameState === STATE_GAME_OVER) {
            if (mx > CANVAS_W / 2 - 100 && mx < CANVAS_W / 2 + 100 && my > 300 && my < 340) {
                gameState = STATE_TITLE;
            }
        }
    });

    function clearKeys() {
        for (const c in keys) keys[c] = false;
    }

    canvas.addEventListener('mousedown', () => canvas.focus());
    canvas.addEventListener('pointerdown', () => canvas.focus());
    window.addEventListener('blur', clearKeys);

    canvas.focus();
    loadMineKnightSprites();
    loadMineOrcSprites();
    requestAnimationFrame(tick);

    loadSave();
})();
