// La Vallée des Graines — game data: crops, products, buildings, shop, levels, objectives, creatures, badges.

// grow: seconds to grow without help. yield: [min, max] crops per harvest.
export const CROPS = {
  radis:      { name: 'Radis', seedName: 'Graines de radis', lvl: 1, price: 5, grow: 40, yield: [2, 3], sell: 6, xp: 4, shape: 'root', c1: '#e8406a', c2: '#fff0f0' },
  carotte:    { name: 'Carotte', seedName: 'Graines de carotte', lvl: 2, price: 10, grow: 75, yield: [2, 3], sell: 11, xp: 6, shape: 'carrot', c1: '#f08a24', c2: '#ffb868' },
  ble:        { name: 'Blé', seedName: 'Graines de blé', lvl: 4, price: 14, grow: 100, yield: [3, 4], sell: 9, xp: 8, shape: 'grain', c1: '#ecc448', c2: '#b08820' },
  patate:     { name: 'Pomme de terre', seedName: 'Plants de pomme de terre', lvl: 7, price: 18, grow: 120, yield: [3, 4], sell: 12, xp: 9, shape: 'root', c1: '#c89060', c2: '#f0d8b0' },
  tomate:     { name: 'Tomate', seedName: 'Graines de tomate', lvl: 10, price: 25, grow: 150, yield: [2, 4], sell: 20, xp: 12, shape: 'round', c1: '#e83828', c2: '#ff9080' },
  fraise:     { name: 'Fraise', seedName: 'Graines de fraise', lvl: 13, price: 35, grow: 200, yield: [3, 5], sell: 22, xp: 15, shape: 'berry', c1: '#e82848', c2: '#ffe070' },
  poivron:    { name: 'Poivron', seedName: 'Graines de poivron', lvl: 15, price: 40, grow: 220, yield: [2, 4], sell: 26, xp: 17, shape: 'round', c1: '#48a838', c2: '#a8e070' },
  mais:       { name: 'Maïs', seedName: 'Graines de maïs', lvl: 17, price: 45, grow: 240, yield: [2, 4], sell: 38, xp: 20, shape: 'cob', c1: '#f8d838', c2: '#78b838' },
  tournesol:  { name: 'Tournesol', seedName: 'Graines de tournesol', lvl: 21, price: 60, grow: 300, yield: [2, 3], sell: 55, xp: 26, shape: 'flower', c1: '#f8c820', c2: '#704020' },
  raisin:     { name: 'Raisin', seedName: 'Pépins de raisin', lvl: 25, price: 75, grow: 330, yield: [3, 5], sell: 40, xp: 30, shape: 'berry', c1: '#7038a0', c2: '#c090e0' },
  citrouille: { name: 'Citrouille', seedName: 'Graines de citrouille', lvl: 28, price: 90, grow: 420, yield: [1, 2], sell: 140, xp: 40, shape: 'pumpkin', c1: '#f07818', c2: '#b84e08' },
  pomme:      { name: 'Pomme', seedName: 'Pépins de pomme', lvl: 30, price: 120, grow: 480, yield: [3, 5], sell: 50, xp: 45, shape: 'apple', c1: '#d82838', c2: '#ff7080' },
  lavande:    { name: 'Lavande', seedName: 'Graines de lavande', lvl: 32, price: 110, grow: 450, yield: [2, 4], sell: 70, xp: 46, shape: 'flower', c1: '#9070d0', c2: '#5a8a40' },
  pasteque:   { name: 'Pastèque', seedName: 'Graines de pastèque', lvl: 37, price: 160, grow: 540, yield: [1, 2], sell: 220, xp: 58, shape: 'pumpkin', c1: '#3a9a40', c2: '#a8e070' },
  cerise:     { name: 'Cerise', seedName: 'Noyaux de cerise', lvl: 39, price: 180, grow: 560, yield: [4, 6], sell: 60, xp: 62, shape: 'berry', c1: '#b01830', c2: '#5a9a30' },
  ananas:     { name: 'Ananas', seedName: 'Couronne d’ananas', lvl: 43, price: 220, grow: 620, yield: [1, 2], sell: 300, xp: 72, shape: 'cob', c1: '#f0c030', c2: '#58a838' },
  cacao:      { name: 'Cacao', seedName: 'Fèves de cacao', lvl: 45, price: 260, grow: 680, yield: [2, 3], sell: 180, xp: 80, shape: 'pumpkin', c1: '#8a5a30', c2: '#c8905a' },
  melon:      { name: 'Melon arc-en-ciel', seedName: 'Graine de melon arc-en-ciel', rare: true, grow: 600, yield: [1, 2], sell: 320, xp: 80, shape: 'melon', c1: '#58c858', c2: '#f8f8f8' },
  lune:       { name: 'Fleur de lune', seedName: 'Graine de fleur de lune', rare: true, grow: 720, yield: [1, 3], sell: 260, xp: 90, shape: 'flower', c1: '#c8d8ff', c2: '#6878d8' },
  doree:      { name: 'Fruit d’or', seedName: 'Graine dorée', rare: true, grow: 900, yield: [1, 1], sell: 1200, xp: 250, shape: 'golden', c1: '#ffd830', c2: '#fff8b0' },
};

