import { z } from "zod";
import type { GuildRun, RunMember } from "@/lib/dungeonRotation";

/**
 * The guild's Mythic+ runs, for the Season 2 dungeon marquee.
 *
 * Two upstream sources, both validated at the boundary per ADR 0002, and the
 * division of labour between them is the whole design:
 *
 * 1. `mythic-plus/rankings/characters?season=…` — **an address book, not a run
 *    source.** Its `runs[]` holds one *best* run per character per dungeon
 *    (measured: 0 of 164 characters have two runs in the same dungeon), so its
 *    notion of "latest" is whoever most recently set a personal best, and it
 *    drops depleted keys entirely because a blown +16 scores below a timed +14.
 *    What it uniquely has is each character's **realm slug**, score-ordered.
 *    Realms vary across the guild, and a wrong realm is a 400.
 * 2. `characters/profile?fields=mythic_plus_*_runs` — the actual runs, for
 *    everyone on that list at or above {@link MIN_CHARACTER_SCORE}. Real
 *    `completed_at`, real `par_time_ms`, depletes included. Breadth is
 *    deliberate: the top twenty by score are the same handful of names on every
 *    tile, and the interesting runs — the heartbreaks, the pug groups, the key
 *    someone pushed once — are further down the list.
 *
 * **The `page` parameter is ignored by the rankings endpoint** — every page
 * returns the same full list. Requesting page 0 once is correct; looping pages
 * silently multiplies the result set.
 *
 * See `.scratch/dungeon-rotation/spec.md`.
 */

const RankedCharacterSchema = z.object({
  /** Mythic+ score. The only thing deciding who is worth a request. */
  score: z.number(),
  character: z.object({
    name: z.string(),
    // The other reason this endpoint survives at all. Not optional: a character
    // without one cannot be polled, and silently defaulting to the guild's
    // realm is how a wrong-realm 400 gets made.
    realm: z.object({ slug: z.string() }),
  }),
});

const RankingsSchema = z.object({
  rankings: z.object({
    rankedCharacters: z.array(RankedCharacterSchema),
  }),
});

/**
 * A run as the profile endpoint spells it — snake_case, and deliberately not
 * unified with the camelCase rankings shape above. They are two wire formats
 * that happen to describe the same thing; one schema for both would have to
 * make every field optional and would validate neither.
 */
const ProfileRunSchema = z.object({
  dungeon: z.string(),
  mythic_level: z.number(),
  completed_at: z.string(),
  clear_time_ms: z.number(),
  par_time_ms: z.number(),
  keystone_run_id: z.number(),
  /** Keystone upgrades; zero means the timer beat them. */
  num_keystone_upgrades: z.number(),
  /** Carries the season slug, which is what the season guard reads. */
  url: z.string().optional(),
  /** The spec played *on this run*, which is not always the character's current one. */
  spec: z.object({ name: z.string(), role: z.string() }).optional(),
  role: z.string().optional(),
});

const ProfileSchema = z.object({
  name: z.string(),
  /** Only the profile root carries the class name; the run's `spec` has an id. */
  class: z.string(),
  // The only run list requested, so the only one declared. The two
  // `*_highest_level_runs` fields were dropped with the field list above;
  // leaving them here would be schema for data nothing asks for.
  mythic_plus_recent_runs: z.array(ProfileRunSchema).optional(),
});

export type ProfileRun = z.infer<typeof ProfileRunSchema>;
export type Profile = z.infer<typeof ProfileSchema>;

const RANKINGS_URL = "https://raider.io/api/mythic-plus/rankings/characters";
const PROFILE_URL = "https://raider.io/api/v1/characters/profile";

/**
 * One field, deliberately.
 *
 * This used to fetch `mythic_plus_highest_level_runs` and
 * `mythic_plus_weekly_highest_level_runs` alongside it. Measured against live
 * data, **neither contributes a single unique run** — everything they return is
 * already in `recent_runs` or in each other. All they added was age, and with
 * them gone the board gains a person (30 against 29) and loses nothing.
 *
 * They were also a slow leak waiting to happen. `highest_level_runs` is
 * season-scoped, not week-scoped: it only looks fresh right now because the
 * season is two weeks old and keys are still climbing. By month three, a
 * standout run from month one would still be sitting in it, headlining BEST KEY
 * on a board built to move.
 */
const PROFILE_FIELD = "mythic_plus_recent_runs";

