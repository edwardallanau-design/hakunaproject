import * as migration_20260804_235225_baseline from './20260804_235225_baseline';
import * as migration_20260811_030341_add_seasons_collection from './20260811_030341_add_seasons_collection';

export const migrations = [
  {
    up: migration_20260804_235225_baseline.up,
    down: migration_20260804_235225_baseline.down,
    name: '20260804_235225_baseline',
  },
  {
    up: migration_20260811_030341_add_seasons_collection.up,
    down: migration_20260811_030341_add_seasons_collection.down,
    name: '20260811_030341_add_seasons_collection'
  },
];
