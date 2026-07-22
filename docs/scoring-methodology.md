# Migration Confidence Score

Forklane assigns every open-source project a **Migration Confidence Score** from 0 to 100. The score estimates how confidently a team could migrate to or adopt a given tool, based on signals gathered from GitHub, npm, PyPI, and crates.io.

## Overview

The score is a weighted sum of five sub-scores, each independently scored 0–100:

| Sub-score | Weight | What it measures |
|-----------|--------|-----------------|
| Activity Trend | 30% | Recent development velocity — stars, releases, commits, downloads |
| License Compatibility | 25% | Legal permissiveness for commercial use |
| Self-Hosting Complexity | 15% | How easy it is to run and maintain independently |
| Data Export Capability | 15% | Ability to import/export data, avoiding vendor lock-in |
| Community Health | 15% | Contributor engagement, issue management, documentation |

**Final score = Σ (sub-score / 100 × weight) × 100**

## Sub-scores in detail

### Activity Trend (30%)

Measures whether the project is alive and actively maintained.

| Signal | Range | Scoring |
|--------|-------|---------|
| GitHub stars | 0–30 pts | 50k+ → 30, 10k+ → 25, 5k+ → 20, 1k+ → 15, 100+ → 10, 10+ → 5 |
| Forks | 0–15 pts | 5k+ → 15, 1k+ → 12, 200+ → 8, 50+ → 4 |
| Latest release age | 0–20 pts | <30d → 20, <90d → 15, <180d → 10, <365d → 5 |
| Last push | 0–15 pts | <7d → 15, <30d → 12, <90d → 8, <180d → 4 |
| Version count | 0–10 pts | 50+ → 10, 20+ → 8, 10+ → 5, 3+ → 3 |
| Download volume | 0–10 pts | 1M+ → 10, 100k+ → 8, 10k+ → 5, 1k+ → 3 |

### License Compatibility (25%)

Evaluates how permissive the project's license is for commercial adoption.

| License type | Score | Examples |
|-------------|-------|---------|
| Permissive | 100 | MIT, ISC, BSD-2-Clause, BSD-3-Clause, Apache-2.0, Unlicense, CC0 |
| Weak copyleft | 60 | LGPL-2.1, LGPL-3.0, MPL-2.0, EPL-1.0, EPL-2.0 |
| Strong copyleft | 25 | GPL-2.0, GPL-3.0, AGPL-3.0, SSPL-1.0 |
| Unknown/present | 40 | License detected but not in known lists |
| Missing | 0 | No license found |

### Self-Hosting Complexity (15%)

Estimates operational overhead for running the project independently.

- **Baseline: 70** — most open-source tools are reasonably self-hostable.
- **+10** per simple indicator (Docker, SQLite, flat-file, single binary).
- **+10** if Docker is mentioned.
- **-15** per complex indicator (Kubernetes, Terraform, Mesos, Consul).
- **-10** if a database server (Postgres, MySQL, MongoDB) is required.

Score is clamped to 0–100.

### Data Export Capability (15%)

Measures how easily data can be moved in and out of the tool.

- **Baseline: 50** — most tools have some form of data handling.
- **+8** per export-related keyword (export, import, migrate, backup, JSON, CSV, YAML, API).
- **+15** if REST, GraphQL, or API is mentioned.
- **+5** if CLI/command-line interface is available.

Score is clamped to 0–100.

### Community Health (15%)

Assesses the strength and responsiveness of the project's community.

| Signal | Range | Scoring |
|--------|-------|---------|
| Stars-to-forks ratio | 0–25 pts | Ratio 2–20 → 25, 1–30 → 18, else → 15 |
| Open issues count | 0–25 pts | 0 → 20, <50 → 25, <200 → 18, <500 → 10, else → 5 |
| Has description | 0–15 pts | >20 chars → 15, >5 → 8 |
| Has homepage | 0–15 pts | Present → 15 |
| Has repository URL | 0–20 pts | Present → 20, else → 5 |

## Interpreting scores

| Score range | Interpretation |
|-------------|---------------|
| 80–100 | Excellent — active, permissive, well-documented, community-backed |
| 60–79 | Good — solid project, minor concerns (e.g. copyleft license, older release) |
| 40–59 | Fair — usable but evaluate carefully (missing license, low activity, or complex setup) |
| 20–39 | Weak — significant concerns (archived, abandoned, or restrictive license) |
| 0–19 | Poor — do not recommend migration without deep evaluation |

## Limitations

- The score is derived from publicly available metadata. It does not assess code quality, security vulnerabilities, or actual runtime behavior.
- Download counts and star counts are proxies for adoption, not guarantees.
- A high score on one source (e.g. GitHub) does not compensate for a low score on another (e.g. missing license on PyPI).
- The scoring weights may be adjusted as Forklane evolves. Historical scores are preserved in `scoreBreakdown` for comparison.