/**
 * The Mythic+ score a character needs before they are worth a request.
 *
 * Breadth is what makes the board varied — polling the roster rather than its
 * top twenty takes it from 14 distinct people to 25, and it is the only way the
 * five-man guild groups appear at all. But breadth does not have to mean
 * *everyone*. Simulated across one poll of the full 165:
 *
 * | floor | polled | cold | runs | tiles | people | biggest party |
 * |-------|--------|------|------|-------|--------|---------------|
 * | 0     | 165    | 7.1s | 235  | 32    | 25     | 5             |
 * | 1500  | 105    | 4.5s | 235  | 32    | 25     | 5             |
 * | 2000  |  88    | 3.8s | 235  | 32    | 25     | 5             |
 * | 2500  |  66    | 2.9s | 232  | 32    | 24     | 5             |
 * | 3000  |  13    | 0.6s | 109  | 32    | 11     | 5             |
 *
 * **At 2000 the board is byte-for-byte the one the full roster produces, for
 * half the requests.** That is not luck: {@link MIN_KEY_LEVEL} already discards
 * everything a sub-2000 character contributes, because clearing +12s is roughly
 * what earns that score in the first place. The two floors measure nearly the
 * same thing from opposite ends, and this one is the cheap end — it is applied
 * before the request rather than after it.
 *
 * **3000 is the intended destination and is not reachable yet.** Only 13 of 165
 * are there today (guild mean 1840, median 2153), and the board collapses back
 * to 11 people — the narrow, repetitive one this whole change set out to fix.
 * Raise this when the median does, not before, and re-run the simulation rather
 * than assuming the shape held.
 *
 * **Disarmed to 0** once the rolling window landed. Under a 48-hour cap a
 * low-scoring character only enters the pool by running *recently*, which
 * changes the arithmetic completely — re-measured, dropping the floor takes the
 * board from 32 distinct people to **40**, leaves BEST KEY (+15..+17) and
 * CLOSEST CALL (+7..+16) untouched, and costs only LATEST RUN, which widens
 * from +9..+11 to +2..+11.
 *
 * It also decides whether {@link countActiveCharacters} can speak for the
 * guild: at 2000 the honest phrasing is "73 of the 88 we polled", which is not
 * a statement about the guild. At 0 it is 115 of 165.
 */
const MIN_CHARACTER_SCORE = 0;

/**
 * A hard ceiling on the poll, expected never to bind.
 *
 * {@link MIN_CHARACTER_SCORE} does the real bounding — 88 characters today, and
 * a guild would need 250 players above that score to reach this. It exists
 * because an unbounded fan-out to a third party inside a page render is the
 * kind of thing that takes a site down when an assumption quietly changes. If
 * it ever fires, the log says so rather than leaving a thinner board looking
 * like a quiet week.
 */
const MAX_CHARACTERS = 250;

/**
 * Requests in flight.
 *
 * Sized by measurement: the full roster took **13.2s at 6** and **7.1s at 16**,
 * both timed cold. Widening helps but sub-linearly, so pushing further buys
 * little and asks more of a host that has not agreed to any of this.
 *
 * **Beware of measuring this wrong.** Upstream sends
 * `cache-control: max-age=300`, so the same poll repeated inside five minutes
 * comes back in **0.2s** off Cloudflare's edge — a 35× difference that looks
 * like a fast poll and is not one. Any timing here needs a quiet window first.
 *
 * Raider.IO publishes no rate-limit headers, so there is no documented budget
 * to be inside of; what is known is that repeated full-roster polls at this
 * width have not yet been refused. That is an observation, not a guarantee, and
 * it is one more reason this belongs in the hourly sync rather than in a render.
 */
const CONCURRENCY = 16;

/**
 * `no-store`, deliberately.
 *
 * These fetches now run inside the hourly Sync rather than a page render, and
 * the Sync exists precisely to go and look. A cached response would mean the
 * Sync stores what it was told an hour ago and reports success — the silent
 * staleness ADR 0001 was written against. The Data Cache was load-bearing when
 * a visitor's render paid for the poll; it is now actively wrong.
 */
const RUN_FETCH_CACHE = { cache: "no-store" } as const;

const SEASON_IN_URL = /\/mythic-plus-runs\/([^/]+)\//;

/**
 * The season a run belongs to, read off its own URL, or null if it cannot be
 * read. Null means *keep the run*: an upstream URL-format change should cost
 * the guard, not the section.
 */
export function runSeason(url: string | undefined): string | null {
  return url?.match(SEASON_IN_URL)?.[1] ?? null;
}

export type DungeonFetchArgs = {
  region: string;
  realm: string;
  guild: string;
  /** The Season's own M+ slug, e.g. "season-mn-2". */
  seasonSlug: string;
};

/**
 * Wire runs to guild runs: dedupe by keystone id and gather each run's party.
 *
 * A party is only visible by collecting the same `keystone_run_id` from every
 * member's own list, which is why this merges across characters rather than
 * per character — and why polling the whole roster rather than its top scorers
 * is what makes five-name tiles possible at all. Only guild members appear, so
 * a key run with pugs shows just the members who were there. That is usually
 * exactly one, which is why the tile lists names plainly and claims nothing
 * about party size.
 */
