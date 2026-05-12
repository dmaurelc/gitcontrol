# GitControl

A self-hosted, private alternative to the GitHub dashboard. Built for developers who want a clean view, their own controls, and their data on their own infrastructure.

## What it is

GitControl is a **self-hosted dashboard** that replaces GitHub's default UI. It gives you a streamlined interface to manage your repositories, issues, pull requests, stars, and projects — without the noise.

Instead of navigating github.com (with all its sections and notifications), you open your own GitControl instance on your server, see exactly what you need, and keep full control of your data and GitHub credentials.

## Who it's for

- **Solo developers** juggling multiple accounts (personal + organizations) tired of context-switching on GitHub
- **Small teams** that want a shared dashboard without paying for GitHub Enterprise, hosted on their own servers
- **Power users** who prefer custom filters, personalized views, and data on their own infrastructure

## Key features

- **Secure auth**: GitHub OAuth + encrypted tokens stored on your server
- **Dashboard overview**: quick metrics (repos, stars, open PRs, issues)
- **Repository manager**: list, search, filter by language, pin favorites, create new
- **Repo details**: issues and pull requests per repository
- **Stars, Projects, Packages**: access to GitHub Stars, Projects v2, and Packages
- **Multi-context**: switch between your personal account and organizations without leaving the app
- **Privacy first**: all data and credentials live on your server

## Self-hosted

GitControl is designed to run on your own infrastructure. It's not a SaaS — you deploy an instance, give access to whoever needs it, and that's it.

**Live demo**: [https://dev.webkode.cl](https://dev.webkode.cl)

## Status

**MVP shipped** (May 2026). Core features working. Post-MVP improvements ongoing.

## Documentation

- [Project overview](./docs/project-overview-pdr.md)
- [Deployment guide](./docs/deployment-guide.md)
- [Codebase structure](./docs/codebase-summary.md)
- [System architecture](./docs/system-architecture.md)

## License

Private. Self-hosting only — not a SaaS.