export const PRODUCTS = {
  farine:          { name: 'Farine', sell: 30, shape: 'sack', c1: '#f8f0e0', c2: '#b89868' },
  huile:           { name: 'Huile de tournesol', sell: 160, shape: 'bottle', c1: '#f8d030', c2: '#e8f0f0' },
  pain:            { name: 'Pain', sell: 65, shape: 'loaf', c1: '#d89040', c2: '#f0c070' },
  tarteFraise:     { name: 'Tarte aux fraises', sell: 170, shape: 'pie', c1: '#e83050', c2: '#e8b060' },
  tarteCitrouille: { name: 'Tarte à la citrouille', sell: 260, shape: 'pie', c1: '#f08020', c2: '#e8b060' },
  pizza:           { name: 'Pizza', sell: 340, shape: 'pizza', c1: '#e84028', c2: '#f8d070' },
  jusCarotte:      { name: 'Jus de carotte', sell: 60, shape: 'bottle', c1: '#f08a24', c2: '#e8f0f0' },
  sauce:           { name: 'Sauce tomate', sell: 85, shape: 'jar', c1: '#d82818', c2: '#f8f8f8' },
  confiture:       { name: 'Confiture de fraises', sell: 120, shape: 'jar', c1: '#c81838', c2: '#f8f8f8' },
  jusPomme:        { name: 'Jus de pomme', sell: 210, shape: 'bottle', c1: '#f0d050', c2: '#e8f0f0' },
  // from animals
  oeuf:            { name: 'Œuf', sell: 12, shape: 'egg', c1: '#fff4e0', c2: '#e8d4b0' },
  lait:            { name: 'Lait', sell: 30, shape: 'milk', c1: '#ffffff', c2: '#5a8ad8' },
  laitChevre:      { name: 'Lait de chèvre', sell: 40, shape: 'milk', c1: '#fffbea', c2: '#58a848' },
  laine:           { name: 'Laine', sell: 70, shape: 'wool', c1: '#f6f2ea', c2: '#d8d0c0' },
  miel:            { name: 'Miel', sell: 75, shape: 'jar', c1: '#f0a820', c2: '#fff4c8' },
  truffe:          { name: 'Truffe', sell: 280, shape: 'truffle', c1: '#4a3428', c2: '#7a5a48' },
  // from the Dairy and secret recipes
  fromage:         { name: 'Fromage', sell: 90, shape: 'cheese', c1: '#f8d860', c2: '#e0b030' },
  fromageChevre:   { name: 'Fromage de chèvre', sell: 120, shape: 'cheese', c1: '#fbf6e8', c2: '#d8ccb0' },
  yaourt:          { name: 'Yaourt au miel', sell: 150, shape: 'jar', c1: '#fff8f0', c2: '#f0a820' },
  glace:           { name: 'Glace à la fraise', sell: 130, shape: 'icecream', c1: '#f8a8c0', c2: '#e8b878' },
  crepes:          { name: 'Crêpes', sell: 110, shape: 'crepe', c1: '#f0c870', c2: '#c88a38' },
  gateau:          { name: 'Gâteau d’anniversaire', sell: 220, shape: 'cake', c1: '#fff0f4', c2: '#f06090' },
  painEpices:      { name: 'Pain d’épices', sell: 190, shape: 'loaf', c1: '#a86030', c2: '#d89850' },
  quiche:          { name: 'Quiche', sell: 300, shape: 'pie', c1: '#f8d860', c2: '#d8a050' },
  tartePommes:     { name: 'Tarte aux pommes', sell: 230, shape: 'pie', c1: '#e8c050', c2: '#d8a050' },
  omelette:        { name: 'Omelette aux truffes', sell: 560, shape: 'omelette', c1: '#f8d848', c2: '#4a3428' },
  // later recipes (levels 23 to 47)
  gratin:          { name: 'Gratin de pommes de terre', sell: 180, shape: 'pie', c1: '#f0d070', c2: '#c89040' },
  ratatouille:     { name: 'Ratatouille', sell: 240, shape: 'pie', c1: '#d84828', c2: '#58a838' },
  jusRaisin:       { name: 'Jus de raisin', sell: 170, shape: 'bottle', c1: '#7038a0', c2: '#e8f0f0' },
  tarteRaisin:     { name: 'Tarte au raisin', sell: 260, shape: 'pie', c1: '#7038a0', c2: '#e8b060' },
  siropLavande:    { name: 'Sirop de lavande', sell: 280, shape: 'jar', c1: '#9070d0', c2: '#f8f8f8' },
  jusPasteque:     { name: 'Jus de pastèque', sell: 300, shape: 'bottle', c1: '#e84050', c2: '#e8f0f0' },
  clafoutis:       { name: 'Clafoutis aux cerises', sell: 380, shape: 'pie', c1: '#b01830', c2: '#f0c070' },
  yaourtCerise:    { name: 'Yaourt à la cerise', sell: 260, shape: 'jar', c1: '#fff0f4', c2: '#b01830' },
  jusAnanas:       { name: 'Jus d’ananas', sell: 420, shape: 'bottle', c1: '#f8d040', c2: '#e8f0f0' },
  chocolatChaud:   { name: 'Chocolat chaud', sell: 420, shape: 'milk', c1: '#7a4a2a', c2: '#f0e0d0' },
  gateauChoco:     { name: 'Gâteau au chocolat', sell: 640, shape: 'cake', c1: '#5a3420', c2: '#8a5a38' },
};