export function mergeProfileRuns(profiles: Profile[], seasonSlug: string): GuildRun[] {
  const runs = new Map<number, GuildRun>();

  for (const profile of profiles) {
    for (const run of profile[PROFILE_FIELD] ?? []) {
      const season = runSeason(run.url);
      if (season !== null && season !== seasonSlug) continue;

      const member: RunMember = {
        name: profile.name,
        class: profile.class,
        spec: run.spec?.name ?? "",
        role: run.spec?.role ?? run.role ?? "dps",
      };

      const existing = runs.get(run.keystone_run_id);
      if (existing) {
        // A run already seen came from a *different* character's profile — that
        // is how a party is assembled. The same character reporting it twice is
        // guarded against too, cheaply, rather than assumed impossible.
        if (!existing.members.some((m) => m.name === member.name)) existing.members.push(member);
        continue;
      }

      runs.set(run.keystone_run_id, {
        keystoneRunId: run.keystone_run_id,
        dungeon: run.dungeon,
        mythicLevel: run.mythic_level,
        clearTimeMs: run.clear_time_ms,
        parTimeMs: run.par_time_ms,
        timed: run.num_keystone_upgrades > 0,
        completedAt: run.completed_at,
        members: [member],
      });
    }
  }

  return [...runs.values()];
}

/**
 * Name and realm of everyone worth polling, best score first.
 *
 * Returns the score too, so the caller can say how many were passed over —
 * a shorter poll and a quiet week look identical in the output otherwise.
 */
async function fetchRankedRoster(args: DungeonFetchArgs): Promise<{ name: string; realm: string; score: number }[]> {
  const url =
    `${RANKINGS_URL}?region=${args.region}&realm=${encodeURIComponent(args.realm)}` +
    `&guild=${encodeURIComponent(args.guild)}&season=${args.seasonSlug}&class=all&role=all&page=0`;

  const res = await fetch(url, RUN_FETCH_CACHE);
  if (!res.ok) throw new Error(`M+ rankings ${res.status} ${res.statusText}`);
  const parsed = RankingsSchema.parse(await res.json());

  return parsed.rankings.rankedCharacters.map((c) => ({
    name: c.character.name,
    realm: c.character.realm.slug,
    score: c.score,
  }));
}

/**
 * Poll each character's profile, in batches.
 *
 * A character who fails is skipped, not thrown: one transfer, rename or
 * upstream hiccup costs that person's runs, and the rest of the roster still
 * fills the marquee. The failure is logged, because a quietly shorter strip
 * looks identical to a guild that simply ran fewer keys.
 */
async function fetchProfiles(region: string, characters: { name: string; realm: string }[]): Promise<Profile[]> {
  const fields = PROFILE_FIELD;
  const profiles: Profile[] = [];

  for (let i = 0; i < characters.length; i += CONCURRENCY) {
    const batch = await Promise.all(
      characters.slice(i, i + CONCURRENCY).map(async ({ name, realm }) => {
        const url =
          `${PROFILE_URL}?region=${region}&realm=${encodeURIComponent(realm)}` +
          `&name=${encodeURIComponent(name)}&fields=${encodeURIComponent(fields)}`;
        try {
          const res = await fetch(url, RUN_FETCH_CACHE);
          if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
          return ProfileSchema.parse(await res.json());
        } catch (err) {
          console.error(`M+ profile for ${name}-${realm} skipped:`, err);
          return null;
        }
      }),
    );
    for (const profile of batch) if (profile) profiles.push(profile);
  }

  return profiles;
}

/**
 * Every guild run the roster can currently see, for the Sync to store.
 *
 * **Called from the hourly Sync, never from a page render.** It was the other
 * way round until the runs were persisted: the section polled ~166 upstream
 * endpoints while a visitor waited, and because Raider.IO's edge expires at 300s
 * against a 900s revalidate, the render that refilled the cache was essentially
 * always the cold one — a measured 7.1s. Worse, Next dedupes fetches *within* a
 * render and not across concurrent ones, so several visitors arriving on an
 * expired cache each started their own poll.
 *
 * Throwing here fails the whole Sync at its fetch stage, per ADR 0001, and that
 * is deliberate rather than incidental. The alternative considered was to
 * tolerate a keys failure so raid progression still wrote: rejected because it
 * needs a second, weaker notion of failure, and because only the bulk roster
 * call can throw at all — individual profiles are already skipped one by one
 * below. A total failure therefore means Raider.IO's M+ API is down while its
 * guild API is up, which the next hourly run heals.
 */
export async function fetchGuildRuns(args: DungeonFetchArgs): Promise<GuildRun[]> {
  const roster = await fetchRankedRoster(args);
  const eligible = roster.filter((c) => c.score >= MIN_CHARACTER_SCORE);

  if (eligible.length > MAX_CHARACTERS) {
    console.error(
      `M+ keys: ${eligible.length} characters are at or above ${MIN_CHARACTER_SCORE} io, ` +
        `polling the top ${MAX_CHARACTERS} by score. The board will be thinner than the guild's activity.`,
    );
  }
  // Not an error — the season is young, or the floor has outrun the guild. Say
  // it anyway: an empty section otherwise looks like an upstream outage.
  if (eligible.length === 0 && roster.length > 0) {
    console.error(
      `M+ keys: none of ${roster.length} ranked characters reach ${MIN_CHARACTER_SCORE} io, so nothing was polled.`,
    );
  }

  const profiles = await fetchProfiles(args.region, eligible.slice(0, MAX_CHARACTERS));
  return mergeProfileRuns(profiles, args.seasonSlug);
}
