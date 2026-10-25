/**
 * Multilingual categorized word dictionary and generator for skribbl.io clone
 */

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English 🇬🇧' },
  { code: 'es', name: 'Español 🇪🇸' },
  { code: 'fr', name: 'Français 🇫🇷' },
  { code: 'de', name: 'Deutsch 🇩🇪' },
  { code: 'hi', name: 'हिन्दी 🇮🇳' }
];

export const WORD_CATEGORIES = {
  all: 'All Categories',
  animals: 'Animals & Nature',
  food: 'Food & Drinks',
  objects: 'Everyday Objects',
  actions: 'Actions & Verbs',
  places: 'Places & Landmarks',
  fantasy: 'Gaming & Fantasy'
};

export const MULTILINGUAL_WORDS = {
  en: {
    animals: [
      'elephant', 'giraffe', 'penguin', 'kangaroo', 'octopus', 'dolphin', 'hamster',
      'cheetah', 'butterfly', 'hedgehog', 'chameleon', 'flamingo', 'squirrel', 'koala',
      'panda', 'sloth', 'crocodile', 'platypus', 'seagull', 'peacock', 'walrus',
      'jellyfish', 'lobster', 'mosquito', 'ladybug', 'grasshopper', 'rhinoceros',
      'zebra', 'hippo', 'badger', 'gorilla', 'owl', 'bat', 'tiger', 'whale', 'lion'
    ],
    food: [
      'pizza', 'hamburger', 'sushi', 'pancake', 'spaghetti', 'ice cream', 'taco',
      'croissant', 'doughnut', 'watermelon', 'pineapple', 'burrito', 'avocado',
      'sandwich', 'cookie', 'popcorn', 'muffin', 'waffle', 'cupcake', 'bagel',
      'pretzel', 'chocolate', 'strawberry', 'banana', 'hot dog', 'french fries',
      'ramen', 'cheesecake', 'dumpling', 'lollipop', 'marshmallow', 'bacon', 'noodle'
    ],
    objects: [
      'umbrella', 'telescope', 'skateboard', 'guitar', 'headphone', 'clock',
      'flashlight', 'backpack', 'teapot', 'scissors', 'compass', 'parachute',
      'binoculars', 'camera', 'microscope', 'toaster', 'battery', 'sunglasses',
      'anchor', 'balloon', 'candlestick', 'trophy', 'envelope', 'hammer',
      'ladder', 'magnet', 'padlock', 'wrench', 'paintbrush', 'wheelbarrow'
    ],
    actions: [
      'swimming', 'dancing', 'fishing', 'skateboarding', 'skydiving', 'juggling',
      'cooking', 'painting', 'sleeping', 'reading', 'cycling', 'camping',
      'singing', 'flying', 'climbing', 'running', 'yawning', 'laughing',
      'sneezing', 'exercising', 'surfing', 'skiing', 'gardening', 'bowling'
    ],
    places: [
      'volcano', 'pyramid', 'lighthouse', 'desert', 'waterfall', 'island',
      'skyscraper', 'forest', 'igloo', 'hospital', 'library', 'castle',
      'bridge', 'airport', 'submarine', 'windmill', 'cemetery', 'stadium',
      'museum', 'cave', 'carnival', 'supermarket', 'space station', 'factory'
    ],
    fantasy: [
      'dragon', 'wizard', 'potion', 'spaceship', 'robot', 'alien', 'treasure',
      'sword', 'portal', 'superhero', 'vampire', 'mermaid', 'ghost', 'zombie',
      'unicorn', 'phoenix', 'genie', 'magic wand', 'monster', 'cyborg', 'time machine'
    ]
  },
  es: {
    animals: ['elefante', 'jirafa', 'pinguino', 'canguro', 'pulpo', 'delfin', 'mariposa', 'flamenco', 'panda', 'cocodrilo', 'leopardo', 'tigre', 'ballena', 'leon'],
    food: ['pizza', 'hamburguesa', 'sushi', 'helado', 'taco', 'sandia', 'chocolate', 'fresa', 'platano', 'galleta', 'empanada', 'queso'],
    objects: ['paraguas', 'telescopio', 'patineta', 'guitarra', 'reloj', 'mochila', 'tijeras', 'brujula', 'camara', 'globo', 'martillo', 'candado'],
    actions: ['nadar', 'bailar', 'pescar', 'cocinar', 'pintar', 'dormir', 'leer', 'volar', 'cantar', 'correr'],
    places: ['volcan', 'piramide', 'faro', 'desierto', 'cascada', 'isla', 'castillo', 'puente', 'aeropuerto', 'estadio'],
    fantasy: ['dragon', 'mago', 'pocion', 'cohete', 'robot', 'extraterrestre', 'tesoro', 'espada', 'superheroe', 'fantasma']
  },
  fr: {
    animals: ['elephant', 'girafe', 'pingouin', 'kangourou', 'pieuvre', 'dauphin', 'papillon', 'flamant', 'panda', 'crocodile', 'tigre', 'baleine', 'lion'],
    food: ['pizza', 'croissant', 'crepe', 'glace', 'chocolat', 'baguette', 'fromage', 'fraise', 'banane', 'biscuit'],
    objects: ['parapluie', 'telescope', 'guitare', 'horloge', 'sac a dos', 'ciseaux', 'appareil photo', 'ballon', 'marteau'],
    actions: ['nager', 'danser', 'pecher', 'cuisiner', 'peindre', 'dormir', 'lire', 'voler', 'chanter', 'courir'],
    places: ['volcan', 'pyramide', 'phare', 'desert', 'cascade', 'ile', 'chateau', 'pont', 'aeroport', 'musee'],
    fantasy: ['dragon', 'sorcier', 'potion', 'vaisseau', 'robot', 'extraterrestre', 'tresor', 'epee', 'fantome']
  },
  de: {
    animals: ['Elefant', 'Giraffe', 'Pinguin', 'Kanguru', 'Krake', 'Delfin', 'Schmetterling', 'Flamingo', 'Panda', 'Krokodil', 'Tiger', 'Wal', 'Lowe'],
    food: ['Pizza', 'Hamburger', 'Sushi', 'Eis', 'Brezel', 'Kuchen', 'Schokolade', 'Erdbeere', 'Banane', 'Brot', 'Kase'],
    objects: ['Regenschirm', 'Teleskop', 'Gitarre', 'Uhr', 'Rucksack', 'Schere', 'Kamera', 'Ballon', 'Hammer'],
    actions: ['schwimmen', 'tanzen', 'angeln', 'kochen', 'malen', 'schlafen', 'lesen', 'fliegen', 'singen', 'laufen'],
    places: ['Vulkan', 'Pyramide', 'Leuchtturm', 'Wuste', 'Wasserfall', 'Insel', 'Schloss', 'Brucke', 'Flughafen'],
    fantasy: ['Drache', 'Zauberer', 'Zaubertrank', 'Roboter', 'Alien', 'Schatz', 'Schwert', 'Superheld', 'Geist']
  },
  hi: {
    animals: ['haathi', 'sher', 'cheetah', 'machhli', 'mor', 'titli', 'bandar', 'kutta', 'billi', 'bhaloo', 'ghoda', 'oot'],
    food: ['samosa', 'jalebi', 'ladoo', 'roti', 'chai', 'mithai', 'aam', 'kela', 'seb', 'pani puri', 'pizza'],
    objects: ['chhatri', 'ghadi', 'kalam', 'kitaab', 'gadi', 'chashma', 'tala', 'hathoda', 'joota', 'patang'],
    actions: ['nachna', 'tairna', 'padhna', 'sona', 'khana', 'daudna', 'gana', 'udna', 'hasna'],
    places: ['mandir', 'taj mahal', 'qila', 'samundar', 'pahad', 'jangal', 'school', 'hospital'],
    fantasy: ['jadugar', 'rakshas', 'bhut', 'khazana', 'talwar', 'superhero', 'udankhatola', 'robot']
  }
};

