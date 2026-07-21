(() => {
  const lines = window.FAERIE_QUEENE_LINES || [];
  const variantFamilies = window.FQE_VARIANT_FAMILIES || [];
  const themeDefinitions = window.FQE_THEMES || [];
  const $ = selector => document.querySelector(selector);
  const elements = {
    query: $('#poem-search'), form: $('#search-form'), note: $('#search-note'), results: $('#search-results'),
    mode: $('#search-mode'), book: $('#book-filter'), canto: $('#canto-filter'), view: $('#result-view'),
    context: $('#context-mode'), whole: $('#whole-word'), caseSensitive: $('#case-sensitive'),
    history: $('#search-history'), csv: $('#export-csv'), json: $('#export-json'), share: $('#copy-share-link'), distribution: $('#distribution'),
    citationForm: $('#citation-form'), citationInput: $('#citation-input'), theme: $('#theme-toggle'),
    toc: $('#toc-content'), characters: $('#character-index'), themes: $('#theme-index')
  };
  const HISTORY_KEY = 'fqe-history';
  const DARK_KEY = 'fqe-dark';
  const PAGE_SIZE = 100;
  const stanzas = new Map();
  const stanzaKeys = [];
  const variantLookup = new Map();
  let current = { keys: [], query: '', compiled: null, occurrences: 0, visible: PAGE_SIZE, theme: null };

  lines.forEach(line => {
    const key = `${line.book}:${line.canto}:${line.stanza}`;
    if (!stanzas.has(key)) { stanzas.set(key, []); stanzaKeys.push(key); }
    stanzas.get(key).push(line);
  });
  variantFamilies.forEach(family => family.forEach(form => variantLookup.set(form.toLowerCase(), family)));

  const escapeHtml = value => String(value).replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
  const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const getStored = key => JSON.parse(localStorage.getItem(key) || '[]');
  const putStored = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const keyFor = line => `${line.book}:${line.canto}:${line.stanza}`;
  const code = line => `${line.book}.${line.canto}.${line.stanza}`;
  const bookName = book => book === 7 ? 'Mutabilitie Cantos' : `Book ${book}`;
  const reference = line => `${bookName(line.book)} · ${line.canto ? `Canto ${line.canto}` : 'Proem'} · Stanza ${line.stanza}`;
  const flags = global => `${global ? 'g' : ''}${elements.caseSensitive.checked ? '' : 'i'}`;

  function orthographicPattern(value) {
    let pattern = '';
    for (let index = 0; index < value.length; index++) {
      const remainder = value.slice(index).toLowerCase();
      const pair = remainder.slice(0, 2);
      const character = value[index].toLowerCase();
      if (remainder.startsWith('ffi') || character === 'ﬃ') { pattern += '(?:ffi|ﬃ)'; if (remainder.startsWith('ffi')) index += 2; }
      else if (remainder.startsWith('ffl') || character === 'ﬄ') { pattern += '(?:ffl|ﬄ)'; if (remainder.startsWith('ffl')) index += 2; }
      else if (pair === 'ff' || character === 'ﬀ') { pattern += '(?:ff|ﬀ)'; if (pair === 'ff') index++; }
      else if (pair === 'fi' || character === 'ﬁ') { pattern += '(?:fi|ﬁ)'; if (pair === 'fi') index++; }
      else if (pair === 'fl' || character === 'ﬂ') { pattern += '(?:fl|ﬂ)'; if (pair === 'fl') index++; }
      else if (pair === 'oe' || character === 'œ') { pattern += '(?:oe|œ)'; if (pair === 'oe') index++; }
      else if (pair === 'ae' || character === 'æ') { pattern += '(?:ae|æ)'; if (pair === 'ae') index++; }
      else if (character === 's' || character === 'ſ') pattern += '[sſ]';
      else if (pair === 'vv') { pattern += '(?:w|vv)'; index++; }
      else if (character === 'w') pattern += '(?:w|vv)';
      else if (character === 'u' || character === 'v') pattern += '[uv]';
      else pattern += escapeRegex(value[index]);
    }
    return pattern;
  }

  function normalizedPattern(value, metadata) {
    const wordCharacters = 'A-Za-zŒœÆæﬀﬁﬂﬃﬄſ';
    const parts = value.match(new RegExp(`[${wordCharacters}]+|[^${wordCharacters}]+`, 'g')) || [];
    return parts.map(part => {
      if (!new RegExp(`^[${wordCharacters}]+$`).test(part)) return escapeRegex(part);
      const family = variantLookup.get(part.toLowerCase());
      if (/[uvw]/i.test(part)) metadata.orthographic = true;
      if (/(?:oe|ae|ff|fi|fl|[œæﬀﬁﬂﬃﬄſ])/i.test(part)) metadata.ligature = true;
      if (!family) return orthographicPattern(part);
      family.forEach(form => metadata.variants.add(form));
      if (family.some(form => /(?:oe|ae|ff|fi|fl|[œæﬀﬁﬂﬃﬄſ])/i.test(form))) metadata.ligature = true;
      return `(?:${family.map(orthographicPattern).join('|')})`;
    }).join('');
  }

  function compileTerm(raw, metadata) {
    let value = raw.trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!value) throw new Error('A search term is missing.');
    let pattern;
    if (elements.mode.value === 'regex') pattern = value;
    else if (elements.mode.value === 'exact') pattern = escapeRegex(value);
    else pattern = normalizedPattern(value, metadata);
    if (elements.whole.checked && elements.mode.value !== 'regex') pattern = `\\b${pattern}\\b`;
    new RegExp(pattern, flags(false));
    return pattern;
  }

  function compileQuery(query) {
    const metadata = { variants: new Set(), orthographic: false, ligature: false };
    if (elements.mode.value === 'regex') {
      const pattern = compileTerm(query, metadata);
      return { type: 'simple', positive: [pattern], negative: [], metadata };
    }
    const near = query.match(/^(.+?)\s+NEAR\/(\d+)\s+(.+)$/i);
    if (near) return {
      type: 'near', positive: [compileTerm(near[1], metadata), compileTerm(near[3], metadata)],
      negative: [], distance: Number(near[2]), metadata
    };
    const orGroups = query.split(/\s+OR\s+/i).map(group => {
      const notParts = group.split(/\s+NOT\s+/i);
      return {
        required: notParts.shift().split(/\s+AND\s+/i).map(term => compileTerm(term, metadata)),
        excluded: notParts.map(term => compileTerm(term, metadata))
      };
    });
    return {
      type: 'boolean', groups: orGroups,
      positive: [...new Set(orGroups.flatMap(group => group.required))],
      negative: [...new Set(orGroups.flatMap(group => group.excluded))], metadata
    };
  }

  function matches(pattern, text) { return new RegExp(pattern, flags(false)).test(text); }
  function stanzaMatches(stanza, compiled) {
    const text = stanza.map(line => line.text).join('\n');
    if (compiled.type === 'simple') return matches(compiled.positive[0], text);
    if (compiled.type === 'theme') return compiled.positive.some(pattern => matches(pattern, text)) &&
      compiled.negative.every(pattern => !matches(pattern, text));
    if (compiled.type === 'boolean') return compiled.groups.some(group =>
      group.required.every(pattern => matches(pattern, text)) && group.excluded.every(pattern => !matches(pattern, text))
    );
    const positions = compiled.positive.map(pattern => stanza
      .map((line, index) => matches(pattern, line.text) ? index : -1).filter(index => index >= 0));
    return positions[0].some(left => positions[1].some(right => Math.abs(left - right) <= compiled.distance));
  }

  function highlightPattern(compiled) { return compiled.positive.length ? `(?:${compiled.positive.join('|')})` : ''; }
  function countOccurrences(stanza, compiled) {
    const pattern = highlightPattern(compiled);
    if (!pattern) return 0;
    return stanza.reduce((total, line) => total + [...line.text.matchAll(new RegExp(pattern, flags(true)))].length, 0);
  }
  function filtered(stanza) {
    const first = stanza[0];
    return (!elements.book.value || String(first.book) === elements.book.value) &&
      (!elements.canto.value || String(first.canto) === elements.canto.value);
  }

  function search(value, saveHistory = true) {
    const query = value.trim();
    if (!query) { elements.results.hidden = true; elements.distribution.hidden = true; elements.note.textContent = 'Type a word or phrase to find it in the poem.'; current = { keys: [], query: '', compiled: null, occurrences: 0, visible: PAGE_SIZE, theme: null }; history.replaceState(null, '', location.href.split('#')[0]); return; }
    let compiled;
    try { compiled = compileQuery(query); }
    catch (error) { elements.note.textContent = error.message || 'That search is not valid.'; return; }
    const keys = stanzaKeys.filter(key => filtered(stanzas.get(key)) && stanzaMatches(stanzas.get(key), compiled));
    const occurrences = keys.reduce((total, key) => total + countOccurrences(stanzas.get(key), compiled), 0);
    current = { keys, query, compiled, occurrences, visible: PAGE_SIZE, theme: null };
    const notes = [];
    if (compiled.metadata.variants.size) notes.push(`Variants: ${[...compiled.metadata.variants].join(', ')}`);
    if (compiled.metadata.orthographic) notes.push('u/v and w/vv normalized');
    if (compiled.metadata.ligature) notes.push('ligatures normalized');
    elements.note.textContent = `${keys.length} matching stanzas; ${occurrences} occurrences.${notes.length ? ` ${notes.join('. ')}.` : ''}`;
    if (saveHistory && elements.mode.value !== 'regex') {
      putStored(HISTORY_KEY, [query, ...getStored(HISTORY_KEY).filter(item => item !== query)].slice(0, 12));
      renderHistory();
    }
    renderDistribution();
    renderResults();
    updateShareHash();
  }

  function themeCitationKey(citationValue) {
    const match = String(citationValue).match(/^([1-7])[.:/](\d{1,2})[.:/](\d+)$/);
    return match ? `${match[1]}:${match[2]}:${match[3]}` : null;
  }

  function runTheme(themeId, scroll = true) {
    const theme = themeDefinitions.find(item => item.id === themeId);
    if (!theme) return;
    elements.mode.value = 'normalized';
    const metadata = { variants: new Set(), orthographic: false, ligature: false };
    let positive, negative;
    try {
      positive = [...(theme.terms || []), ...(theme.phrases || [])].map(term => compileTerm(`"${term}"`, metadata));
      negative = (theme.exclude || []).map(term => compileTerm(`"${term}"`, metadata));
    } catch (error) {
      elements.note.textContent = `Theme configuration error: ${error.message}`;
      return;
    }
    const compiled = { type: 'theme', positive, negative, metadata };
    const automatic = stanzaKeys.filter(key => filtered(stanzas.get(key)) && stanzaMatches(stanzas.get(key), compiled));
    const curated = (theme.curated || []).map(themeCitationKey).filter(key => key && stanzas.has(key) && filtered(stanzas.get(key)));
    const keys = [...new Set([...automatic, ...curated])].sort((left, right) => stanzaKeys.indexOf(left) - stanzaKeys.indexOf(right));
    const occurrences = keys.reduce((total, key) => total + countOccurrences(stanzas.get(key), compiled), 0);
    const automaticSet = new Set(automatic), curatedSet = new Set(curated);
    current = {
      keys, query: theme.name, compiled, occurrences, visible: PAGE_SIZE,
      theme: { definition: theme, automatic: automaticSet, curated: curatedSet }
    };
    elements.query.value = '';
    elements.note.textContent = `${theme.name}: ${keys.length} passages; ${occurrences} textual occurrences. ${theme.description}`;
    renderDistribution();
    renderResults();
    updateShareHash();
    if (scroll) elements.results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function themeEvidence(key) {
    if (!current.theme) return '';
    const theme = current.theme.definition;
    const text = stanzas.get(key).map(line => line.text).join('\n');
    const labels = [...(theme.terms || []), ...(theme.phrases || [])];
    const matched = labels.filter((label, index) => matches(current.compiled.positive[index], text));
    const automatic = current.theme.automatic.has(key), curated = current.theme.curated.has(key);
    const source = automatic && curated ? 'Textual match and curated passage' : curated ? 'Curated passage' : 'Textual match';
    return `<p class="theme-evidence"><strong>${source}</strong>${matched.length ? ` · Matched: ${matched.map(escapeHtml).join(', ')}` : ''}</p>`;
  }

  function highlighted(text) {
    if (!current.compiled) return escapeHtml(text);
    try { return escapeHtml(text).replace(new RegExp(highlightPattern(current.compiled), flags(true)), '<mark>$&</mark>'); }
    catch { return escapeHtml(text); }
  }
  function matchingLines(stanza) {
    const pattern = highlightPattern(current.compiled);
    return stanza.filter(line => pattern && matches(pattern, line.text));
  }

  function contextHtml(key) {
    const mode = elements.context.value;
    const stanza = stanzas.get(key);
    if (mode === 'line') return matchingLines(stanza).map(line => `<span class="result-line">${highlighted(line.text)}</span>`).join('');
    if (mode === 'stanza') return stanza.map(line => `<span class="result-line">${highlighted(line.text)}</span>`).join('');
    let contextKeys;
    if (mode === 'adjacent') {
      const first = stanza[0];
      const cantoKeys = stanzaKeys.filter(candidate => {
        const line = stanzas.get(candidate)[0]; return line.book === first.book && line.canto === first.canto;
      });
      const index = cantoKeys.indexOf(key);
      contextKeys = cantoKeys.slice(Math.max(0, index - 1), index + 2);
    } else {
      const first = stanza[0];
      contextKeys = stanzaKeys.filter(candidate => {
        const line = stanzas.get(candidate)[0]; return line.book === first.book && line.canto === first.canto;
      });
    }
    return `<details><summary>${mode === 'adjacent' ? 'Show adjacent stanzas' : 'Show complete canto'}</summary><div class="context-block">${contextKeys.map(candidate => {
      const passage = stanzas.get(candidate); return `<p><strong>${reference(passage[0])}</strong><br>${passage.map(line => highlighted(line.text)).join('<br>')}</p>`;
    }).join('')}</div></details>`;
  }

  function resultCard(key) {
    const stanza = stanzas.get(key), first = stanza[0];
    return `<li class="result-card"><div class="result-topline"><p class="result-reference"><a href="#passage=${code(first)}" data-go="${code(first)}">${reference(first)}</a></p><div><button class="mini-action" data-copy="${key}">Copy stanza</button><button class="mini-action" data-link="${key}">Copy link</button></div></div>${themeEvidence(key)}<div class="result-lines">${contextHtml(key)}</div></li>`;
  }

  function kwicRows(keys) {
    return keys.flatMap(key => {
      const stanza = stanzas.get(key);
      const selected = matchingLines(stanza);
      const displayLines = selected.length || !current.theme || !current.theme.curated.has(key) ? selected : stanza;
      return displayLines.map(line =>
      `<li class="kwic-row"><a class="kwic-reference" href="#passage=${code(line)}" data-go="${code(line)}">${code(line)}.${line.lineNumber}</a><span class="kwic-text">${highlighted(line.text)}</span></li>`
      );
    });
  }

  function renderResults() {
    elements.results.hidden = false;
    if (!current.keys.length) { elements.results.innerHTML = '<p class="result-more">No matching passages.</p>'; return; }
    const visible = current.keys.slice(0, current.visible);
    const metrics = `<div class="result-metrics"><span>${current.keys.length} stanzas</span><span>${current.occurrences} occurrences</span><span>${elements.mode.options[elements.mode.selectedIndex].text}</span></div>`;
    const body = elements.view.value === 'kwic'
      ? `<ol class="kwic-list">${kwicRows(visible).join('')}</ol>`
      : `<ol class="result-list">${visible.map(resultCard).join('')}</ol>`;
    const more = current.visible < current.keys.length ? `<button class="load-more" id="load-more" type="button">Show ${Math.min(PAGE_SIZE, current.keys.length - current.visible)} more</button>` : '';
    elements.results.innerHTML = `<p class="search-summary">Search results</p>${metrics}${body}${more}`;
    const loadMore = $('#load-more'); if (loadMore) loadMore.onclick = () => { current.visible += PAGE_SIZE; renderResults(); };
  }

  function renderDistribution() {
    const counts = [1, 2, 3, 4, 5, 6, 7].map(book => current.keys.filter(key => stanzas.get(key)[0].book === book).length);
    const maximum = Math.max(...counts, 1);
    elements.distribution.hidden = false;
    elements.distribution.innerHTML = `<h3>Distribution by book</h3>${counts.map((count, index) => `<div class="distribution-row"><span>${index === 6 ? 'Mutabilitie' : `Book ${index + 1}`}</span><span class="distribution-track"><span class="distribution-bar" style="width:${(count / maximum) * 100}%"></span></span><span>${count}</span></div>`).join('')}`;
  }

  function setDarkMode(enabled) {
    document.body.classList.toggle('dark-mode', enabled); elements.theme.textContent = enabled ? 'Light mode' : 'Dark mode';
    elements.theme.setAttribute('aria-pressed', String(enabled)); putStored(DARK_KEY, enabled);
  }
  function renderHistory() { elements.history.innerHTML = '<option value="">Recent searches</option>' + getStored(HISTORY_KEY).map(value => `<option>${escapeHtml(value)}</option>`).join(''); }
  function updateShareHash() {
    if (!current.query && !current.theme) return;
    const params = new URLSearchParams();
    if (current.theme) params.set('theme', current.theme.definition.id); else params.set('search', current.query);
    params.set('mode', elements.mode.value);
    if (elements.book.value) params.set('book', elements.book.value);
    if (elements.canto.value) params.set('canto', elements.canto.value);
    if (elements.view.value !== 'stanza') params.set('view', elements.view.value);
    if (elements.context.value !== 'stanza') params.set('context', elements.context.value);
    if (!elements.whole.checked) params.set('whole', '0');
    if (elements.caseSensitive.checked) params.set('case', '1');
    history.replaceState(null, '', `#${params.toString()}`);
    elements.share.textContent = current.theme ? 'Copy theme link' : 'Copy search link';
  }

  function restoreSharedState() {
    const params = new URLSearchParams(location.hash.slice(1));
    const setSelect = (element, value) => {
      if (value !== null && [...element.options].some(option => option.value === value)) element.value = value;
    };
    setSelect(elements.mode, params.get('mode'));
    setSelect(elements.book, params.get('book'));
    setSelect(elements.canto, params.get('canto'));
    setSelect(elements.view, params.get('view'));
    setSelect(elements.context, params.get('context'));
    elements.whole.checked = params.get('whole') !== '0';
    elements.caseSensitive.checked = params.get('case') === '1';
    if (params.has('passage')) goToCitation(params.get('passage'), false);
    else if (params.has('theme')) runTheme(params.get('theme'), false);
    else if (params.has('search')) { elements.query.value = params.get('search'); search(elements.query.value, false); }
  }

  function copyShareLink() {
    updateShareHash();
    const url = location.href;
    if (navigator.clipboard) navigator.clipboard.writeText(url); else prompt('Copy:', url);
    const label = elements.share.textContent;
    elements.share.textContent = 'Link copied';
    setTimeout(() => { elements.share.textContent = label; }, 1400);
  }

  function goToCitation(value, updateHash = true, scroll = true) {
    const match = value.trim().match(/^([1-7])[.:/](0|[1-9]|1[0-2])[.:/](\d+)$/);
    if (!match) { elements.note.textContent = 'Use Book.Canto.Stanza, e.g. 1.1.1.'; return; }
    const key = `${match[1]}:${match[2]}:${match[3]}`;
    if (!stanzas.has(key)) { elements.note.textContent = 'Citation not found.'; return; }
    const stanza = stanzas.get(key), first = stanza[0], pane = $('#reading-pane');
    const cantoKeys = stanzaKeys.filter(candidate => {
      const line = stanzas.get(candidate)[0]; return line.book === first.book && line.canto === first.canto;
    });
    pane.querySelector('.reading-heading h2').textContent = `${bookName(first.book)}: ${first.canto ? `Canto ${first.canto}` : 'Proem'}`;
    pane.querySelector('.chapter-mark').textContent = `${cantoKeys.length} stanzas`;
    $('#canto-reader').innerHTML = cantoKeys.map(candidate => {
      const passage = stanzas.get(candidate), passageFirst = passage[0], target = candidate === key;
      return `<section class="reading-stanza${target ? ' is-target' : ''}" id="passage-${code(passageFirst)}"><a class="stanza-number" href="#passage=${code(passageFirst)}" data-go="${code(passageFirst)}" aria-label="${reference(passageFirst)}">${passageFirst.stanza}</a><p>${passage.map(line => escapeHtml(line.text)).join('<br>')}</p></section>`;
    }).join('');
    if (updateHash) history.replaceState(null, '', `#passage=${code(first)}`);
    if (scroll) $('#canto-reader .is-target').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function download(name, content, type) {
    const blob = new Blob([content], { type }), anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob); anchor.download = name; anchor.click(); URL.revokeObjectURL(anchor.href);
  }
  function exportRows() {
    return current.keys.flatMap(key => {
      const stanza = stanzas.get(key), selected = matchingLines(stanza);
      const exportLines = selected.length || !current.theme || !current.theme.curated.has(key) ? selected : stanza;
      return exportLines.map(line => ({
        book: line.book, canto: line.canto, stanza: line.stanza, line: line.lineNumber,
        query: current.query, source: current.theme ? (current.theme.curated.has(key) ? 'curated' : 'textual') : 'search', text: line.text
      }));
    });
  }
  function csvCell(value) { return `"${String(value).replace(/"/g, '""')}"`; }
  function exportCsv() {
    const rows = exportRows(), headings = ['Book', 'Canto', 'Stanza', 'Line', 'Search or theme', 'Source', 'Text'];
    download('faerie-queene-concordance.csv', [headings.map(csvCell).join(','), ...rows.map(row => [row.book, row.canto, row.stanza, row.line, row.query, row.source, row.text].map(csvCell).join(','))].join('\r\n'), 'text/csv;charset=utf-8');
  }

  function renderIndex(target, entries, kind) {
    target.innerHTML = entries.map(item => kind === 'character'
      ? `<button class="index-link" data-character="${escapeHtml(item.query)}"><span>${item.name}</span><small>${item.note}</small></button>`
      : `<button class="index-link" data-go="${item.citation}"><span>${item.name}</span><small>${item.note}</small></button>`).join('');
  }
  function renderThemeIndex() {
    elements.themes.innerHTML = themeDefinitions.map(theme =>
      `<div class="theme-entry"><button class="index-link theme-link" data-theme="${escapeHtml(theme.id)}"><span>${escapeHtml(theme.name)}</span><small>Explore</small></button><p class="theme-index-description">${escapeHtml(theme.description)}</p></div>`
    ).join('') || '<p class="empty-note">No themes configured.</p>';
  }
  function renderToc() {
    let html = '';
    for (let book = 1; book <= 7; book++) {
      html += `<div class="toc-book"><strong>${bookName(book)}</strong>`;
      for (let canto = 0; canto <= 12; canto++) {
        const key = stanzaKeys.find(candidate => candidate.startsWith(`${book}:${canto}:`));
        if (key) html += `<button data-go="${code(stanzas.get(key)[0])}">${canto ? `Canto ${canto}` : 'Proem'}</button>`;
      }
      html += '</div>';
    }
    elements.toc.innerHTML = html;
  }
  function populateCantos() { for (let canto = 1; canto <= 12; canto++) elements.canto.insertAdjacentHTML('beforeend', `<option value="${canto}">Canto ${canto}</option>`); }

  elements.query.oninput = () => search(elements.query.value, false);
  elements.form.onsubmit = event => { event.preventDefault(); search(elements.query.value); };
  [elements.mode, elements.book, elements.canto, elements.view, elements.context, elements.whole, elements.caseSensitive].forEach(control => control.onchange = () => {
    if (current.theme) runTheme(current.theme.definition.id, false); else search(elements.query.value, false);
  });
  elements.history.onchange = () => { elements.query.value = elements.history.value; search(elements.query.value, false); };
  elements.citationForm.onsubmit = event => { event.preventDefault(); goToCitation(elements.citationInput.value); };
  elements.theme.onclick = () => setDarkMode(!document.body.classList.contains('dark-mode'));
  elements.csv.onclick = exportCsv;
  elements.json.onclick = () => download('faerie-queene-search-results.json', JSON.stringify(exportRows(), null, 2), 'application/json');
  elements.share.onclick = copyShareLink;

  document.onclick = event => {
    const target = event.target.closest('[data-copy],[data-link],[data-go],[data-character],[data-theme]');
    if (!target) return;
    if (target.dataset.character !== undefined) { elements.query.value = target.dataset.character; search(elements.query.value); elements.results.scrollIntoView({ behavior: 'smooth' }); }
    if (target.dataset.theme !== undefined) runTheme(target.dataset.theme);
    if (target.dataset.go) { event.preventDefault(); goToCitation(target.dataset.go); }
    if (target.dataset.copy) {
      const stanza = stanzas.get(target.dataset.copy), text = `${reference(stanza[0])}\n${stanza.map(line => line.text).join('\n')}`;
      navigator.clipboard ? navigator.clipboard.writeText(text) : prompt('Copy:', text);
    }
    if (target.dataset.link) {
      const stanza = stanzas.get(target.dataset.link), url = `${location.href.split('#')[0]}#passage=${code(stanza[0])}`;
      navigator.clipboard ? navigator.clipboard.writeText(url) : prompt('Copy:', url);
    }
  };
  document.onkeydown = event => {
    const editing = /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName);
    if (event.key === '/' && !editing) { event.preventDefault(); elements.query.focus(); }
    else if (event.key.toLowerCase() === 'd' && !editing) setDarkMode(!document.body.classList.contains('dark-mode'));
    else if (event.key === '?' && !editing) alert('/ focus search\nD dark mode\nEsc clear search\nOperators: AND, OR, NOT, NEAR/n');
    else if (event.key === 'Escape') { elements.query.value = ''; search(''); }
  };

  populateCantos();
  renderIndex(elements.characters, [
    { name: 'Redcrosse Knight', query: 'Redcrosse OR Redcross', note: 'Holiness' }, { name: 'Una', query: 'Una OR Vna', note: 'Truth' },
    { name: 'Prince Arthur', query: 'Arthur', note: 'Magnificence' }, { name: 'Guyon', query: 'Guyon', note: 'Temperance' },
    { name: 'Britomart', query: 'Britomart', note: 'Chastity' }, { name: 'Artegall', query: 'Artegall OR Arthegall', note: 'Justice' },
    { name: 'Calidore', query: 'Calidore', note: 'Courtesy' }, { name: 'Belphoebe', query: 'Belphoebe', note: 'All spelling variants' }
  ], 'character');
  renderThemeIndex();
  renderToc(); renderHistory(); setDarkMode(getStored(DARK_KEY) === true);
  if (location.hash) restoreSharedState(); else goToCitation('1.1.1', false, false);
})();