export const RESOURCES = {
  bois:       { name: 'Bois', sell: 4, shape: 'log', c1: '#a86a38', c2: '#e0b070' },
  pierre:     { name: 'Pierre', sell: 4, shape: 'stone', c1: '#9a9aa8', c2: '#c8c8d0' },
  cristal:    { name: 'Cristal', sell: 120, shape: 'crystal', c1: '#78d8f8', c2: '#c088f8' },
  champignon: { name: 'Champignon', sell: 15, shape: 'mushroom', c1: '#d83830', c2: '#fff4e8' },
  baies:      { name: 'Baies sauvages', sell: 10, shape: 'berries', c1: '#6048c8', c2: '#9888f8' },
  coquillage: { name: 'Coquillage', sell: 18, shape: 'shell', c1: '#f8a8b8', c2: '#fff0e8' },
  engrais:    { name: 'Engrais', sell: 0, shape: 'bag', c1: '#58a838', c2: '#8a6038', desc: 'Double la récolte d’une plante. Choisis-le au moment de planter.' },
  gardon:     { name: 'Gardon', sell: 20, shape: 'fish', c1: '#b8c8d8', c2: '#e85040' },
  perche:     { name: 'Perche', sell: 35, shape: 'fish', c1: '#a0b850', c2: '#e8a030' },
  truite:     { name: 'Truite', sell: 55, shape: 'fish', c1: '#a8b8d0', c2: '#e878a0' },
  brochet:    { name: 'Brochet', sell: 95, shape: 'fish', c1: '#6a9050', c2: '#d8e0a0' },
  carpe:      { name: 'Carpe dorée', sell: 260, shape: 'fish', c1: '#f8c030', c2: '#f86020' },
};

export const ITEMS = {};
for (const [id, c] of Object.entries(CROPS)) {
  ITEMS[id] = { ...c, kind: 'crop' };
  ITEMS['graine:' + id] = { name: c.seedName, shape: 'packet', c1: c.c1, c2: c.c2, kind: 'seed', crop: id, sell: 0 };
}
for (const [id, p] of Object.entries(PRODUCTS)) ITEMS[id] = { ...p, kind: 'product' };
for (const [id, r] of Object.entries(RESOURCES)) ITEMS[id] = { ...r, kind: 'resource' };

