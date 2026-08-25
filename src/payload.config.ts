import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";
import sharp from "sharp";

import { Users } from "./collections/Users";
import { Media } from "./collections/Media";
import { Seasons } from "./collections/Seasons";
import { GuildSettings } from "./globals/GuildSettings";
import { OfficersSection } from "./globals/OfficersSection";
import { RecruitmentSection } from "./globals/RecruitmentSection";
import { GuildDetails } from "./globals/GuildDetails";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Seasons],
  // `progression` was retired 2026-08-25 (season-rollover ticket `11`). It was
  // the single-Season predecessor of the Seasons collection; once Seasons
  // shipped nothing read it, and it sat in the admin panel looking
  // authoritative while changing nothing on the site. Its last contents are
  // preserved in .scratch/season-rollover/season-1-snapshot.json.
  globals: [GuildSettings, OfficersSection, RecruitmentSection, GuildDetails],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || "",
    },
    // Schema changes go through committed migrations, never dev-mode auto-push.
    // Auto-push silently diverges dev from prod: it creates columns locally that
    // production never gets, and a missing column fails the *entire* document
    // read, not just that field. See docs/adr/0004.
    push: false,
  }),
  sharp,
  plugins: [],
});
