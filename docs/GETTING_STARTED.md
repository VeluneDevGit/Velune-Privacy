# Getting started

1. Install Node.js 22.14+ or 24.
2. Run `npm ci` from the repository root.
3. Run `npm run dev` and open http://localhost:5173.
4. Run `npm run typecheck`, `npm run test:ci` and `npm run check:assets` before changing a production deployment.

## Holder access settings

Set `VELUNE_CONTRACT_ADDRESS`, `ROBINHOOD_RPC_URL` and `ROBINHOOD_CHAIN_ID` in the runtime environment. The token address must be the actual VELUNE token; it is distinct from the pool and USDG token addresses. Without these settings the access API does not grant holder access. Never place credentials in source control.

## Deployment

This snapshot preserves the application's existing build integration. GitHub Actions validates source and builds; it does not deploy the live website or receive its deployment credentials.