// theme = which kind of word problem the building asks (see math.js).
export const RECIPES = {
  moulin: [
    { out: 'farine', in: { ble: 2 }, lvl: 9, theme: 'masse' },
    { out: 'huile', in: { tournesol: 2 }, lvl: 22, theme: 'contenance' },
  ],
  four: [
    { out: 'pain', in: { farine: 1 }, lvl: 16, theme: 'duree' },
    { out: 'crepes', in: { farine: 1, oeuf: 2 }, lvl: 16, theme: 'recette', secret: true, hint: 'Fines et rondes : de la farine… et beaucoup d’œufs.' },
    { out: 'gateau', in: { farine: 1, oeuf: 1, lait: 1 }, lvl: 16, theme: 'recette', secret: true, hint: 'Pour un anniversaire : farine, œuf, et quelque chose de blanc que donne la vache.' },
    { out: 'tartePommes', in: { farine: 1, pomme: 2 }, lvl: 16, theme: 'recette', secret: true, hint: 'Une tarte avec le fruit des pommiers.' },
    { out: 'painEpices', in: { farine: 1, miel: 1 }, lvl: 16, theme: 'masse', secret: true, hint: 'Un pain brun et sucré… les abeilles t’aideront.' },
    { out: 'quiche', in: { farine: 1, oeuf: 1, fromage: 1 }, lvl: 16, theme: 'recette', secret: true, hint: 'Une tarte salée avec un œuf et quelque chose qui vient de la Laiterie.' },
    { out: 'omelette', in: { oeuf: 2, truffe: 1 }, lvl: 16, theme: 'argent', secret: true, hint: 'Des œufs… et le trésor que le cochon déniche dans la forêt.' },
    { out: 'tarteRaisin', in: { farine: 1, raisin: 3 }, lvl: 25, theme: 'recette', secret: true, hint: 'Une tarte violette, avec les grappes de la vigne.' },
    { out: 'tarteFraise', in: { farine: 1, fraise: 3 }, lvl: 19, theme: 'recette' },
    { out: 'gratin', in: { patate: 3, fromage: 1 }, lvl: 23, theme: 'duree' },
    { out: 'tarteCitrouille', in: { farine: 1, citrouille: 1 }, lvl: 28, theme: 'recette' },
    { out: 'ratatouille', in: { poivron: 2, tomate: 2, huile: 1 }, lvl: 29, theme: 'recette' },
    { out: 'pizza', in: { farine: 1, tomate: 2, huile: 1 }, lvl: 33, theme: 'argent' },
    { out: 'clafoutis', in: { farine: 1, oeuf: 2, cerise: 3 }, lvl: 40, theme: 'recette' },
    { out: 'gateauChoco', in: { farine: 1, oeuf: 2, cacao: 2 }, lvl: 46, theme: 'recette' },
  ],
  laiterie: [
    { out: 'fromage', in: { lait: 2 }, lvl: 20, theme: 'contenance' },
    { out: 'fromageChevre', in: { laitChevre: 2 }, lvl: 20, theme: 'masse' },
    { out: 'yaourt', in: { lait: 1, miel: 1 }, lvl: 20, theme: 'contenance', secret: true, hint: 'Du lait et le trésor sucré des abeilles.' },
    { out: 'glace', in: { lait: 1, fraise: 2 }, lvl: 20, theme: 'recette', secret: true, hint: 'Froide et sucrée : du lait et des fruits rouges.' },
    { out: 'yaourtCerise', in: { lait: 1, cerise: 2 }, lvl: 41, theme: 'contenance' },
    { out: 'chocolatChaud', in: { lait: 1, cacao: 1 }, lvl: 45, theme: 'contenance', secret: true, hint: 'Une boisson chaude et brune : du lait et les fèves d’un arbre lointain.' },
  ],
  pressoir: [
    { out: 'jusCarotte', in: { carotte: 4 }, lvl: 26, theme: 'contenance' },
    { out: 'sauce', in: { tomate: 3 }, lvl: 26, theme: 'contenance' },
    { out: 'confiture', in: { fraise: 4 }, lvl: 26, theme: 'masse' },
    { out: 'jusRaisin', in: { raisin: 3 }, lvl: 27, theme: 'contenance' },
    { out: 'jusPomme', in: { pomme: 3 }, lvl: 30, theme: 'contenance' },
    { out: 'siropLavande', in: { lavande: 2, miel: 1 }, lvl: 32, theme: 'contenance', secret: true, hint: 'Un sirop qui sent bon : des fleurs violettes et le trésor des abeilles.' },
    { out: 'jusPasteque', in: { pasteque: 1 }, lvl: 37, theme: 'contenance' },
    { out: 'jusAnanas', in: { ananas: 1 }, lvl: 43, theme: 'contenance' },
  ],
};

export const BUILDINGS = {
  etable:   { name: 'Étable', lvl: 6, cost: { coins: 120, bois: 10, pierre: 4 }, desc: 'Une maison pour tes animaux, avec un enclos.' },
  moulin:   { name: 'Moulin', lvl: 9, cost: { coins: 150, bois: 8, pierre: 4 }, desc: 'Transforme le blé en farine.' },
  four:     { name: 'Boulangerie', lvl: 16, cost: { coins: 400, bois: 15, pierre: 12 }, desc: 'Cuit le pain, les tartes et les pizzas.' },
  laiterie: { name: 'Laiterie', lvl: 20, cost: { coins: 600, bois: 15, pierre: 10 }, desc: 'Transforme le lait en fromage… et cache des recettes secrètes.' },
  pressoir: { name: 'Pressoir', lvl: 26, cost: { coins: 800, bois: 20, pierre: 15 }, desc: 'Fait des jus, de la sauce et de la confiture.' },
  serre:    { name: 'Serre magique', lvl: 36, cost: { coins: 2500, bois: 30, pierre: 30, cristal: 5 }, desc: 'Toutes tes plantes poussent 50 % plus vite.' },
};

export const TOOLS = [
  { id: 'hache', name: 'Hache solide', lvl: 5, price: 100, desc: '+1 bois à chaque arbre coupé.' },
  { id: 'arrosoir', tier: 1, name: 'Arrosoir en cuivre', lvl: 5, price: 120, desc: 'Un arrosage fait gagner 50 % du temps restant (au lieu de 35 %).' },
  { id: 'bottes', name: 'Bottes de course', lvl: 8, price: 180, desc: 'Tu marches beaucoup plus vite.' },
  { id: 'pioche', name: 'Pioche solide', lvl: 8, price: 120, desc: '+1 pierre à chaque rocher cassé.' },
  { id: 'panier', name: 'Panier tressé', lvl: 11, price: 280, desc: '+1 légume à chaque récolte.' },
  { id: 'arrosoir', tier: 2, name: 'Arrosoir en argent', lvl: 15, price: 450, desc: 'Un arrosage fait gagner 65 % du temps restant.' },
  { id: 'epouvantail', name: 'Épouvantail', lvl: 17, price: 650, desc: 'Toutes les plantes poussent 20 % plus vite.' },
  { id: 'arrosoir', tier: 3, name: 'Arrosoir en or', lvl: 31, price: 1400, desc: 'Un arrosage fait gagner 80 % du temps restant.' },
  { id: 'arroseur', name: 'Arroseur automatique', lvl: 33, price: 1500, desc: 'Toutes les plantes poussent encore 30 % plus vite.' },
  { id: 'arrosoir', tier: 4, name: 'Arrosoir en diamant', lvl: 44, price: 4000, desc: 'Un arrosage fait gagner 90 % du temps restant.' },
];
export const WATER_FRAC = [0.35, 0.5, 0.65, 0.8, 0.9];

