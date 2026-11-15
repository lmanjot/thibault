// La Vallée des Graines — game data: crops, products, buildings, shop, levels, objectives, creatures, badges.

// grow: seconds to grow without help. yield: [min, max] crops per harvest.
export const CROPS = {
  radis:      { name: 'Radis', seedName: 'Graines de radis', lvl: 1, price: 5, grow: 40, yield: [2, 3], sell: 6, xp: 4, shape: 'root', c1: '#e8406a', c2: '#fff0f0' },
  carotte:    { name: 'Carotte', seedName: 'Graines de carotte', lvl: 2, price: 10, grow: 75, yield: [2, 3], sell: 11, xp: 6, shape: 'carrot', c1: '#f08a24', c2: '#ffb868' },
  ble:        { name: 'Blé', seedName: 'Graines de blé', lvl: 3, price: 14, grow: 100, yield: [3, 4], sell: 9, xp: 8, shape: 'grain', c1: '#ecc448', c2: '#b08820' },
  tomate:     { name: 'Tomate', seedName: 'Graines de tomate', lvl: 5, price: 25, grow: 150, yield: [2, 4], sell: 20, xp: 12, shape: 'round', c1: '#e83828', c2: '#ff9080' },
  fraise:     { name: 'Fraise', seedName: 'Graines de fraise', lvl: 6, price: 35, grow: 200, yield: [3, 5], sell: 22, xp: 15, shape: 'berry', c1: '#e82848', c2: '#ffe070' },
  mais:       { name: 'Maïs', seedName: 'Graines de maïs', lvl: 8, price: 45, grow: 240, yield: [2, 4], sell: 38, xp: 20, shape: 'cob', c1: '#f8d838', c2: '#78b838' },
  tournesol:  { name: 'Tournesol', seedName: 'Graines de tournesol', lvl: 9, price: 60, grow: 300, yield: [2, 3], sell: 55, xp: 26, shape: 'flower', c1: '#f8c820', c2: '#704020' },
  citrouille: { name: 'Citrouille', seedName: 'Graines de citrouille', lvl: 11, price: 90, grow: 420, yield: [1, 2], sell: 140, xp: 40, shape: 'pumpkin', c1: '#f07818', c2: '#b84e08' },
  pomme:      { name: 'Pomme', seedName: 'Pépins de pomme', lvl: 12, price: 120, grow: 480, yield: [3, 5], sell: 50, xp: 45, shape: 'apple', c1: '#d82838', c2: '#ff7080' },
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
    { out: 'farine', in: { ble: 2 }, lvl: 4, theme: 'masse' },
    { out: 'huile', in: { tournesol: 2 }, lvl: 9, theme: 'contenance' },
  ],
  four: [
    { out: 'pain', in: { farine: 1 }, lvl: 7, theme: 'duree' },
    { out: 'tarteFraise', in: { farine: 1, fraise: 3 }, lvl: 8, theme: 'recette' },
    { out: 'tarteCitrouille', in: { farine: 1, citrouille: 1 }, lvl: 11, theme: 'recette' },
    { out: 'pizza', in: { farine: 1, tomate: 2, huile: 1 }, lvl: 13, theme: 'argent' },
  ],
  pressoir: [
    { out: 'jusCarotte', in: { carotte: 4 }, lvl: 10, theme: 'contenance' },
    { out: 'sauce', in: { tomate: 3 }, lvl: 10, theme: 'contenance' },
    { out: 'confiture', in: { fraise: 4 }, lvl: 10, theme: 'masse' },
    { out: 'jusPomme', in: { pomme: 3 }, lvl: 12, theme: 'contenance' },
  ],
};

export const BUILDINGS = {
  moulin:   { name: 'Moulin', lvl: 4, cost: { coins: 150, bois: 8, pierre: 4 }, desc: 'Transforme le blé en farine.' },
  four:     { name: 'Boulangerie', lvl: 7, cost: { coins: 400, bois: 15, pierre: 12 }, desc: 'Cuit le pain, les tartes et les pizzas.' },
  pressoir: { name: 'Pressoir', lvl: 10, cost: { coins: 800, bois: 20, pierre: 15 }, desc: 'Fait des jus, de la sauce et de la confiture.' },
  serre:    { name: 'Serre magique', lvl: 15, cost: { coins: 2500, bois: 30, pierre: 30, cristal: 5 }, desc: 'Toutes tes plantes poussent 50 % plus vite.' },
};

