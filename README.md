# DevFest Finder

A simple, open-source directory and URL redirector for Google Developer Group (GDG) DevFest events using the `devfe.st` domain.

## Features

- Short, memorable URLs for DevFest events (e.g., `devfe.st/bangalore`)
- Directory listing of all DevFest events globally
- Search and filter functionality
- Redirect and directory data updates without rebuilding the frontend
- Theme-aware interface with light and dark modes
- Interactive map with location markers
- Secure update mechanism via GitHub Issues and approval workflow

## Architecture

```
devfe.st/berlin     → Cloudflare Bulk Redirect → 301 at edge
devfe.st/           → GitHub Pages (static Next.js export)
devfe.st/typo       → GitHub Pages 404 → soft redirect to /?notFound=typo
```

| Component | Role |
|-----------|------|
| **GitHub Pages** | Static frontend (directory, map, search) |
| **Cloudflare Bulk Redirects** | Edge 301 redirects for known slugs (`devfe.st` only) |
| **`data/devfest-data.json`** | Source of truth for redirects and directory data |
| **GitHub Actions** | Issue → PR workflow, Cloudflare sync, JSON hot-deploy |

Redirects are scoped to `devfe.st` via a host-filtered Bulk Redirect Rule — other domains on your Cloudflare account are not affected.

## Technology Stack

- **Frontend**: Next.js (static export), TypeScript, Tailwind CSS, shadcn/ui
- **Redirects**: Cloudflare Bulk Redirects (account-level list, host-scoped rule)
- **Data Storage**: Static JSON file in the repository
- **Deployment**: GitHub Pages (`gh-pages` branch)
- **Automation**: GitHub Actions
- **Mapping**: Leaflet with theme-aware tiles

## Getting Started

### Prerequisites

- Node.js 20+ and npm

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/choraria/devfest.git
   cd devfest
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file (optional):
   ```
   NEXT_PUBLIC_SITE_URL=https://devfe.st
   NEXT_PUBLIC_GA_ID=your-ga-id
   ```

4. Start the development server:
   ```
   npm run dev
   ```

## Data Structure

Each redirect entry contains:

### Required Fields:
- `slug`: URL slug (e.g., `bangalore`)
- `destinationUrl`: The URL to redirect to (must be HTTPS)
- `devfestDate`: Date of the DevFest event (YYYY-MM-DD format)
- `devfestName`: Name of the DevFest event
- `updatedBy`: GitHub username of last updater
- `updatedAt`: ISO timestamp of last update

### Optional Fields:
- `gdgChapter`: GDG chapter name
- `city`: City name
- `countryName`: Country name
- `countryCode`: Country code (ISO)
- `latitude`: Geographic coordinates
- `longitude`: Geographic coordinates
- `gdgUrl`: GDG chapter URL

## Requesting URL Updates

To request a URL add or update:

