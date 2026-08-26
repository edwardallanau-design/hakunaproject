import * as migration_20260804_235225_baseline from './20260804_235225_baseline';
import * as migration_20260811_030341_add_seasons_collection from './20260811_030341_add_seasons_collection';
import * as migration_20260825_023852_add_theme_slug_enum from './20260825_023852_add_theme_slug_enum';
import * as migration_20260825_043421_add_difficulty_progress from './20260825_043421_add_difficulty_progress';
import * as migration_20260825_083737_drop_progression_global from './20260825_083737_drop_progression_global';
import * as migration_20260825_155820_add_hero_intro from './20260825_155820_add_hero_intro';
import * as migration_20260825_164527_store_mythic_plus_runs from './20260825_164527_store_mythic_plus_runs';

export const migrations = [
  {
    up: migration_20260804_235225_baseline.up,
    down: migration_20260804_235225_baseline.down,
    name: '20260804_235225_baseline',
  },
  {
    up: migration_20260811_030341_add_seasons_collection.up,
    down: migration_20260811_030341_add_seasons_collection.down,
    name: '20260811_030341_add_seasons_collection',
  },
  {
    up: migration_20260825_023852_add_theme_slug_enum.up,
    down: migration_20260825_023852_add_theme_slug_enum.down,
    name: '20260825_023852_add_theme_slug_enum',
  },
  {
    up: migration_20260825_043421_add_difficulty_progress.up,
    down: migration_20260825_043421_add_difficulty_progress.down,
    name: '20260825_043421_add_difficulty_progress',
  },
  {
    up: migration_20260825_083737_drop_progression_global.up,
    down: migration_20260825_083737_drop_progression_global.down,
    name: '20260825_083737_drop_progression_global',
  },
  {
    up: migration_20260825_155820_add_hero_intro.up,
    down: migration_20260825_155820_add_hero_intro.down,
    name: '20260825_155820_add_hero_intro',
  },
  {
    up: migration_20260825_164527_store_mythic_plus_runs.up,
    down: migration_20260825_164527_store_mythic_plus_runs.down,
    name: '20260825_164527_store_mythic_plus_runs'
  },
];
