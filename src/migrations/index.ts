import * as migration_20260804_235225_baseline from './20260804_235225_baseline';

export const migrations = [
  {
    up: migration_20260804_235225_baseline.up,
    down: migration_20260804_235225_baseline.down,
    name: '20260804_235225_baseline',
  },
];
