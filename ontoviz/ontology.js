/* HOW HELENA LIVES — the ontology behind the 3D page.
 *
 * The webzine is the source of truth; this file turns its scenes into nodes.
 * Every glow on screen is one entity from the record, every line a relation,
 * and each one carries the scene it came from so the inspector can always
 * point back to the text. Nothing here invents an event: the copy is a
 * reading of docs/IDENTITY.md, docs/tracks/* and docs/dialogue/*.
 */

export const CLASS = ['Chapter', 'Day', 'Faith', 'Music', 'Care', 'System', 'Record', 'Door', 'Dust'];
export const COL = {
  Chapter: '#d4a84b',
  Day: '#f0c75e',
  Faith: '#8fb3c9',
  Music: '#8b7cf0',
  Care: '#3db8a8',
  System: '#e85d4c',
  Record: '#f4efe6',
  Door: '#b5a999',
  Dust: '#d4a84b'
};

export const SECTIONS = ['cover', 'daily', 'faith', 'music', 'care', 'systems', 'record', 'doors'];

/* distance between stations in world units — always larger than the framing
   distance, so the camera never passes a card on its way to the next one */
export const GAP = 1700;

export const BRAND = {
  kicker: 'How Helena Lives · A life story',
  coverKicker: 'The record · one life, eight scenes',
  coverTitle: 'How Helena<br><em>lives</em>.',
  coverDeck:
    'A record of Helena\'s life — living with schizophrenia, making it through each day held within faith, music, and family care.',
  coverNote: 'Every account is in my big sister\'s name.',
  startLabel: 'Begin the walk',
  textLabel: 'Read as text',
  sceneKicker: 'Scene',
  itemHead: 'In this scene',
  quoteHead: 'The line we keep',
  sourceLabel: 'source',
  nextLabel: 'Next'
};

