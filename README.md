# SeasonApproved Launch Party Game Master

Public launch-party game dashboard hosted on Cloudflare Workers with OpenNext. Participants sign in by name, submit Scavenger Hunt photos/screenshots, and watch live Season Team scores. Game Masters review submissions and award points.

## Routes

- `/` — participant name login
- `/dashboard` — participant team and contribution
- `/scavenger-hunt` — camera/screenshot submission
- `/scoreboard` — TV-first live standings
- `/game-master` — submission review and scoring

## Cloudflare resources

- Worker: `season-approved-launch-party-game-master`
- D1: `season-approved-launch-party`
- Private R2 bucket: `season-approved-launch-party-submissions`

## Development

```bash
npm install
npm run cf-typegen
npx wrangler d1 migrations apply season-approved-launch-party --local
npm run dev
```

Run `npm run check`, `npm run cf:build`, and `npm run preview` before deploying.

## After the party

These resources are event-only and intentionally separate from SeasonApproved production data. Delete them only after confirming the event media and scores are no longer needed:

```bash
npx wrangler delete season-approved-launch-party-game-master
npx wrangler d1 delete season-approved-launch-party
npx wrangler r2 bucket delete season-approved-launch-party-submissions
```
