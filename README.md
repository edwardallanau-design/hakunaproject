Next.js + Payload CMS site for the guild.

## Getting Started

Development runs against a local Postgres in Docker, never against production.

```bash
cp .env.example .env.local   # points DATABASE_URL at the local database
npm install
npm run db:up                # start Postgres (docker-compose.yml)
npm run migrate              # create the schema
npm run seed                 # admin user + required fields
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), and [/admin](http://localhost:3000/admin) to log in
(`dev@example.com` / `devpassword` by default).

`npm run seed -- --sync` additionally pulls live guild data from Raider.IO, so the
site renders real content. The seed script refuses to run against any host that is
not localhost.

### Database commands

| Command | Effect |
| --- | --- |
| `npm run db:up` | Start Postgres. Data persists between restarts. |
| `npm run db:down` | Stop it, keeping the data. |
| `npm run db:reset` | Wipe it and rebuild: migrate + seed from scratch. |

## Schema changes

The schema is defined by the migrations in `src/migrations/`, **not** by Payload's
dev-mode auto-push, which is disabled (`push: false`). After changing a collection
or global:

```bash
npm run migrate:create   # generates the migration — commit it
npm run migrate          # applies it locally
```

`npm run build` runs `payload migrate` first, so a deploy cannot ship code whose
schema has not been applied. See [ADR 0004](docs/adr/0004-schema-changes-go-through-committed-migrations.md)
for why this exists — skipping it previously broke production.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