// Each purchase opens 2 more garden plots (4 at the start, 18 at most).
export const PLOT_BUYS = [
  { price: 40, lvl: 1 }, { price: 90, lvl: 3 }, { price: 160, lvl: 5 }, { price: 250, lvl: 8 },
  { price: 380, lvl: 12 }, { price: 520, lvl: 16 }, { price: 700, lvl: 21 },
];

export const HATS = {
  rouge:     { name: 'Casquette rouge', price: 0, lvl: 1, color: '#e03c3c' },
  bleu:      { name: 'Casquette bleue', price: 80, lvl: 2, color: '#3c74e0' },
  vert:      { name: 'Casquette verte', price: 80, lvl: 3, color: '#2fa04a' },
  jaune:     { name: 'Casquette jaune', price: 150, lvl: 7, color: '#f0c020' },
  orange:    { name: 'Casquette orange', price: 200, lvl: 10, color: '#f08a24' },
  violet:    { name: 'Casquette violette', price: 260, lvl: 19, color: '#8a48d0' },
  noir:      { name: 'Casquette ninja', price: 450, lvl: 24, color: '#30303c' },
  rose:      { name: 'Casquette rose', price: 450, lvl: 25, color: '#f06ab0' },
  turquoise: { name: 'Casquette turquoise', price: 600, lvl: 29, color: '#28b8b0' },
  marron:    { name: 'Casquette d’explorateur', price: 800, lvl: 35, color: '#8a5a30' },
  blanc:     { name: 'Casquette des neiges', price: 1000, lvl: 38, color: '#f4f6fa' },
  dore:      { name: 'Casquette en or', price: 2000, lvl: 40, color: '#ffc81e' },
  argent:    { name: 'Casquette en argent', price: 2500, lvl: 42, color: '#c8d0dc' },
  nuit:      { name: 'Casquette nuit étoilée', price: 3500, lvl: 47, color: '#1a2a6a' },
  diamant:   { name: 'Casquette en diamant', price: 6000, lvl: 50, color: '#a8f0ff' },
};

export const TITLES = [
  [1, 'Petite pousse'], [5, 'Apprenti jardinier'], [12, 'Jardinier'], [18, 'Fermier'], [25, 'Maître fermier'],
  [32, 'Gardien de la vallée'], [38, 'Sage des saisons'], [44, 'Légende verte'], [50, 'Esprit de la vallée'],
];
export const titleFor = (lvl) => TITLES.filter(([l]) => lvl >= l).pop()[1];
export const MAX_LVL = 50;
// XP for the next level: about 2 minutes of play at the start, about 30 minutes near level 50 (some 15 hours in all).
export const xpNeed = (lvl) => Math.round(((50 + 6 * lvl) * (1.5 + 0.72 * lvl)) / 10) * 10;
// Levels of the places to open in the valley.
export const GATE_LVL = { rock: 3, bridge: 12, guardian: 24, arbre: 34 };

export const GATES = [
  { lvl: 3, text: 'Tu peux casser le gros rocher de la forêt' },
  { lvl: 12, text: 'Tu peux réparer le pont du lac' },
  { lvl: 24, text: 'Le gardien de la montagne accepte ton défi' },
  { lvl: 34, text: 'Le Vieil Arbre de la forêt se réveille' },
];

// Creatures met in tall grass. zone: where they live. hp = right answers needed.
export const CREATURES = {
  lapinou:     { name: 'Lapinou', zone: 'ferme', hp: 2, body: '#f4ece4', acc: 'bunny', coins: 8, xp: 8, drops: [['graine:carotte', 0.5, 2]] },
  coccibulle:  { name: 'Coccibulle', zone: 'ferme', hp: 2, body: '#e83838', acc: 'ladybug', coins: 8, xp: 8, drops: [['graine:radis', 0.6, 3]] },
  glandou:     { name: 'Glandou', zone: 'foret', hp: 3, body: '#c88a48', acc: 'acorn', coins: 15, xp: 14, drops: [['bois', 0.6, 2], ['graine:ble', 0.4, 2]] },
  champinou:   { name: 'Champinou', zone: 'foret', hp: 3, body: '#f8f0e0', acc: 'mushroom', coins: 15, xp: 14, drops: [['champignon', 0.7, 2], ['graine:tomate', 0.3, 1]] },
  feuillette:  { name: 'Feuillette', zone: 'foret', hp: 3, body: '#70c850', acc: 'leaf', coins: 18, xp: 16, drops: [['graine:fraise', 0.4, 2], ['engrais', 0.3, 1]] },
  grenouillon: { name: 'Grenouillon', zone: 'lac', hp: 3, body: '#58b858', acc: 'frog', coins: 25, xp: 20, drops: [['graine:mais', 0.4, 1], ['coquillage', 0.5, 1]] },
  libellune:   { name: 'Libellune', zone: 'lac', hp: 3, body: '#68a8f8', acc: 'wings', coins: 28, xp: 22, drops: [['graine:melon', 0.08, 1], ['engrais', 0.4, 1]] },
  galetou:     { name: 'Galétou', zone: 'lac', hp: 4, body: '#a8a8b8', acc: 'crab', coins: 30, xp: 24, drops: [['pierre', 0.7, 3], ['coquillage', 0.4, 2]] },
  rocaille:    { name: 'Rocaille', zone: 'montagne', hp: 4, body: '#a09078', acc: 'rock', coins: 45, xp: 32, drops: [['pierre', 0.8, 4], ['cristal', 0.2, 1]] },
  floconnet:   { name: 'Floconnet', zone: 'montagne', hp: 4, body: '#f4f8ff', acc: 'fox', coins: 50, xp: 35, drops: [['graine:lune', 0.12, 1], ['engrais', 0.4, 2]] },
  cristallon:  { name: 'Cristallon', zone: 'montagne', hp: 5, body: '#a8e4f8', acc: 'crystal', coins: 120, xp: 80, rare: true, drops: [['cristal', 1, 2], ['graine:doree', 0.3, 1]] },
};
export const CREATURE_ORDER = Object.keys(CREATURES);

