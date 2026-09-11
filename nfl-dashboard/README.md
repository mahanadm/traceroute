# NFL Dashboard

A single-file, zero-dependency dashboard for the current NFL season: live scores,
the full week-by-week schedule, standings, every team's season, statistical
leaders and headlines.

**Open `index.html` in a browser.** There is no build step and nothing to install.

If a tab reports *"Failed to fetch"*, serve the file over HTTP instead of opening
it directly — a `file://` page sends `Origin: null`, which some ESPN endpoints
reject even though others allow it:

```
cd nfl-dashboard && python3 -m http.server 8000
# then open http://localhost:8000
```

## What's in it

| Tab | What it shows |
| --- | --- |
| **Games** | Every game in the selected week, grouped by day. Live games show quarter, clock, down & distance, possession and last play; finals show the box score; upcoming games show kickoff time, TV and the spread/total. A ticker across the top carries the whole slate. |
| **Standings** | All eight divisions with W-L-T, win %, points for/against, point differential, division record and current streak. Toggle to a straight conference ranking. Click any team to open it. |
| **Teams** | All 32 teams by conference and division. Each opens to its record, division position, next game and full season schedule with results. |
| **Leaders** | Season statistical leaders by category. |
| **News** | Latest headlines. |

Also: light/dark toggle, deep links (`#standings`, `#teams/2`), keyboard-free week
stepping, and kickoff times rendered in your local timezone.

## Where the data comes from

ESPN's public JSON endpoints, fetched directly from your browser:

- `site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`
- `site.api.espn.com/apis/v2/sports/football/nfl/standings`
- `.../teams`, `.../teams/{id}`, `.../teams/{id}/schedule`
- `.../leaders`, `.../news`

These are undocumented and unofficial. They are widely used and stable in
practice, but ESPN can change or withdraw them without notice — so the page is
written to degrade rather than break:

- Each tab surfaces a readable error instead of a blank screen.
- A failed refresh reuses the last good response rather than clearing the view.
- If the standings endpoint is unavailable, standings are **recomputed locally**
  from completed game results (W-L-T, points and division records are then
  accurate; playoff seeding and tiebreakers are not applied) and the page says so.
- Missing logos collapse silently instead of showing broken images.
- The **Teams** tab does not need the team-list endpoint at all: all 32 teams,
  their ESPN ids, divisions and colors are built in, so the grid always renders.
  ESPN's list is still preferred when it answers, for current logos and colors.
- If a team's own endpoints are unavailable, its record and full schedule are
  **derived from the weekly scoreboard** instead, and the page says so.

The season, season type and current week are read from the API's own scoreboard
response, so the dashboard follows the real NFL calendar instead of a hardcoded
date. It auto-refreshes every 30s while a game is live, every 5 minutes otherwise.

## Tests

`test/dashboard.test.cjs` renders the page in headless Chromium against mocked
ESPN payloads and asserts what actually reaches the screen — live/final/upcoming
game states, standings parsing, both score encodings ESPN uses, the local
standings fallback, mobile layout, and the total-outage path.

```
npm i playwright && npx playwright install chromium
node test/dashboard.test.cjs          # screenshots land in test/screenshots/
```

Set `CHROME_PATH` to use a browser that's already installed.
