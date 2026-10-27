const HASH_MAP = {
  'bricksmack': 'bricksmack',
  'brick': 'bricksmack',
  'buildmeariver': 'buildmeariver',
  'river': 'buildmeariver',
  'slippedmymind': 'slippedmymind',
  'mind': 'slippedmymind',
  'battleship': 'battleship',
  'wordwager': 'wordwager',
  'word': 'wordwager',
  'connect4': 'connect4'
};

export function resolveGame(hash) { const key = String(hash).replace(/^#/, '').toLowerCase().trim(); return Object.hasOwn(HASH_MAP,key) ? HASH_MAP[key] : null; }