// Farm animals: caught in the wild, fed with crops, then they produce. foods: any one of these meals.
export const ANIMALS = {
  poule:    { name: 'Poule', lvl: 6, foods: [{ ble: 1 }, { mais: 1 }], out: 'oeuf', qty: [2, 3], prod: 60, xp: 4, names: ['Cocotte', 'Plume', 'Paprika', 'Coquette', 'Picorette'] },
  vache:    { name: 'Vache', lvl: 14, foods: [{ mais: 2 }, { ble: 3 }], out: 'lait', qty: [2, 3], prod: 120, xp: 8, names: ['Marguerite', 'Noisette', 'Caramel', 'Praline'] },
  chevre:   { name: 'Chèvre', lvl: 18, foods: [{ carotte: 2 }], out: 'laitChevre', qty: [2, 2], prod: 150, xp: 10, names: ['Biquette', 'Capucine', 'Blanchette'] },
  mouton:   { name: 'Mouton', lvl: 22, foods: [{ ble: 2 }, { mais: 1 }], out: 'laine', qty: [1, 2], prod: 220, xp: 12, names: ['Frisette', 'Nuage', 'Bouclette', 'Flocon'] },
  abeilles: { name: 'Ruche', lvl: 27, foods: [{ tournesol: 1 }], out: 'miel', qty: [2, 3], prod: 280, xp: 14, names: ['Reine Bzz', 'Reine Dorée', 'Reine Fleurette'] },
  cochon:   { name: 'Cochon', lvl: 31, foods: [{ citrouille: 1 }, { pomme: 2 }], out: 'truffe', qty: [1, 1], prod: 360, xp: 20, names: ['Rosette', 'Groin-Groin', 'Pistache'] },
};
// Each purchase gives 2 more places in the barn (4 at the start).
export const BARN_BUYS = [{ price: 200, lvl: 10 }, { price: 450, lvl: 18 }, { price: 900, lvl: 25 }];

// One-time treasure chests in the world.
export const CHESTS = {
  maison:  { coins: 30, items: { 'graine:carotte': 3 } },
  foret1:  { coins: 50, items: { 'graine:fraise': 3 } },
  foret2:  { coins: 40, items: { 'graine:tomate': 2, engrais: 2 } },
  secret:  { coins: 100, items: { 'graine:lune': 1 } },
  lac1:    { coins: 80, items: { bois: 5, pierre: 5 } },
  lac2:    { coins: 150, items: { 'graine:melon': 1 } },
  mont1:   { coins: 200, items: { 'graine:lune': 2 } },
  mont2:   { coins: 300, items: { 'graine:doree': 1 } },
};

export const CUSTOMERS = ['Mme Lapin', 'M. Hérisson', 'Léa', 'Le chef Marmotte', 'Tom le pêcheur', 'Mamie Rose', 'Zoé', 'M. Blaireau', 'La maîtresse', 'Le facteur'];