const COMBINATION_ADJECTIVES = [
  'flying', 'dancing', 'giant', 'electric', 'golden', 'magical', 'sleeping',
  'space', 'rainbow', 'robot', 'tiny', 'singing', 'happy', 'fire', 'ninja'
];

/**
 * Normalizes input string for fair matching (lowercase, trim, collapse spaces, remove accents)
 * @param {string} str 
 * @returns {string}
 */
export function normalizeWord(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics/accents
    .replace(/[^\w\s]/g, '')        // remove special symbols except spaces
    .replace(/\s+/g, ' ')          // collapse multiple spaces
    .trim();
}

/**
 * Returns random words based on settings
 * @param {number} count 
 * @param {string} category 
 * @param {string[]} customWords 
 * @param {string} lang 
 * @param {string} mode 
 * @param {boolean} customWordsOnly 
 * @returns {string[]}
 */
export function getRandomWords(count = 3, category = 'all', customWords = [], lang = 'en', mode = 'normal', customWordsOnly = false) {
  const langPack = MULTILINGUAL_WORDS[lang] || MULTILINGUAL_WORDS.en;
  let pool = [];

  if (category && category !== 'all' && langPack[category]) {
    pool = [...langPack[category]];
  } else {
    pool = Object.values(langPack).flat();
  }

  // 1. If customWordsOnly is true and custom words exist, use only custom words
  if (customWordsOnly && customWords && customWords.length > 0) {
    const shuffled = [...customWords].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  // 2. If custom words exist and not exclusive, mix them into the general pool
  if (customWords && customWords.length > 0) {
    pool = [...pool, ...customWords];
  }

  // Handle Combination Mode (e.g., "flying pizza", "golden dragon")
  if (mode === 'combination') {
    const combinations = [];
    const baseWords = pool.length > 0 ? pool : Object.values(MULTILINGUAL_WORDS.en).flat();
    for (let i = 0; i < count; i++) {
      const adj = COMBINATION_ADJECTIVES[Math.floor(Math.random() * COMBINATION_ADJECTIVES.length)];
      const noun = baseWords[Math.floor(Math.random() * baseWords.length)];
      combinations.push(`${adj} ${noun}`);
    }
    return combinations;
  }

  // Fallback if pool is small
  if (pool.length < count) {
    pool = [...new Set([...pool, ...Object.values(MULTILINGUAL_WORDS.en).flat()])];
  }

  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Clean and parse custom word list from host
 * @param {string} input 
 * @returns {string[]}
 */
export function parseCustomWords(input) {
  if (!input || typeof input !== 'string') return [];
  return input
    .split(',')
    .map(w => normalizeWord(w))
    .filter(w => w.length >= 2 && w.length <= 35);
}
