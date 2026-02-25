# Meeting Room Booking System

This repository contains a small meeting room booking system with a NestJS backend and a React/Vite frontend.

## Time handling & booking rules

- **Time format**: All booking times are sent and returned as ISO 8601 datetimes (for example, `2026-02-25T10:00:00Z`).
- **Timezone**: Times are stored and compared in UTC on the server.
- **Overlap logic**:
  - `startTime` must be strictly **before** `endTime`.
  - Back‑to‑back bookings (one booking ending exactly when the next begins) are **allowed**.
  - Any other overlap (identical ranges, partial overlaps, or one range fully inside another) is **rejected**.

## Why Turborepo & NestJS

- **Turborepo (monorepo tooling)**  
  - Keeps **backend and frontend in a single repo**, which makes it easier to share types and coordinate changes.  
  - Gives **fast, incremental builds** and clear task pipelines (`build`, `lint`, `test`) for each app.  
  - Matches real‑world setups where teams manage multiple services from one monorepo.

- **NestJS (backend framework)**  
  - Provides a **structured, modular architecture** (modules, controllers, services) that fits an API with users, bookings, and role‑based permissions.  
  - Has **first‑class TypeScript support** and good patterns for validation, guards, and dependency injection, which keeps the permission rules and booking logic easy to test and extend.  
  - Integrates well with common NodeJS tooling and makes it straightforward to expose REST endpoints required by the assignment.

## Deployment overview

- **Backend API (NestJS)** – Render Web Service  
  - Root directory: `apps/backend`  
  - Build command: `bun install && bun run build`  
  - Start command: `bun run start:prod`  
  - Env vars: `MONGODB_URI` (MongoDB Atlas connection string).

- **Database (MongoDB Atlas)**  
  - Free cluster with database name `meeting-room`.  
  - One application user with limited credentials.  
  - Network Access: IP allowlist includes `0.0.0.0/0` so Render can connect.

- **Frontend (React/Vite)** – Vercel  
  - Root directory: `apps/web`  
  - Build command: `bun install && bun run build`  
  - Env vars: `VITE_API_URL` set to the Render backend URL (for example, `https://booking-ia2r.onrender.com`).

---

# Turborepo starter

This Turborepo starter is maintained by the Turborepo core team.

## Using this example

Run the following command:

```sh
npx create-turbo@latest
```

## What's inside?

This Turborepo includes the following packages/apps:

### Apps and Packages

- `docs`: a [Next.js](https://nextjs.org/) app
- `web`: another [Next.js](https://nextjs.org/) app
- `@repo/ui`: a stub React component library shared by both `web` and `docs` applications
- `@repo/eslint-config`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)
- `@repo/typescript-config`: `tsconfig.json`s used throughout the monorepo

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Build

To build all apps and packages, run the following command:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed (recommended)
turbo build

# Without [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation), use your package manager
npx turbo build
yarn dlx turbo build
pnpm exec turbo build
```

You can build a specific package by using a [filter](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed (recommended)
turbo build --filter=docs

# Without [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation), use your package manager
npx turbo build --filter=docs
yarn exec turbo build --filter=docs
pnpm exec turbo build --filter=docs
```

### Develop

To develop all apps and packages, run the following command:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev

# Without [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev
yarn exec turbo dev
pnpm exec turbo dev
```

You can develop a specific package by using a [filter](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev --filter=web

# Without [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev --filter=web
yarn exec turbo dev --filter=web
pnpm exec turbo dev --filter=web
```

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.dev/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed (recommended)
turbo login

# Without [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation), use your package manager
npx turbo login
yarn exec turbo login
pnpm exec turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```
# With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed (recommended)
turbo link

# Without [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation), use your package manager
npx turbo link
yarn exec turbo link
pnpm exec turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.dev/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.dev/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.dev/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.dev/docs/reference/configuration)
- [CLI Usage](https://turborepo.dev/docs/reference/command-line-reference)