// Guided goals shown at the top of the screen, done in order. target = object to point at.
export const OBJECTIVES = [
  { id: 'intro', t: 'Parle à Mamie Rose, à côté de ta maison', c: (s) => s.flags.intro, target: 'mamie', r: { coins: 0, xp: 0 } },
  { id: 'plant', t: 'Plante tes 4 graines de radis dans le potager', c: (s) => s.stats.planted >= 4, target: 'plot', r: { coins: 10, xp: 10 } },
  { id: 'water', t: 'Arrose une plante en réussissant un calcul', c: (s) => s.stats.watered >= 1, target: 'plot', r: { coins: 5, xp: 5 } },
  { id: 'harvest', t: 'Récolte tes radis quand ils sont mûrs', c: (s) => s.stats.harvests >= 1, target: 'plot', r: { coins: 10, xp: 10 } },
  { id: 'sell', t: 'Vends des légumes dans la caisse devant ta maison', c: (s) => s.stats.sold >= 1, target: 'caisse', r: { coins: 10, xp: 10 } },
  { id: 'buy', t: 'Achète des graines à la Boutique du village (au nord)', c: (s) => s.stats.bought >= 1, target: 'shop', r: { coins: 15, xp: 15 } },
  { id: 'order', t: 'Livre une commande au tableau du village', c: (s) => s.stats.orders >= 1, target: 'board', r: { coins: 20, xp: 20 } },
  { id: 'rock', t: 'Atteins le niveau 3 et casse le gros rocher à l’ouest', c: (s) => s.flags.rock, target: 'bigrock', r: { coins: 30, xp: 30 } },
  { id: 'forest', t: 'Dans la forêt : coupe un arbre et casse une pierre', c: (s) => s.stats.bois > 0 && s.stats.pierre > 0, target: 'forest', r: { coins: 20, xp: 20 } },
  { id: 'etable', t: 'Construis l’Étable, à côté de ta maison (niveau 6)', c: (s) => s.built.etable, target: 'etable', r: { coins: 30, xp: 30 } },
  { id: 'catch', t: 'Attrape une poule : il y en a une à l’est de la ferme', c: (s) => (s.animals || []).length >= 1, target: 'wildpoule', r: { coins: 25, xp: 25 } },
  { id: 'feed', t: 'Nourris ta poule avec du blé (dans l’enclos ou l’Étable)', c: (s) => (s.stats.fed || 0) >= 1, target: 'etable', r: { coins: 15, xp: 15 } },
  { id: 'collect', t: 'Ramasse les œufs de ta poule', c: (s) => (s.stats.collected || 0) >= 1, target: 'etable', r: { coins: 20, xp: 20 } },
  { id: 'creature', t: 'Gagne un défi contre une créature des hautes herbes', c: (s) => Object.keys(s.creatures).length >= 1, r: { coins: 20, xp: 20 } },
  { id: 'moulin', t: 'Construis le Moulin au village (niveau 9)', c: (s) => s.built.moulin, target: 'moulin', r: { coins: 40, xp: 40 } },
  { id: 'farine', t: 'Fabrique ta première farine au Moulin', c: (s) => (s.stats.made.farine || 0) >= 1, target: 'moulin', r: { coins: 30, xp: 30 } },
  { id: 'bridge', t: 'Répare le pont du lac, à l’est de la ferme (niveau 12)', c: (s) => s.flags.bridge, target: 'brokenbridge', r: { coins: 50, xp: 50 } },
  { id: 'fish', t: 'Pêche un poisson au ponton du lac', c: (s) => s.stats.fish >= 1, target: 'fishspot', r: { coins: 30, xp: 30 } },
  { id: 'four', t: 'Construis la Boulangerie (niveau 16)', c: (s) => s.built.four, target: 'four', r: { coins: 60, xp: 60 } },
  { id: 'pain', t: 'Cuis ton premier pain', c: (s) => (s.stats.made.pain || 0) >= 1, target: 'four', r: { coins: 40, xp: 40 } },
  { id: 'secret', t: 'Invente une recette secrète à la Boulangerie (lis les indices !)', c: (s) => Object.keys(s.found || {}).length >= 1, target: 'four', r: { coins: 60, xp: 50 } },
  { id: 'laiterie', t: 'Construis la Laiterie au village (niveau 20)', c: (s) => s.built.laiterie, target: 'laiterie', r: { coins: 60, xp: 60 } },
  { id: 'fromage', t: 'Attrape une vache près du lac et fais du fromage', c: (s) => (s.stats.made.fromage || 0) >= 1, target: 'laiterie', r: { coins: 60, xp: 60 } },
  { id: 'gratin', t: 'Fais un gratin de pommes de terre à la Boulangerie (niveau 23)', c: (s) => (s.stats.made.gratin || 0) >= 1, target: 'four', r: { coins: 70, xp: 70 } },
  { id: 'guardian', t: 'Ouvre le passage de la montagne (niveau 24)', c: (s) => s.flags.guardian, target: 'guardian', r: { coins: 80, xp: 80 } },
  { id: 'cristal', t: 'Trouve un cristal dans la montagne', c: (s) => s.stats.cristal >= 1, target: 'crystal', r: { coins: 50, xp: 50 } },
  { id: 'pressoir', t: 'Construis le Pressoir (niveau 26)', c: (s) => s.built.pressoir, target: 'pressoir', r: { coins: 80, xp: 80 } },
  { id: 'ruche', t: 'Trouve l’essaim d’abeilles caché dans la forêt (niveau 27)', c: (s) => (s.animals || []).some((a) => a.kind === 'abeilles'), target: 'wildabeilles', r: { coins: 80, xp: 80 } },
  { id: 'jusRaisin', t: 'Fais du jus de raisin au Pressoir (niveau 27)', c: (s) => (s.stats.made.jusRaisin || 0) >= 1, target: 'pressoir', r: { coins: 90, xp: 90 } },
  { id: 'ratatouille', t: 'Cuis une ratatouille (niveau 29)', c: (s) => (s.stats.made.ratatouille || 0) >= 1, target: 'four', r: { coins: 100, xp: 100 } },
  { id: 'arbre', t: 'Offre 3 cristaux au Vieil Arbre de la forêt (niveau 34)', c: (s) => s.flags.arbre, target: 'ancient', r: { coins: 150, xp: 120 } },
  { id: 'serre', t: 'Construis la Serre magique (niveau 36)', c: (s) => s.built.serre, target: 'serre', r: { coins: 200, xp: 150 } },
  { id: 'pasteque', t: 'Récolte une pastèque (niveau 37)', c: (s) => (s.stats.harvested.pasteque || 0) >= 1, target: 'plot', r: { coins: 200, xp: 160 } },
  { id: 'clafoutis', t: 'Cuis un clafoutis aux cerises (niveau 40)', c: (s) => (s.stats.made.clafoutis || 0) >= 1, target: 'four', r: { coins: 250, xp: 180 } },
  { id: 'ananas', t: 'Fais un jus d’ananas au Pressoir (niveau 43)', c: (s) => (s.stats.made.jusAnanas || 0) >= 1, target: 'pressoir', r: { coins: 300, xp: 200 } },
  { id: 'chocolat', t: 'Cuis un gâteau au chocolat (niveau 46)', c: (s) => (s.stats.made.gateauChoco || 0) >= 1, target: 'four', r: { coins: 400, xp: 250 } },
  { id: 'doree', t: 'Récolte un Fruit d’or', c: (s) => (s.stats.harvested.doree || 0) >= 1, target: 'plot', r: { coins: 300, xp: 200 } },
  { id: 'recettes', t: 'Découvre les 8 recettes secrètes', c: (s) => Object.keys(s.found || {}).length >= 8, r: { coins: 400, xp: 250 } },
  { id: 'all', t: 'Deviens ami avec les 11 créatures', c: (s) => Object.keys(s.creatures).length >= 11, r: { coins: 500, xp: 300 } },
  { id: 'legend', t: 'Tu es une légende de la vallée ! Continue à cultiver et à calculer.', c: () => false, r: { coins: 0, xp: 0 } },
];
// The order of the first version, to carry old saves (which kept an index) over to objDone.
export const OLD_OBJECTIVE_ORDER = ['intro', 'plant', 'water', 'harvest', 'sell', 'buy', 'order', 'rock', 'forest', 'creature', 'moulin', 'farine', 'bridge', 'fish', 'four', 'pain', 'guardian', 'cristal', 'pressoir', 'arbre', 'serre', 'doree', 'all', 'legend'];

