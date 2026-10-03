<a href="https://velune.ft5566942.chatgpt.site"><img src="docs/assets/velune-banner.png" width="100%" alt="Velune — Public world. Private possibilities." /></a>

<h1 align="center">Velune</h1>
<p align="center"><strong>Public world. Private possibilities.</strong></p>
<p align="center">A market terminal, privacy workspace, guided assistant, and local file vault for Robinhood Chain.</p>
<p align="center"><a href="https://velune.ft5566942.chatgpt.site">Open Velune</a> · <a href="https://velune.ft5566942.chatgpt.site/docs">Product docs</a> · <a href="docs/GETTING_STARTED.md">Get started</a> · <a href="docs/ARCHITECTURE.md">Architecture</a></p>


<p align="center"><a href="https://github.com/VeluneDevGit/Velune-Privacy/actions/workflows/quality.yml"><img src="https://github.com/VeluneDevGit/Velune-Privacy/actions/workflows/quality.yml/badge.svg?branch=main" alt="Quality" /></a> <a href="https://github.com/VeluneDevGit/Velune-Privacy/actions/workflows/build.yml"><img src="https://github.com/VeluneDevGit/Velune-Privacy/actions/workflows/build.yml/badge.svg?branch=main" alt="Production build" /></a> <a href="https://github.com/VeluneDevGit/Velune-Privacy/actions/workflows/integrity.yml"><img src="https://github.com/VeluneDevGit/Velune-Privacy/actions/workflows/integrity.yml/badge.svg?branch=main" alt="Repository integrity" /></a> </p>

## One connected experience

| Surface | What you can explore |
| --- | --- |
| Terminal | Memes first, plus majors and stocks; searchable assets, candle history, chart ranges and a trading panel. Major assets have swaps disabled. |
| Workspace | A deliberate connect, unlock, prepare and review experience, gated by a server-side holder check when token and network settings are configured. |
| Vault | Browser-local AES-256-GCM file encryption and decryption. File contents are not uploaded. |
| Agent | A guided interface for understanding the product and preparing next steps. |
| Identity | A responsive particle wordmark, changing scroll backgrounds and a fractured 3D V that assembles, turns and breaks apart. |

## Explore the code

| Area | Location |
| --- | --- |
| Application surfaces | `app/velune.tsx` |
| Market and candle data | `app/api/markets/`, `app/api/chart/` |
| Holder access | `app/api/access/` |
| File encryption | `lib/vault.ts` |
| Scroll timing | `components/velune/journey-timing.ts` |
| Particle wordmark | `components/velune/wordmark-field.ts` |
| Fragment animation | `components/velune/fragment-emblem.ts` |
| Continuous integration | `.github/workflows/` |

## Contracts

These are the project-supplied addresses, not an audit or deployment verification.

| Contract | Address |
| --- | --- |
| ETH pool | `0xEC5266c9e44631e1ba22FD6377C38130c1F3B738` |
| USDG pool | `0xBB0C7F576B7bdAa8f2a119cb295076aCD0C9013f` |
| USDG token | `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168` |

Token ticker: **$VELUNE**.

## Run locally

Use Node.js 22.14 or newer.

```sh
npm ci
npm run dev
```

Open `http://localhost:5173`. Build with `npm run build` and preview the built Worker with `npm start`.

## Checks and GitHub Actions

```sh
npm run typecheck
npm run test:ci
npm run check:assets
npm run build
```

Three workflows run on pushes, pull requests and manual dispatch:

- **Quality:** TypeScript and behavior tests on Node.js 22 and 24.
- **Production build:** a real production build on Node.js 22 and 24.
- **Repository integrity:** required routes, branded assets, contract addresses and README links.

Workflow results appear in the repository's Actions tab after GitHub executes them. See [CI setup](docs/CI.md) for status badges once the repository URL is known.

## Implementation boundaries

The local file vault performs real encryption. Holder access checks use the configured RPC and token address and fail closed when readings are unavailable. Market responses identify cached data when applicable. The workspace and trade interface must not be mistaken for an audited privacy engine or a complete transaction router: this code does not contain the proof circuits, relay or verified swap-execution pipeline described by other products. Connecting a wallet alone does not sign or transfer funds.

## Security

Never commit API keys, private keys, recovery phrases or local environment files. Losing a vault passphrase prevents recovery of the encrypted file. No security audit is claimed. Report sensitive issues privately to the repository owner rather than posting secrets in public issues.