/* ── scenes: what the cards are painted from ─────────────────────── */
export const SCENES = [
  {
    id: 'cover', num: '00', kr: '표지', en: 'Cover', station: 0,
    kicker: 'How Helena Lives · A life story',
    title: 'How Helena<br><em>lives</em>.',
    deck:
      'A record of Helena\'s life — living with schizophrenia, making it through each day held within faith, music, and family care.',
    items: [],
    note: 'Every account is in my big sister\'s name.'
  },
  {
    id: 'daily', num: '01', kr: '하루', en: 'Daily life', station: 1,
    kicker: 'Scene 01 · 하루',
    title: 'A day is <em>small</em> on paper.',
    short:
      'It starts the same way every morning: waking, medication, breakfast, a short walk. A rhythm held steady is a life being kept.',
    deck:
      'It begins the same way every morning: waking, medication, breakfast, a short walk. Nothing about the day is dramatic. That is the point — a rhythm held steady is a life being kept.',
    items: [
      { id: 'meds', en: 'Morning medication', en2: 'Morning meds', kr: '아침 약', val: 5 },
      { id: 'meal', en: 'A warm meal', kr: '밥', val: 4 },
      { id: 'walk', en: 'The afternoon walk', en2: 'Afternoon walk', kr: '산책', val: 3 },
      { id: 'sleep', en: 'Sleep, when it comes', en2: 'Sleep', kr: '잠', val: 3 },
      { id: 'rhythm', en: 'The rhythm', kr: '규칙', val: 5 }
    ],
    quote: '하루를 이긴 게 아니라, 하루를 살아낸 것.',
    quoteEn: 'Not beating a day — living one.',
    source: 'docs/IDENTITY.md · 장 하루'
  },
  {
    id: 'faith', num: '02', kr: '신앙', en: 'Faith', station: 2,
    kicker: 'Scene 02 · 신앙',
    title: 'She holds on by <em>holding a hymn</em>.',
    short:
      'Sunday morning and the church she knows. A prayer before sleep. Faith here is a hand on something steady while the mind is loud.',
    deck:
      'Sunday morning, the church she knows. A prayer before sleep — sometimes only one line of it. Faith here is not an argument; it is a hand on something steady while the mind is loud.',
    items: [
      { id: 'church', en: 'The church she knows', en2: 'Her church', kr: '교회', val: 5 },
      { id: 'prayer', en: 'A prayer before sleep', en2: 'Prayer before sleep', kr: '기도', val: 4 },
      { id: 'hymn', en: 'A hymn she can follow', en2: 'A hymn she follows', kr: '찬송', val: 4 },
      { id: 'sunday', en: 'Sunday morning', kr: '주일', val: 3 },
      { id: 'quiet', en: 'The quiet after', kr: '고요', val: 2 }
    ],
    quote: '믿음은 설명이 아니라, 붙잡는 손이었다.',
    quoteEn: 'Faith was never an explanation — it was a hand to hold.',
    source: 'docs/IDENTITY.md · 장 신앙'
  },
  {
    id: 'music', num: '03', kr: '음악', en: 'Music', station: 3,
    kicker: 'Scene 03 · 음악',
    title: 'Sound is a place she can <em>stand</em>.',
    short:
      'A piano she keeps returning to, a song she can carry all day, a voice that still comes out. Music gives the day a shape.',
    deck:
      'A piano she keeps returning to, a song she can carry all day, a voice that still comes out. Music gives the day a shape that words sometimes cannot.',
    items: [
      { id: 'piano', en: 'The piano', kr: '피아노', val: 5 },
      { id: 'voice', en: 'Her voice', kr: '목소리', val: 4 },
      { id: 'song', en: 'A song kept close', kr: '노래', val: 4 },
      { id: 'practice', en: 'Practice, quietly', en2: 'Practice', kr: '연습', val: 3 },
      { id: 'ear', en: 'Listening first', kr: '귀', val: 3 }
    ],
    quote: '소리가 나를 붙잡아 줄 때가 있다.',
    quoteEn: 'Sometimes the sound is what holds me up.',
    source: 'docs/IDENTITY.md · 장 음악'
  },
  {
    id: 'care', num: '04', kr: '돌봄', en: 'Care', station: 4,
    kicker: 'Scene 04 · 돌봄',
    title: 'Care is a schedule <em>two people</em> keep.',
    short:
      'My mother lives with dementia; my sister lives with schizophrenia; I keep the record. Care is a rota, not a feeling.',
    deck:
      'My mother lives with dementia; my sister lives with schizophrenia; I keep the record. Care is not a feeling — it is a rota of meals, medication, appointments, and someone answering the phone.',
    items: [
      { id: 'mother', en: 'My mother', kr: '어머니', val: 5 },
      { id: 'assist', en: 'Personal assistance', en2: 'Assistance', kr: '활동지원', val: 4 },
      { id: 'keeper', en: 'The one who writes it down', en2: 'The record keeper', kr: '기록하는 사람', val: 5 },
      { id: 'safety', en: 'Safety at home', kr: '안전', val: 3 },
      { id: 'together', en: 'Doing it together', kr: '함께', val: 4 }
    ],
    quote: '돌봄은 마음이 아니라 시간표였다.',
    quoteEn: 'Care was never a feeling — it was a timetable.',
    source: 'docs/IDENTITY.md · 장 돌봄'
  },
  {
    id: 'systems', num: '05', kr: '제도', en: 'Systems', station: 5,
    kicker: 'Scene 05 · 제도',
    title: 'The paperwork is <em>part of the day</em>.',
    short:
      'Registration, benefits, appointments, the local centre — different windows, different words for the same life.',
    deck:
      'Disability registration, basic livelihood, hospital appointments, the local centre — different windows, different words for the same life. The documents are not the story, but they decide how the story can be lived.',
    items: [
      { id: 'welfare', en: 'Welfare & benefits', en2: 'Welfare', kr: '복지', val: 4 },
      { id: 'hospital', en: 'Hospital & clinic', en2: 'Hospital', kr: '병원', val: 4 },
      { id: 'center', en: 'The local centre', kr: '주민센터', val: 3 },
      { id: 'forms', en: 'Forms and next documents', en2: 'Forms & documents', kr: '서류', val: 3 },
      { id: 'calls', en: 'The phone call', kr: '전화', val: 3 }
    ],
    quote: '서류는 삶이 아니지만, 삶의 하루를 정한다.',
    quoteEn: 'Paperwork is not a life — but it decides how one gets lived.',
    source: 'docs/tracks/ · DW · BL · DC'
  },
  {
    id: 'record', num: '06', kr: '기록', en: 'The record', station: 6,
    kicker: 'Scene 06 · 기록',
    title: 'We write it down so the day is <em>not lost</em>.',
    short:
      'Every entry keeps one shape: the scene, what it felt like, the gap, the way through, the next step. Written in her name.',
    deck:
      'Every entry keeps the same shape: the scene, what it felt like, the gap, the way through, the next small step. Written in her name, because the record belongs to her.',
    items: [
      { id: 'story', en: 'The scene', kr: '장면', val: 4 },
      { id: 'feel', en: 'What it felt like', kr: '느낀 것', val: 4 },
      { id: 'way', en: 'The way through', kr: '살아낸 법', val: 4 },
      { id: 'next', en: 'The next day', kr: '다음 하루', val: 5 },
      { id: 'solution', en: 'Solution sketches', en2: 'Solutions', kr: '솔루션', val: 3 }
    ],
    quote: '기록은 하루를 두 번 살게 한다.',
    quoteEn: 'A record lets the day be lived twice.',
    source: 'docs/METHOD.md · docs/dialogue/'
  },
  {
    id: 'doors', num: '07', kr: '문', en: 'Doors', station: 7,
    kicker: 'Scene 07 · 문',
    title: 'One life, <em>many doors</em>.',
    short:
      'The rest of the ecosystem — the phone hub, the faith page, the piano page, the care tools. Every door opens on the same record.',
    deck:
      'The rest of the ecosystem: the phone hub, the faith page, the piano page, the care tools. Every door is another way into the same record.',
    items: [
      { id: 'hub', en: 'S21 Phone Hub', kr: '허브', val: 4, href: 'https://helena751107.github.io/helena_phone/' },
      { id: 'doorFaith', en: 'Faith', kr: '신앙 페이지', val: 3, href: 'https://helena751107.github.io/helena-faith/' },
      { id: 'doorPiano', en: 'Piano', kr: '피아노 페이지', val: 3, href: 'https://helena751107.github.io/helena-piano/' },
      { id: 'doorMetal', en: 'MetalCare', kr: '메탈케어', val: 3, href: 'https://helena751107.github.io/helena-metalcare/' },
      { id: 'doorDocs', en: 'Care Daemon docs', kr: '케어 데몬', val: 3, href: 'docs/care-daemon/' },
      { id: 'doorGithub', en: 'GitHub · the source', kr: '깃허브', val: 3, href: 'https://github.com/helena751107/helana_log' }
    ],
    quote: '하나의 삶, 여러 개의 문.',
    quoteEn: 'One life, many doors.',
    source: 'index.html · ecosystem'
  }
];

