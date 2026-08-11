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
import { Progression } from "./globals/Progression";
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
  globals: [GuildSettings, Progression, OfficersSection, RecruitmentSection, GuildDetails],
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
