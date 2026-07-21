/*
 * Creates a flat, offline-friendly line index from Project Gutenberg's
 * Spenser's Faerie Queene, Vol. I (#70717) and Vol. II (#72698).
 *
 * Each item has: book, canto, stanza, lineNumber, text.
 * Canto 0 represents a book's proem. The poem's two surviving Book VII
 * cantos are deliberately excluded; the Explorer currently covers I–VI.
 */
const fs = require('fs');

const sources = ['gutenberg-vol-1.txt', 'gutenberg-vol-2.txt'];
const romanAtLineEnd = /^(\s{4,})(.+?)\s{8,}([ivxlcdm]+)\s*$/i;

function romanToInt(value) {
  const values = { i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000 };
  return value.toLowerCase().split('').reduceRight((total, char, index, chars) => {
    const current = values[char];
    const right = values[chars[index + 1]] || 0;
    return current < right ? total - current : total + current;
  }, 0);
}

function clean(text) {
  return text
    .replace(/\[\d+\]/g, '')             // editorial footnote anchors
    .replace(/[_*]/g, '')                 // Gutenberg emphasis markers
    .replace(/\s+/g, ' ')
    .trim();
}

function isVerseLine(line) {
  return /^\s{4,}\S/.test(line) && !/^\s{4,}\[/.test(line);
}

function collectStanzas(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const stanzas = [];
  let current = null;

  for (const rawLine of lines) {
    const marker = rawLine.match(romanAtLineEnd);
    if (marker) {
      if (current) stanzas.push(current);
      current = { printed: romanToInt(marker[3]), lines: [clean(marker[2])] };
      continue;
    }

    if (!current) continue;
    if (rawLine.trim() === '') continue;
    if (isVerseLine(rawLine)) current.lines.push(clean(rawLine));
  }
  if (current) stanzas.push(current);
  return stanzas.filter((stanza) => stanza.lines.length >= 8 && stanza.lines.length <= 10);
}

function parse() {
  const sourceTexts = sources.map((file) => fs.readFileSync(file, 'utf8'));
  const stanzas = sourceTexts.flatMap((text) => collectStanzas(text));
  const records = [];
  let book = 1;
  let canto = 0;
  let previousPrinted = 0;
  let sawCanto = false;

  for (const stanza of stanzas) {
    // Gutenberg #70717 repeats "lxiv" after stanza lxxiii in II.x.
    // The sequence and the 1909 Smith edition make clear that this is lxxiv.
    const printed = book === 2 && canto === 10 && previousPrinted === 73 && stanza.printed === 64
      ? 74
      : stanza.printed;

    // A printed 'i' begins a fresh canto or proem. After Canto XII, the
    // first reset is the next book's proem and the second begins Canto I.
    if (printed === 1 && previousPrinted > 0) {
      if (canto === 12) {
        book += 1;
        canto = 0;
        sawCanto = false;
      } else if (canto === 0 || sawCanto) {
        canto += 1;
        sawCanto = true;
      }
    } else if (previousPrinted === 0) {
      canto = 0; // the opening proem
    }

    if (book > 6) break;
    for (let index = 0; index < stanza.lines.length; index += 1) {
      records.push({
        book,
        canto,
        stanza: printed,
        lineNumber: index + 1,
        text: stanza.lines[index],
      });
    }
    previousPrinted = printed;
  }

  // The Mutabilitie material retains its original canto numbers VI-VIII
  // and therefore cannot be inferred from the normal Book I-VI sequence.
  const mutability = sourceTexts[1];
  const mutabilityStart = mutability.indexOf('TWO CANTOS');
  const sectionMarkers = [
    { canto: 6, start: 'Canto VI.', end: 'Canto VII.' },
    { canto: 7, start: 'Canto VII.', end: '_The VIII. Canto, vnperfite._' },
    { canto: 8, start: '_The VIII. Canto, vnperfite._', end: 'FOOTNOTES:' },
  ];

  for (const section of sectionMarkers) {
    const start = mutability.indexOf(section.start, mutabilityStart);
    const end = mutability.indexOf(section.end, start + section.start.length);
    if (start < 0 || end < 0) throw new Error(`Could not locate Mutabilitie Canto ${section.canto}.`);
    for (const stanza of collectStanzas(mutability.slice(start, end))) {
      for (let index = 0; index < stanza.lines.length; index += 1) {
        records.push({
          book: 7,
          canto: section.canto,
          stanza: stanza.printed,
          lineNumber: index + 1,
          text: stanza.lines[index],
        });
      }
    }
  }

  return records;
}

const lines = parse();
const json = JSON.stringify(lines, null, 2);
fs.writeFileSync('faerie-queene.json', `${json}\n`);
fs.writeFileSync('faerie-queene-data.js', `window.FAERIE_QUEENE_LINES = ${json};\n`);
console.log(`Wrote ${lines.length.toLocaleString()} lines to faerie-queene.json and faerie-queene-data.js.`);