/* ── nodes ──────────────────────────────────────────────────────── */
const NODES = [];
const LINKS = [];
const add = (id, label, cls, val, scene, quote, desc, extra = {}) => {
  NODES.push({
    id, label, cls, s: CLASS.indexOf(cls), val,
    ref: scene, quote, desc, chapter: scene, ...extra
  });
};
const link = (source, target, rel) => LINKS.push({ source, target, rel });

add('helena', 'Helena', 'Chapter', 16, 'cover',
  'Every account is in my big sister\'s name.',
  'One person, recorded honestly: daily life, faith, music, care, and the systems around them.',
  { hero: true });

SCENES.slice(1).forEach((sc) => {
  add('ch.' + sc.id, sc.num + ' · ' + sc.kr + ' · ' + sc.en, 'Chapter', 8, sc.id,
    sc.quoteEn, sc.deck, { chapterNode: true });
  link('helena', 'ch.' + sc.id, 'chapter');
  sc.items.forEach((it) => {
    add(it.id, it.en, it.cls || clsOf(sc.id), it.val, sc.id, it.quote || sc.quoteEn, it.desc || it.kr, { kr: it.kr, href: it.href });
    link('ch.' + sc.id, it.id, 'contains');
  });
});

function clsOf(id) {
  return { daily: 'Day', faith: 'Faith', music: 'Music', care: 'Care', systems: 'System', record: 'Record', doors: 'Door' }[id] || 'Record';
}

/* the spine: a life walked in order — the pulses travel this line */
[['helena', 'ch.daily'], ['ch.daily', 'ch.faith'], ['ch.faith', 'ch.music'],
 ['ch.music', 'ch.care'], ['ch.care', 'ch.systems'], ['ch.systems', 'ch.record'],
 ['ch.record', 'ch.doors']].forEach(([a, b]) => link(a, b, 'flow'));

/* relations between scenes: the day does not happen in separate boxes */
[['meds', 'hospital', 'support'], ['mother', 'assist', 'support'], ['mother', 'keeper', 'support'],
 ['keeper', 'story', 'flow'], ['story', 'feel', 'flow'], ['feel', 'way', 'flow'], ['way', 'next', 'flow'],
 ['prayer', 'hymn', 'flow'], ['church', 'quiet', 'flow'], ['piano', 'song', 'flow'], ['voice', 'song', 'flow'],
 ['welfare', 'forms', 'support'], ['forms', 'calls', 'support'], ['next', 'solution', 'support'],
 ['hub', 'doorGithub', 'routes'], ['doorFaith', 'church', 'routes'], ['doorPiano', 'piano', 'routes']]
  .forEach(([a, b, r]) => { if (NODES.some((n) => n.id === a) && NODES.some((n) => n.id === b)) link(a, b, r); });

/* ── dust: the atmosphere of the room, not part of the record ────── */
let dust = 0;
SCENES.forEach((sc, i) => {
  for (let k = 0; k < 15; k++) {
    const a = (k / 15) * Math.PI * 2 + i * 1.7;
    const r = 240 + ((k * 137.5 + i * 61) % 460);
    NODES.push({
      id: `d.${i}.${k}`, label: '', cls: 'Dust', s: CLASS.indexOf('Dust'), val: 0.6,
      chapter: sc.id, dust: true,
      x: Math.cos(a) * r, y: 120 + Math.sin(a * 1.3) * 330, z: -i * GAP + Math.sin(a) * 420
    });
    dust++;
  }
});

export const DUST = dust;
export const stats = {
  nodes: NODES.length - dust,
  relations: LINKS.length,
  scenes: SCENES.length - 1,
  entities: NODES.filter((n) => !n.dust).length
};

export { NODES, LINKS };

export const RELCOL = { chapter: '#d4a84b', contains: '#b5a999', flow: '#f0c75e', support: '#3db8a8', routes: '#e85d4c' };
export const RELALPHA = { chapter: 0.035, contains: 0.075, flow: 0.42, support: 0.14, routes: 0.3 };
