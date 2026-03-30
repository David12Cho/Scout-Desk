const STATS_BASE = import.meta.env.DEV
  ? '/api/nhle-stats/en'
  : 'https://api.nhle.com/stats/rest/en'

const WEB_BASE = import.meta.env.DEV
  ? '/api/nhle-web'
  : 'https://api-web.nhle.com'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SkaterScoringRate {
  playerId: number
  skaterFullName: string
  lastName: string
  teamAbbrevs: string        // "EDM" or "EDM,VGK" if traded mid-season
  positionCode: 'C' | 'L' | 'R' | 'D'
  gamesPlayed: number
  goals: number
  assists: number
  points: number
  plusMinus: number
  penaltyMinutes: number
  timeOnIcePerGame: number   // seconds per game (from API)
  // Derived client-side from timeOnIcePerGame * gamesPlayed
  goalsPer60: number
  assistsPer60: number
  pointsPer60: number
}

// Raw shape returned by /v1/edge/skater-detail/{id}/now
interface SkaterEdgeRaw {
  skatingSpeed: {
    speedMax: { imperial: number; percentile: number; leagueAvg: number }
    burstsOver20: { value: number; percentile: number; leagueAvg: number }
  }
  totalDistanceSkated: { imperial: number; percentile: number; leagueAvg: number }
  topShotSpeed: { imperial: number; percentile: number; leagueAvg: number }
  zoneTimeDetails: {
    offensiveZonePctg: number
    offensiveZonePercentile: number
    neutralZonePctg: number
    neutralZonePercentile: number
    defensiveZonePctg: number
    defensiveZonePercentile: number
  }
}

// Flattened shape used throughout the app
export interface SkaterEdgeDetail {
  maxSkatingSpeed: number       // mph
  speedPercentile: number       // 0–100
  burstsAbove20Mph: number
  burstsPercentile: number
  totalDistanceMiles: number
  distancePercentile: number
  maxShotSpeed: number          // mph
  shotSpeedPercentile: number
  offZoneTimePercent: number    // 0–100
  offZonePercentile: number
  neutralZoneTimePercent: number
  neutralZonePercentile: number
  defZoneTimePercent: number
  defZonePercentile: number
}

export interface DraftRankingProspect {
  firstName: string
  lastName: string
  positionCode: string
  shootsCatches: string
  heightInInches: number
  weightInPounds: number
  lastAmateurClub: string
  lastAmateurLeague: string
  birthDate: string
  birthCity: string
  birthStateProvince?: string
  birthCountry: string
  midtermRank: number
  finalRank: number | null
  // injected client-side
  categoryId: 1 | 2 | 3 | 4
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`NHL API error: ${res.status} ${url}`)
  return res.json() as Promise<T>
}

// ─── Skater Stats ─────────────────────────────────────────────────────────────

interface SkaterSummaryRaw {
  playerId: number
  skaterFullName: string
  lastName: string
  teamAbbrevs: string
  positionCode: 'C' | 'L' | 'R' | 'D'
  gamesPlayed: number
  goals: number
  assists: number
  points: number
  plusMinus: number
  penaltyMinutes: number
  timeOnIcePerGame: number // seconds
}

export async function fetchSkaterScoringRates(
  seasonId: number,
  gameTypeId: 2 | 3,
): Promise<SkaterScoringRate[]> {
  const params = new URLSearchParams({
    limit: '1000',
    start: '0',
    sort: 'points',
    dir: 'DESC',
    cayenneExp: `seasonId=${seasonId} and gameTypeId=${gameTypeId}`,
  })
  const data = await get<{ data: SkaterSummaryRaw[] }>(
    `${STATS_BASE}/skater/summary?${params}`,
  )

  return data.data.map((s) => {
    const totalTOIMinutes = (s.timeOnIcePerGame * s.gamesPlayed) / 60
    const per60 = (stat: number) =>
      totalTOIMinutes > 0 ? (stat / totalTOIMinutes) * 60 : 0

    return {
      ...s,
      goalsPer60: per60(s.goals),
      assistsPer60: per60(s.assists),
      pointsPer60: per60(s.points),
    }
  })
}

function currentEdgeSeasonId(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  return month >= 10 ? `${year}${year + 1}` : `${year - 1}${year}`
}

export async function fetchSkaterEdgeDetail(
  playerId: number,
): Promise<SkaterEdgeDetail | null> {
  try {
    const raw = await get<SkaterEdgeRaw>(
      `${WEB_BASE}/v1/edge/skater-detail/${playerId}/${currentEdgeSeasonId()}/2`,
    )
    const z = raw.zoneTimeDetails
    return {
      maxSkatingSpeed:       raw.skatingSpeed.speedMax.imperial,
      speedPercentile:       raw.skatingSpeed.speedMax.percentile,
      burstsAbove20Mph:      raw.skatingSpeed.burstsOver20.value,
      burstsPercentile:      raw.skatingSpeed.burstsOver20.percentile,
      totalDistanceMiles:    raw.totalDistanceSkated.imperial / 5280,
      distancePercentile:    raw.totalDistanceSkated.percentile,
      maxShotSpeed:          raw.topShotSpeed.imperial,
      shotSpeedPercentile:   raw.topShotSpeed.percentile,
      offZoneTimePercent:    z.offensiveZonePctg * 100,
      offZonePercentile:     z.offensiveZonePercentile,
      neutralZoneTimePercent: z.neutralZonePctg * 100,
      neutralZonePercentile:  z.neutralZonePercentile,
      defZoneTimePercent:    z.defensiveZonePctg * 100,
      defZonePercentile:     z.defensiveZonePercentile,
    }
  } catch {
    return null
  }
}

