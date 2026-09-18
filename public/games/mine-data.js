/* eslint-disable no-unused-vars */
// Données du jeu : tuiles, recettes, boutique, cartes de collection

const MINE_TILE = {
    AIR: 0,
    DIRT: 1,
    STONE: 2,
    STONE_HARD: 3,
    ORE_COPPER: 4,
    ORE_IRON: 5,
    ORE_SILVER: 6,
    ORE_GOLD: 7,
    ORE_CRYSTAL: 8,
    ORE_MYTHRIL: 9,
    BARRIER: 10,
    BEDROCK: 11,
    CAVERN_MARKER: 12
};

/** @type {Record<number, { name: string, color: string, glow?: string, hardness: number, minPick: number, drop?: string | null, rareCard?: string }>} */
const MINE_TILE_DEFS = {
    [MINE_TILE.AIR]: { name: 'Vide', color: '#0a0e27', hardness: 0, minPick: 0, drop: null },
    [MINE_TILE.DIRT]: { name: 'Terre', color: '#4a3528', hardness: 2, minPick: 1, drop: null },
    [MINE_TILE.STONE]: { name: 'Pierre', color: '#3d4555', hardness: 3, minPick: 1, drop: null },
    [MINE_TILE.STONE_HARD]: { name: 'Roc dur', color: '#2a3040', hardness: 7, minPick: 2, drop: null },
    [MINE_TILE.ORE_COPPER]: { name: 'Cuivre', color: '#b87333', glow: '#ffaa66', hardness: 3, minPick: 1, drop: 'ore_copper' },
    [MINE_TILE.ORE_IRON]: { name: 'Fer', color: '#6b7a8a', glow: '#aabbcc', hardness: 5, minPick: 1, drop: 'ore_iron' },
    [MINE_TILE.ORE_SILVER]: { name: 'Argent', color: '#c0c0d8', glow: '#eef8ff', hardness: 5, minPick: 1, drop: 'ore_silver' },
    [MINE_TILE.ORE_GOLD]: { name: 'Or brut', color: '#c9a227', glow: '#ffe066', hardness: 6, minPick: 2, drop: 'ore_gold' },
    [MINE_TILE.ORE_CRYSTAL]: { name: 'Cristal des abysses', color: '#6644cc', glow: '#aa88ff', hardness: 7, minPick: 2, drop: 'ore_crystal', rareCard: 'crystal' },
    [MINE_TILE.ORE_MYTHRIL]: { name: 'Mythril', color: '#44aacc', glow: '#66eeff', hardness: 10, minPick: 3, drop: 'ore_mythril', rareCard: 'mythril' },
    [MINE_TILE.BARRIER]: { name: 'Scellé', color: '#1a1525', glow: '#442266', hardness: 999, minPick: 99, drop: null },
    [MINE_TILE.BEDROCK]: { name: 'Roche mère', color: '#111018', hardness: 9999, minPick: 99, drop: null },
    [MINE_TILE.CAVERN_MARKER]: { name: 'Caverne', color: '#0a0e27', hardness: 0, minPick: 0, drop: null }
};

const MINE_CARDS = {
    crystal: { title: 'Cristal des abysses', desc: 'Résonne d\'une magie ancienne.', color: '#aa88ff' },
    mythril: { title: 'Lingot mythril', desc: 'Métal légendaire des mines profondes.', color: '#66eeff' }
};

/**
 * id, ingredients, product { item, qty }, unlock: { minDepth?, killMutants?, itemDiscovered? }
 */
const MINE_RECIPES = [
    {
        id: 'bomb',
        name: 'Bombe minière',
        ingredients: { ore_iron: 2, ore_copper: 3 },
        product: { item: 'bomb', qty: 1 },
        unlock: { minDepth: 12 }
    },
    {
        id: 'spray',
        name: 'Fiole pulvérisante',
        ingredients: { ore_crystal: 1, ore_copper: 2 },
        product: { item: 'spray', qty: 1 },
        unlock: { itemDiscovered: 'ore_crystal' }
    },
    {
        id: 'heal_salve',
        name: 'Baume de soin',
        ingredients: { ore_silver: 2, ore_gold: 1 },
        product: { item: 'heal_salve', qty: 1 },
        unlock: { minDepth: 25 }
    }
];

const MINE_SHOP = [
    { id: 'pickaxe2', name: 'Pioche renforcée (niv. 2)', price: 22, desc: 'Perce le roc dur.', once: true, requiresPick: 1 },
    { id: 'pickaxe3', name: 'Pioche mythique (niv. 3)', price: 62, desc: 'Frappe le mythril.', once: true, requiresPick: 2 },
    { id: 'hp_up', name: '+20 PV max', price: 18, desc: 'Endurance souterraine.', once: false },
    { id: 'inv_up', name: '+4 emplacements', price: 30, desc: 'Sac à dos élargi.', once: false, maxStacks: 3 },
    { id: 'unlock_depth', name: 'Descendre (veine profonde)', price: 36, desc: 'Dissout le sceau. Requiert 2 mutants (grands orcs) vaincus, pas les goules.', once: true, requiresMutantKills: 2 }
];

const MINE_LAYER_NAMES = [
    { maxY: 38, name: 'Surface' },
    { maxY: 72, name: 'Veine d\'argent' },
    { maxY: 999, name: 'Abîme' }
];

function mineLayerNameForDepth(tileY) {
    for (const L of MINE_LAYER_NAMES) {
        if (tileY < L.maxY) return L.name;
    }
    return MINE_LAYER_NAMES[MINE_LAYER_NAMES.length - 1].name;
}
