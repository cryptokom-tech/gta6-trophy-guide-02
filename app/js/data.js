// Trophy data loading: the single fetch this app ever makes, a local file under app/.
// Everything else in the guide is derived from this one list.
export const TROPHY_FILE = 'data/trophies.json';

/** The five roadmap stages, in play order, with the story they tell. */
export const ROADMAP_STAGES = [
  { stage: 1, title: 'Story playthrough — Chapters 1–4 and the final mission', blurb: 'Play the main missions in order. Every chapter and named mission trophy lives here.' },
  { stage: 2, title: 'Stranger strands — Andy, Kenton, Billy, Randy, Tyrone and friends', blurb: 'The strangers of Leonida and their mission chains. Start each strand as it appears.' },
  { stage: 3, title: 'Collectibles and the open world', blurb: 'Cards, WAiNK spots, vehicles, garages, meditation spots and the whole map.' },
  { stage: 4, title: 'Activities and grinds', blurb: 'Races, ranges, fishing, the arcade, challenges and the counters that climb while you play.' },
  { stage: 5, title: 'Crime and cleanup — then the platinum', blurb: 'Robberies, wanted levels and the money grinds, plus 100% completion. The platinum pops last.' },
];

/** Kind taxonomy, shown in the filter bar. "online" is listed on purpose: the list has none. */
export const KINDS = [
  { kind: 'story', label: 'Story', blurb: 'main missions, chapters and stranger strands' },
  { kind: 'collectibles', label: 'Collectibles', blurb: 'cards, WAiNK spots, vehicles, garages' },
  { kind: 'activities', label: 'Activities', blurb: 'races, ranges, fishing, arcade and more' },
  { kind: 'exploration', label: 'Exploration', blurb: 'places and moments' },
  { kind: 'crime', label: 'Crime', blurb: 'robberies, wanted levels and heists' },
  { kind: 'misc', label: 'Misc', blurb: 'everything else' },
  { kind: 'missable', label: 'Missable', blurb: 'tied to a story moment or a one-time condition' },
  { kind: 'online', label: 'Online (0)', blurb: 'this list has no online trophies' },
  { kind: 'platinum', label: 'Platinum', blurb: 'the platinum itself' },
];

export const GRADES = ['platinum', 'gold', 'silver', 'bronze'];

/** Load the official list plus our guides. Throws if the file is missing or malformed. */
export async function loadTrophies() {
  const response = await fetch(TROPHY_FILE);
  if (!response.ok) throw new Error(`could not load ${TROPHY_FILE}: ${response.status}`);
  const doc = await response.json();
  const trophies = Array.isArray(doc) ? doc : doc.trophies;
  if (!Array.isArray(trophies) || trophies.length === 0) throw new Error('trophy list is empty');
  return trophies;
}

export function trophyById(trophies, id) {
  return trophies.find((t) => t.id === id) ?? null;
}

export function stageOf(trophies, stage) {
  return trophies.filter((t) => t.stage === stage);
}

export function countByGrade(trophies, grade) {
  return trophies.filter((t) => t.grade === grade).length;
}