export const TOOLS = [
  { id: 'arrosoir', tier: 1, name: 'Arrosoir en cuivre', lvl: 3, price: 120, desc: 'Un arrosage fait gagner 50 % du temps restant (au lieu de 35 %).' },
  { id: 'hache', name: 'Hache solide', lvl: 3, price: 100, desc: '+1 bois à chaque arbre coupé.' },
  { id: 'bottes', name: 'Bottes de course', lvl: 4, price: 180, desc: 'Tu marches beaucoup plus vite.' },
  { id: 'pioche', name: 'Pioche solide', lvl: 4, price: 120, desc: '+1 pierre à chaque rocher cassé.' },
  { id: 'panier', name: 'Panier tressé', lvl: 5, price: 280, desc: '+1 légume à chaque récolte.' },
  { id: 'arrosoir', tier: 2, name: 'Arrosoir en argent', lvl: 7, price: 450, desc: 'Un arrosage fait gagner 65 % du temps restant.' },
  { id: 'epouvantail', name: 'Épouvantail', lvl: 8, price: 650, desc: 'Toutes les plantes poussent 20 % plus vite.' },
  { id: 'arrosoir', tier: 3, name: 'Arrosoir en or', lvl: 12, price: 1400, desc: 'Un arrosage fait gagner 80 % du temps restant.' },
  { id: 'arroseur', name: 'Arroseur automatique', lvl: 12, price: 1500, desc: 'Toutes les plantes poussent encore 30 % plus vite.' },
];
export const WATER_FRAC = [0.35, 0.5, 0.65, 0.8];

// Each purchase opens 2 more garden plots (4 at the start, 18 at most).
export const PLOT_BUYS = [
  { price: 40, lvl: 1 }, { price: 90, lvl: 2 }, { price: 160, lvl: 4 }, { price: 250, lvl: 6 },
  { price: 380, lvl: 8 }, { price: 520, lvl: 10 }, { price: 700, lvl: 13 },
];

export const HATS = {
  rouge:  { name: 'Casquette rouge', price: 0, lvl: 1, color: '#e03c3c' },
  bleu:   { name: 'Casquette bleue', price: 80, lvl: 2, color: '#3c74e0' },
  vert:   { name: 'Casquette verte', price: 80, lvl: 2, color: '#2fa04a' },
  jaune:  { name: 'Casquette jaune', price: 150, lvl: 4, color: '#f0c020' },
  violet: { name: 'Casquette violette', price: 260, lvl: 7, color: '#8a48d0' },
  noir:   { name: 'Casquette ninja', price: 450, lvl: 10, color: '#30303c' },
  rose:   { name: 'Casquette rose', price: 450, lvl: 10, color: '#f06ab0' },
  dore:   { name: 'Casquette en or', price: 2000, lvl: 16, color: '#ffc81e' },
};

export const TITLES = [
  [1, 'Petite pousse'], [3, 'Apprenti jardinier'], [6, 'Jardinier'], [10, 'Fermier'],
  [14, 'Maître fermier'], [18, 'Gardien de la vallée'], [22, 'Légende verte'],
];
export const titleFor = (lvl) => TITLES.filter(([l]) => lvl >= l).pop()[1];
export const MAX_LVL = 30;
export const xpNeed = (lvl) => 30 + 20 * (lvl - 1) + 6 * (lvl - 1) ** 2;

