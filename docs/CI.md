# CI setup

Create a repository named `Velune-Privacy` and push this source to its `main` branch. GitHub Actions starts on a push and on pull requests; all three workflows also support manual dispatch. Each checks real source or output and propagates failures.

After the repository owner is known, place real badges in README.md using:

`https://github.com/OWNER/Velune-Privacy/actions/workflows/quality.yml/badge.svg?branch=main`

`https://github.com/OWNER/Velune-Privacy/actions/workflows/build.yml/badge.svg?branch=main`

`https://github.com/OWNER/Velune-Privacy/actions/workflows/integrity.yml/badge.svg?branch=main`

Replace OWNER with the actual account or organization. Do not use static passing badges. A manual rerun reruns existing checks; it does not create evidence of a new code change. Enable branch protection after the first successful checks so pull requests must pass before merging.