1. Go to the [Issues page](https://github.com/choraria/devfest/issues/new?assignees=&labels=update-url&template=url_update.yml&title=Update+DevFest+details%3A+%5BCity%5D+%28slug%3A+city-name%29)
2. Fill out the required information in the issue template
3. Submit the issue

When the PR is merged to `main`:
1. `sync-redirects.yml` pushes redirects to Cloudflare Bulk Redirects
2. `devfest-data.json` is hot-deployed to GitHub Pages (no frontend rebuild)
3. The directory UI fetches live data on page load

## Deployment Setup

### 1. GitHub Pages

1. Repo **Settings → Pages → Build and deployment → Source**: Deploy from branch
2. Branch: `gh-pages` / `/ (root)`
3. Custom domain: `devfe.st`
4. Enable **Enforce HTTPS** after certificate provisioning

The `deploy-frontend.yml` workflow builds and deploys the static site to `gh-pages` on code changes only.

### 2. GitHub Actions Secrets and Variables

Configure at **Settings → Secrets and variables → Actions**:

| Name | Type | Description |
|------|------|-------------|
| `CLOUDFLARE_API_TOKEN` | Secret | API token with Bulk URL Redirects + Account Filter Lists Edit |
| `CLOUDFLARE_ACCOUNT_ID` | Secret | Cloudflare account ID |
| `CLOUDFLARE_REDIRECT_LIST_ID` | Secret | Bulk redirect list ID (from bootstrap script) |
| `PAT_GITHUB_TOKEN` | Secret | PAT with `contents: write` for issue workflow and JSON hot-deploy |
| `NEXT_PUBLIC_GA_ID` | Variable | Google Analytics ID (optional) |
| `NEXT_PUBLIC_SITE_URL` | Variable | `https://devfe.st` |
| `DEVFEST_HOST` | Variable | `devfe.st` |

### 3. Cloudflare Bootstrap (one-time)

```bash
export CLOUDFLARE_ACCOUNT_ID=your_account_id
export CLOUDFLARE_API_TOKEN=your_api_token
node scripts/bootstrap-cloudflare.mjs
```

Save the printed `CLOUDFLARE_REDIRECT_LIST_ID` as a GitHub secret, then run the initial sync:

```bash
export CLOUDFLARE_REDIRECT_LIST_ID=your_list_id
export DEVFEST_HOST=devfe.st
node scripts/sync-cloudflare-redirects.mjs
```

### 4. Cloudflare API Token Permissions

| Permission | Access |
|-----------|--------|
| Account → Bulk URL Redirects | Edit |
| Account → Account Filter Lists | Edit |
| Account → Account Filter Lists | Read |

### 5. DNS Migration (Netim → Cloudflare → GitHub Pages)

Today `devfe.st` DNS is at Netim pointing to Vercel.

**Step 1 — Add site to Cloudflare:**
1. [dash.cloudflare.com](https://dash.cloudflare.com) → Add site → `devfe.st` → Free plan
2. Delete Vercel A/CNAME records from the scanned list
3. Copy Cloudflare nameservers
4. Netim → domain → Nameservers → replace with Cloudflare NS
5. Wait until Cloudflare shows **Active**

**Step 2 — Cloudflare DNS records (when ready to cut over):**

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `@` | `185.199.108.153` | Proxied |
| A | `@` | `185.199.109.153` | Proxied |
| A | `@` | `185.199.110.153` | Proxied |
| A | `@` | `185.199.111.153` | Proxied |
| CNAME | `www` | `choraria.github.io` | Proxied |

**Step 3 — Cloudflare SSL/TLS:**
- SSL/TLS mode: **Full** (not Flexible)
- Enable **Always Use HTTPS**

**Step 4 — Cutover order:**
1. Merge migration PR and run `deploy-frontend.yml`
2. Run Cloudflare bootstrap + initial redirect sync
3. Verify `curl -sI https://devfe.st/berlin` returns `301`
4. Switch Cloudflare DNS from Vercel to GitHub Pages IPs
5. Enable GitHub Pages custom domain + Enforce HTTPS
6. Decommission Vercel after 24–48h verification

### 6. Verification

| Test | Expected |
|------|----------|
| `curl -sI https://devfe.st/berlin` | `301` to GDG destination |
| `curl -sI https://devfe.st/` | `200` directory page |
| `curl -sI https://devfe.st/devfest-data.json` | `200` valid JSON |
| Visit `https://devfe.st/typo-slug` | Toast + filtered directory |
| Merge JSON change | Redirect live within ~2 min, no frontend rebuild |
| `curl -sI https://your-other-domain.com/berlin` | No DevFest redirect |

## Features in Detail

### Theme-Aware Map
- Automatically switches between light and dark modes
- Uses grayscale styling in dark mode for better visibility
- Maintains colored markers in both modes

### Directory Interface
- Searchable by DevFest name and location
- Filterable by country
- Sortable date column
- Quick copy functionality for short URLs
- Direct links to update existing entries

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Developer Groups (GDG) for organizing DevFest events worldwide
- The open-source community for the tools that make this project possible