export const GATES = [
  { lvl: 3, text: 'Tu peux casser le gros rocher de la forêt' },
  { lvl: 6, text: 'Tu peux réparer le pont du lac' },
  { lvl: 10, text: 'Le gardien de la montagne accepte ton défi' },
  { lvl: 14, text: 'Le Vieil Arbre de la forêt se réveille' },
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

// Guided goals shown at the top of the screen. target = object to point at.
export const OBJECTIVES = [
  { t: 'Parle à Mamie Rose, à côté de ta maison', c: (s) => s.flags.intro, target: 'mamie', r: { coins: 0, xp: 0 } },
  { t: 'Plante tes 4 graines de radis dans le potager', c: (s) => s.stats.planted >= 4, target: 'plot', r: { coins: 10, xp: 10 } },
  { t: 'Arrose une plante en réussissant un calcul', c: (s) => s.stats.watered >= 1, target: 'plot', r: { coins: 5, xp: 5 } },
  { t: 'Récolte tes radis quand ils sont mûrs', c: (s) => s.stats.harvests >= 1, target: 'plot', r: { coins: 10, xp: 10 } },
  { t: 'Vends des légumes dans la caisse devant ta maison', c: (s) => s.stats.sold >= 1, target: 'caisse', r: { coins: 10, xp: 10 } },
  { t: 'Achète des graines à la Boutique du village (au nord)', c: (s) => s.stats.bought >= 1, target: 'shop', r: { coins: 15, xp: 15 } },
  { t: 'Livre une commande au tableau du village', c: (s) => s.stats.orders >= 1, target: 'board', r: { coins: 20, xp: 20 } },
  { t: 'Atteins le niveau 3 et casse le gros rocher à l’ouest', c: (s) => s.flags.rock, target: 'bigrock', r: { coins: 30, xp: 30 } },
  { t: 'Dans la forêt : coupe un arbre et casse une pierre', c: (s) => s.stats.bois > 0 && s.stats.pierre > 0, target: 'forest', r: { coins: 20, xp: 20 } },
  { t: 'Gagne un défi contre une créature des hautes herbes', c: (s) => Object.keys(s.creatures).length >= 1, r: { coins: 20, xp: 20 } },
  { t: 'Construis le Moulin au village (niveau 4)', c: (s) => s.built.moulin, target: 'moulin', r: { coins: 40, xp: 40 } },
  { t: 'Fabrique ta première farine au Moulin', c: (s) => (s.stats.made.farine || 0) >= 1, target: 'moulin', r: { coins: 30, xp: 30 } },
  { t: 'Répare le pont du lac, à l’est de la ferme (niveau 6)', c: (s) => s.flags.bridge, target: 'brokenbridge', r: { coins: 50, xp: 50 } },
  { t: 'Pêche un poisson au ponton du lac', c: (s) => s.stats.fish >= 1, target: 'fishspot', r: { coins: 30, xp: 30 } },
  { t: 'Construis la Boulangerie (niveau 7)', c: (s) => s.built.four, target: 'four', r: { coins: 60, xp: 60 } },
  { t: 'Cuis ton premier pain', c: (s) => (s.stats.made.pain || 0) >= 1, target: 'four', r: { coins: 40, xp: 40 } },
  { t: 'Ouvre le passage de la montagne (niveau 10)', c: (s) => s.flags.guardian, target: 'guardian', r: { coins: 80, xp: 80 } },
  { t: 'Trouve un cristal dans la montagne', c: (s) => s.stats.cristal >= 1, target: 'crystal', r: { coins: 50, xp: 50 } },
  { t: 'Construis le Pressoir (niveau 10)', c: (s) => s.built.pressoir, target: 'pressoir', r: { coins: 80, xp: 80 } },
  { t: 'Offre 3 cristaux au Vieil Arbre de la forêt (niveau 14)', c: (s) => s.flags.arbre, target: 'ancient', r: { coins: 150, xp: 120 } },
  { t: 'Construis la Serre magique (niveau 15)', c: (s) => s.built.serre, target: 'serre', r: { coins: 200, xp: 150 } },
  { t: 'Récolte un Fruit d’or', c: (s) => (s.stats.harvested.doree || 0) >= 1, target: 'plot', r: { coins: 300, xp: 200 } },
  { t: 'Deviens ami avec les 11 créatures', c: (s) => Object.keys(s.creatures).length >= 11, r: { coins: 500, xp: 300 } },
  { t: 'Tu es une légende de la vallée ! Continue à cultiver et à calculer.', c: () => false, r: { coins: 0, xp: 0 } },
];

export const BADGES = [
  { id: 'pousse', name: 'Badge Pousse', desc: 'Faire ta première récolte', c: (s) => s.stats.harvests >= 1, color: '#62c048' },
  { id: 'bucheron', name: 'Badge Bûcheron', desc: 'Récolter 20 bois', c: (s) => s.stats.bois >= 20, color: '#b07038' },
  { id: 'meunier', name: 'Badge Meunier', desc: 'Faire 10 farines', c: (s) => (s.stats.made.farine || 0) >= 10, color: '#f0e0b8' },
  { id: 'explorateur', name: 'Badge Explorateur', desc: 'Te faire 5 amis créatures différents', c: (s) => Object.keys(s.creatures).length >= 5, color: '#58a8f0' },
  { id: 'eclair', name: 'Badge Éclair', desc: 'Faire une série de 15 bonnes réponses', c: (s) => s.stats.maxStreak >= 15, color: '#f8d030' },
  { id: 'mesure', name: 'Badge Mesure', desc: 'Réussir 30 problèmes de mesures', c: (s) => s.stats.measureOK >= 30, color: '#e85890' },
  { id: 'chef', name: 'Badge Chef', desc: 'Livrer 20 commandes', c: (s) => s.stats.orders >= 20, color: '#f08030' },
  { id: 'legende', name: 'Badge Légende', desc: 'Récolter un Fruit d’or', c: (s) => (s.stats.harvested.doree || 0) >= 1, color: '#ffd700' },
];