export const BADGES = [
  { id: 'pousse', name: 'Badge Pousse', desc: 'Faire ta première récolte', c: (s) => s.stats.harvests >= 1, color: '#62c048' },
  { id: 'bucheron', name: 'Badge Bûcheron', desc: 'Récolter 20 bois', c: (s) => s.stats.bois >= 20, color: '#b07038' },
  { id: 'meunier', name: 'Badge Meunier', desc: 'Faire 10 farines', c: (s) => (s.stats.made.farine || 0) >= 10, color: '#f0e0b8' },
  { id: 'explorateur', name: 'Badge Explorateur', desc: 'Te faire 5 amis créatures différents', c: (s) => Object.keys(s.creatures).length >= 5, color: '#58a8f0' },
  { id: 'eclair', name: 'Badge Éclair', desc: 'Faire une série de 15 bonnes réponses', c: (s) => s.stats.maxStreak >= 15, color: '#f8d030' },
  { id: 'mesure', name: 'Badge Mesure', desc: 'Réussir 30 problèmes de mesures', c: (s) => s.stats.measureOK >= 30, color: '#e85890' },
  { id: 'chef', name: 'Badge Chef', desc: 'Livrer 20 commandes', c: (s) => s.stats.orders >= 20, color: '#f08030' },
  { id: 'eleveur', name: 'Badge Éleveur', desc: 'Avoir 6 animaux à la ferme', c: (s) => (s.animals || []).length >= 6, color: '#c8803c' },
  { id: 'inventeur', name: 'Badge Inventeur', desc: 'Découvrir 4 recettes secrètes', c: (s) => Object.keys(s.found || {}).length >= 4, color: '#a060e0' },
  { id: 'hibou', name: 'Badge Hibou', desc: 'Réussir 5 révisions sans faute avec Maître Hibou', c: (s) => (s.stats.perfectReviews || 0) >= 5, color: '#a0703c' },
  { id: 'champion', name: 'Badge Champion', desc: 'Obtenir 3 étoiles à 10 défis de l’Hibou', c: (s) => Object.values(s.defis || {}).filter((v) => v >= 3).length >= 10, color: '#3c9ae0' },
  { id: 'legende', name: 'Badge Légende', desc: 'Récolter un Fruit d’or', c: (s) => (s.stats.harvested.doree || 0) >= 1, color: '#ffd700' },
];
