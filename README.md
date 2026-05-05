This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Admin panel

The admin panel lives at `/admin` and is protected by username + password against the `admin_users` table.

### First-time setup

1. Provision a Postgres database (Vercel Postgres or Neon) and set `DATABASE_URL` (or `POSTGRES_URL`) in your environment.
2. Push the schema:
   ```bash
   npx drizzle-kit push
   ```
3. Set the bootstrap credentials in env (used only when no users exist yet):
   ```env
   ADMIN_USERNAME=you
   ADMIN_PASSWORD=a-strong-passphrase
   ADMIN_SECRET=any-long-random-string
   ```
4. Visit `/admin/login`, sign in with `ADMIN_USERNAME` / `ADMIN_PASSWORD`. The first successful login creates an `owner` row in `admin_users` from those values; further logins go through the database.
5. From `/admin/team` you can add more users, change passwords, set roles (`owner` / `admin` / `viewer`), and disable accounts. You can't delete or disable your own account.

### Notes

- Passwords are stored as scrypt hashes (`scrypt$N$r$p$salt$hash`).
- Sessions are signed with `ADMIN_SECRET` (HMAC-SHA256) and last 7 days.
- Once at least one user exists, the `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars stop being honored; manage credentials in `/admin/team` instead.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
