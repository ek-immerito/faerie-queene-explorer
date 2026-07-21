// Scholarly theme definitions for the Faerie Queene Explorer.
// Terms and phrases produce automatic textual matches. Add citations to
// `curated` when a passage belongs to a theme without using those words.
window.FQE_THEMES = [
  {
    id: 'virginity-chastity',
    name: 'Virginity and Chastity',
    description: 'Virginity, sexual continence, purity, maidenhood, and threatened or defended chastity.',
    terms: ['virgin', 'chaste', 'chastity', 'maiden', 'maid'],
    phrases: ['spotless maid', 'spotlesse maid', 'virgin knight'],
    exclude: [], curated: []
  },
  {
    id: 'marriage-betrothal',
    name: 'Marriage and Betrothal',
    description: 'Marriage, wedding ritual, betrothal, spouses, bridal identity, and the making or breaking of marital bonds.',
    terms: ['marriage', 'marry', 'wedding', 'wedlock', 'bride', 'bridegroom', 'husband', 'wife', 'spouse', 'betroth', 'divorce'],
    phrases: ['marriage bond', 'marriage bed', 'bridal chamber', 'holy wedlock'],
    exclude: [], curated: []
  },
  {
    id: 'queenship-sovereignty',
    name: 'Queenship and Sovereignty',
    description: 'Female sovereignty, monarchy, crowns, rule, dominion, succession, and Elizabethan royal representation.',
    terms: ['queen', 'queene', 'empress', 'crown', 'sceptre', 'throne', 'sovereign', 'soveraigne', 'majesty', 'dominion', 'Gloriana', 'Mercilla', 'Elizabeth'],
    phrases: ['Faerie Queene', 'royal throne', 'royall throne', 'imperial crown'],
    exclude: [], curated: []
  },
  {
    id: 'marian-imagery',
    name: 'Marian Imagery',
    description: 'Language and images associated with the Virgin Mary: virgin motherhood, heavenly queenship, lilies, roses, humility, and mediation.',
    terms: ['Mary', 'Madonna', 'virgin', 'mother', 'lily', 'rose', 'humility', 'intercession'],
    phrases: ['blessed virgin', 'virgin mother', 'queen of heaven', 'queene of heaven', 'mother of grace', 'spotless maid', 'spotlesse maid'],
    exclude: [], curated: []
  },
  {
    id: 'female-knighthood-agency',
    name: 'Female Knighthood and Agency',
    description: 'Women acting through combat, armor, disguise, command, rescue, resistance, and independent choice.',
    terms: ['Britomart', 'Radigund', 'Belphoebe', 'Belphœbe', 'Belphebe', 'Amazon', 'Amazonian', 'warriour', 'warrior', 'armor', 'armour'],
    phrases: ['female knight', 'maiden knight', 'mayden knight', 'martial maid', 'warlike maid'],
    exclude: [], curated: []
  },
  {
    id: 'desire-sexual-danger',
    name: 'Desire and Sexual Danger',
    description: 'Erotic desire, lust, seduction, pursuit, coercion, sexual threat, and resistance.',
    terms: ['desire', 'lust', 'lustful', 'lecher', 'lechery', 'seduce', 'rape', 'ravish', 'pursue', 'tempt', 'wanton'],
    phrases: ['fleshly lust', 'lawless lust', 'forced love', 'forbidden love', 'sexual desire'],
    exclude: [], curated: []
  },
  {
    id: 'appearance-deception',
    name: 'Appearance and Deception',
    description: 'Disguise, masks, counterfeit likeness, false seeming, enchantment, illusion, and failures of interpretation.',
    terms: ['disguise', 'mask', 'maske', 'seem', 'seeming', 'semblance', 'counterfeit', 'deceive', 'deceit', 'guile', 'illusion', 'enchant', 'falsehood'],
    phrases: ['false appearance', 'faire seeming', 'false semblance', 'under colour'],
    exclude: [], curated: []
  },
  {
    id: 'vision-mirrors-representation',
    name: 'Vision, Mirrors and Representation',
    description: 'Seeing and gazing, mirrors and images, dreams, spectacles, prophecy, and the interpretation of visual signs.',
    terms: ['see', 'sight', 'behold', 'gaze', 'look', 'mirror', 'glasse', 'image', 'picture', 'portrait', 'vision', 'dream', 'spectacle', 'prophecy'],
    phrases: ['looking glass', 'brazen mirror', 'false image', 'living image'],
    exclude: [], curated: []
  },
  {
    id: 'gardens-enclosure',
    name: 'Gardens and Enclosure',
    description: 'Gardens, bowers, enclosed spaces, fertility, temptation, cultivation, and artificial nature.',
    terms: ['garden', 'bower', 'orchard', 'arbour', 'grove', 'enclose', 'enclosure', 'fountain', 'flower', 'fruit', 'fertile'],
    phrases: ['Bower of Bliss', 'garden close', 'enclosed garden', 'pleasant bower'],
    exclude: [], curated: []
  },
  {
    id: 'blood-wounds-body',
    name: 'Blood, Wounds and the Body',
    description: 'Bloodshed, injury, bodily vulnerability, pain, healing, scars, and sacrificial or devotional bodies.',
    terms: ['blood', 'bloody', 'bleed', 'wound', 'wounded', 'body', 'bodie', 'flesh', 'limb', 'scar', 'pain', 'healing', 'heal'],
    phrases: ['mortal wound', 'bleeding wound', 'streaming blood', 'wounded body'],
    exclude: [], curated: []
  },
  {
    id: 'armor-shields-chivalry',
    name: 'Armor, Shields and Chivalry',
    description: 'Armor, shields, weapons, heraldry, mounted combat, tournaments, and the construction of knightly identity.',
    terms: ['armor', 'armour', 'shield', 'sword', 'spear', 'lance', 'helmet', 'helm', 'hauberk', 'knight', 'chivalry', 'joust', 'tournament', 'herald'],
    phrases: ['knightly arms', 'bloudy crosse', 'bloody cross', 'enchanted shield'],
    exclude: [], curated: []
  },
  {
    id: 'religion-grace-repentance',
    name: 'Religion, Grace and Repentance',
    description: 'Sin, faith, holiness, prayer, grace, repentance, conversion, despair, salvation, and redemption.',
    terms: ['sin', 'sinner', 'faith', 'holy', 'holiness', 'prayer', 'pray', 'grace', 'repent', 'repentance', 'despair', 'salvation', 'redeem', 'redemption', 'mercy'],
    phrases: ['heavenly grace', 'saving grace', 'House of Holiness', 'true faith'],
    exclude: [], curated: []
  },
  {
    id: 'justice-law-punishment',
    name: 'Justice, Law and Punishment',
    description: 'Law, trials, judgment, equity, vengeance, punishment, execution, and institutional authority.',
    terms: ['justice', 'law', 'legal', 'judge', 'judgment', 'doom', 'trial', 'equity', 'vengeance', 'punish', 'punishment', 'execute', 'sentence', 'guilt'],
    phrases: ['due justice', 'equal law', 'lawful doom', 'seat of judgment'],
    exclude: [], curated: []
  },
  {
    id: 'friendship-concord-discord',
    name: 'Friendship, Concord and Discord',
    description: 'Friendship, fellowship, reconciliation, rivalry, jealousy, concord, discord, and broken social bonds.',
    terms: ['friend', 'friendship', 'fellow', 'fellowship', 'concord', 'discord', 'rival', 'rivalry', 'jealous', 'jealousy', 'reconcile', 'enmity'],
    phrases: ['faithful friend', 'friendly love', 'perfect friendship', 'false friend'],
    exclude: [], curated: []
  },
  {
    id: 'courtesy-pastoral-society',
    name: 'Courtesy and Pastoral Society',
    description: 'Civility, hospitality, manners, courtliness, rustic life, shepherd culture, and court-pastoral contrasts.',
    terms: ['courtesy', 'courteous', 'civil', 'civility', 'hospitality', 'gentle', 'gentility', 'court', 'courtly', 'shepherd', 'shepheard', 'pastoral', 'rustic'],
    phrases: ['gentle knight', 'courtly grace', 'rude shepherd', 'pastoral song'],
    exclude: [], curated: []
  },
  {
    id: 'mutability-time-change',
    name: 'Mutability, Time and Change',
    description: 'Change, transformation, seasons, aging, decay, mortality, permanence, and the Mutabilitie Cantos.',
    terms: ['Mutability', 'Mutabilitie', 'change', 'transform', 'alter', 'time', 'season', 'age', 'decay', 'mortal', 'mortality', 'eternal', 'eternity'],
    phrases: ['all things change', 'course of time', 'Circle of the Seasons', 'ruins of time'],
    exclude: [], curated: []
  },
  {
    id: 'nation-empire-colonialism',
    name: 'Nation, Empire and Colonialism',
    description: 'Britain, Ireland, conquest, territory, empire, foreignness, governance, and colonial imagination.',
    terms: ['Britain', 'Britaine', 'British', 'Ireland', 'Irish', 'empire', 'imperial', 'conquest', 'conquer', 'colony', 'colonial', 'nation', 'realm', 'territory', 'foreign'],
    phrases: ['British land', 'Irish land', 'savage nation', 'foreign realm'],
    exclude: [], curated: []
  },
  {
    id: 'classical-mythology',
    name: 'Classical Mythology',
    description: 'Greco-Roman gods, heroes, myths, metamorphoses, and classical analogues.',
    terms: ['Jove', 'Jupiter', 'Venus', 'Mars', 'Diana', 'Phoebus', 'Apollo', 'Cupid', 'Neptune', 'Saturn', 'Pallas', 'Minerva', 'Proserpina', 'Hercules', 'Orpheus', 'Muse'],
    phrases: ['Olympian gods', 'classical gods', 'Pagan gods', 'nine Muses'],
    exclude: [], curated: []
  },
  {
    id: 'biblical-language-typology',
    name: 'Biblical Language and Typology',
    description: 'Scriptural persons, places, narratives, symbols, and typological parallels.',
    terms: ['Bible', 'Scripture', 'Gospel', 'Adam', 'Eve', 'Moses', 'David', 'Solomon', 'Christ', 'Israel', 'Jerusalem', 'Eden', 'serpent', 'apostle', 'prophet'],
    phrases: ['holy scripture', 'word of God', 'tree of life', 'promised land', 'New Testament', 'Old Testament'],
    exclude: [], curated: []
  }
];