// ─── Draft Rankings ───────────────────────────────────────────────────────────

export async function fetchDraftRankings(season: number): Promise<DraftRankingProspect[]> {
  const categories = [1, 2, 3, 4] as const
  const results = await Promise.all(
    categories.map((cat) =>
      get<{ rankings: Omit<DraftRankingProspect, 'categoryId'>[] }>(
        `${WEB_BASE}/v1/draft/rankings/${season}/${cat}`,
      ).then((d) =>
        (d.rankings ?? []).map((p) => ({ ...p, categoryId: cat })),
      ),
    ),
  )
  return results.flat()
}

export const CATEGORY_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: 'NA Skater',
  2: "Int'l Skater",
  3: 'NA Goalie',
  4: "Int'l Goalie",
}

// Format height from inches → 6'2"
export function formatHeight(inches: number): string {
  const ft = Math.floor(inches / 12)
  const i = inches % 12
  return `${ft}'${i}"`
}

// Country code → flag emoji
export function countryFlag(code: string): string {
  const flags: Record<string, string> = {
    CAN: '🇨🇦', USA: '🇺🇸', SWE: '🇸🇪', FIN: '🇫🇮',
    CZE: '🇨🇿', SVK: '🇸🇰', RUS: '🇷🇺', DEU: '🇩🇪',
    CHE: '🇨🇭', AUT: '🇦🇹', DNK: '🇩🇰', NOR: '🇳🇴',
    LVA: '🇱🇻', BLR: '🇧🇾', UKR: '🇺🇦', FRA: '🇫🇷',
    SVN: '🇸🇮', KAZ: '🇰🇿',
  }
  return flags[code] ?? '🏳️'
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const NHL_TEAMS = [
  { abbrev: 'ANA', name: 'Anaheim Ducks' },
  { abbrev: 'BOS', name: 'Boston Bruins' },
  { abbrev: 'BUF', name: 'Buffalo Sabres' },
  { abbrev: 'CGY', name: 'Calgary Flames' },
  { abbrev: 'CAR', name: 'Carolina Hurricanes' },
  { abbrev: 'CHI', name: 'Chicago Blackhawks' },
  { abbrev: 'COL', name: 'Colorado Avalanche' },
  { abbrev: 'CBJ', name: 'Columbus Blue Jackets' },
  { abbrev: 'DAL', name: 'Dallas Stars' },
  { abbrev: 'DET', name: 'Detroit Red Wings' },
  { abbrev: 'EDM', name: 'Edmonton Oilers' },
  { abbrev: 'FLA', name: 'Florida Panthers' },
  { abbrev: 'LAK', name: 'Los Angeles Kings' },
  { abbrev: 'MIN', name: 'Minnesota Wild' },
  { abbrev: 'MTL', name: 'Montréal Canadiens' },
  { abbrev: 'NSH', name: 'Nashville Predators' },
  { abbrev: 'NJD', name: 'New Jersey Devils' },
  { abbrev: 'NYI', name: 'New York Islanders' },
  { abbrev: 'NYR', name: 'New York Rangers' },
  { abbrev: 'OTT', name: 'Ottawa Senators' },
  { abbrev: 'PHI', name: 'Philadelphia Flyers' },
  { abbrev: 'PIT', name: 'Pittsburgh Penguins' },
  { abbrev: 'SEA', name: 'Seattle Kraken' },
  { abbrev: 'SJS', name: 'San Jose Sharks' },
  { abbrev: 'STL', name: 'St. Louis Blues' },
  { abbrev: 'TBL', name: 'Tampa Bay Lightning' },
  { abbrev: 'TOR', name: 'Toronto Maple Leafs' },
  { abbrev: 'UTA', name: 'Utah Hockey Club' },
  { abbrev: 'VAN', name: 'Vancouver Canucks' },
  { abbrev: 'VGK', name: 'Vegas Golden Knights' },
  { abbrev: 'WSH', name: 'Washington Capitals' },
  { abbrev: 'WPG', name: 'Winnipeg Jets' },
] as const

export type TeamAbbrev = (typeof NHL_TEAMS)[number]['abbrev']

export const SEASONS = [
  { id: 20242025, label: '2024–25' },
  { id: 20232024, label: '2023–24' },
  { id: 20222023, label: '2022–23' },
] as const

// Format seconds → "MM:SS"
export function formatTOI(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Player headshot URL — requires season (e.g. 20242025) and team abbrev
// For traded players (teamAbbrevs = "EDM,VGK"), use the last team listed
export function headshotUrl(playerId: number, seasonId: number, teamAbbrevs: string): string {
  const team = teamAbbrevs.split(',').at(-1) ?? teamAbbrevs
  return `https://assets.nhle.com/mugs/nhl/${seasonId}/${team}/${playerId}.png`
}

// Team logo URL (dark variant for light backgrounds, light for dark)
export function teamLogoUrl(abbrev: string): string {
  return `https://assets.nhle.com/logos/nhl/svg/${abbrev}_dark.svg`
}
