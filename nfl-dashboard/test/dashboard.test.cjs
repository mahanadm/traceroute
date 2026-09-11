/*
 * Renders the dashboard against mocked ESPN payloads in headless Chromium and
 * asserts what ends up on screen. The fixtures mirror the real endpoint shapes,
 * including the two different ways ESPN encodes a competitor's score.
 *
 *   npm i playwright && npx playwright install chromium
 *   node test/dashboard.test.cjs
 */
const { chromium } = require('playwright');
const F = require('./fixtures.cjs');
const path = require('path');
const fs = require('fs');

const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const OUT = process.env.SHOT_DIR || path.join(__dirname, 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

const fails = [];
const check = (name, cond, extra='') => { console.log((cond?'  PASS  ':'  FAIL  ')+name+(extra?' :: '+extra:'')); if(!cond) fails.push(name); };

(async () => {
  // CHROME_PATH lets CI point at a preinstalled browser; otherwise Playwright's own.
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  const json = b => ({ status: 200, contentType: 'application/json', body: JSON.stringify(b) });
  const hits = [];
  await page.route('**/*', route => {
    const url = route.request().url();
    if (url.startsWith('file://')) return route.continue();
    hits.push(url);
    if (/a\.espncdn\.com|\.jpg|\.png/.test(url)) return route.abort();
    if (/\/standings/.test(url)) return route.fulfill(json(F.standings));
    if (/\/teams\/\d+\/schedule/.test(url)) return route.fulfill(json(F.teamSchedule));
    if (/\/teams\/\d+(\?|$)/.test(url)) return route.fulfill(json(F.teamDetail));
    if (/\/teams(\?|$)/.test(url)) return route.fulfill(json(F.teams));
    if (/\/leaders/.test(url)) return route.fulfill(json(F.leaders));
    if (/\/news/.test(url)) return route.fulfill(json(F.news));
    if (/\/scoreboard/.test(url)) return route.fulfill(json(F.scoreboard));
    return route.fulfill({ status: 404, body: '{}' });
  });

  await page.goto(PAGE);
  await page.waitForSelector('.game', { timeout: 10000 });

  console.log('\n--- GAMES ---');
  check('season label shows 2026 / week 2', /2026.*Regular Season.*Week 2/.test(await page.textContent('#seasonLabel')), await page.textContent('#seasonLabel'));
  check('three game cards', (await page.$$('.game')).length === 3);
  check('live game flagged', (await page.$$('.game.live')).length === 1);
  check('final score rendered', (await page.textContent('.game')).includes('31'));
  check('loser row dimmed on final', (await page.$$('.game .trow.loser')).length === 1);
  check('records shown', (await page.textContent('.game')).includes('1-0'));
  check('ticker visible with 3 entries', (await page.$$('#tickerInner .tick')).length === 3);
  check('live ticker entry marked', (await page.$$('#tickerInner .st.is-live')).length === 1);
  const liveCard = await page.textContent('.game.live');
  check('down & distance on live game', liveCard.includes('2nd & 7'), '');
  check('last play on live game', liveCard.includes('Mahomes'));
  check('possession dot present', (await page.$$('.game.live .poss')).length === 1);
  const preCard = (await page.$$('.game'))[2];
  check('odds on upcoming game', (await preCard.textContent()).includes('O/U 44.5'));
  check('note headline shown', (await page.textContent('#view')).includes('NFC West showdown'));
  check('day grouping present', (await page.$$('.daygroup')).length >= 2);
  await page.screenshot({ path: OUT + '/01-games.png', fullPage: true });

  console.log('\n--- WEEK NAV ---');
  await page.selectOption('.toolbar select:nth-of-type(1)', '3');
  await page.waitForTimeout(400);
  check('postseason week labels', (await page.textContent('.toolbar')).includes('Wild Card'));
  await page.selectOption('.toolbar select:nth-of-type(1)', '2');
  await page.waitForTimeout(400);

  console.log('\n--- STANDINGS ---');
  await page.click('nav.tabs button:has-text("Standings")');
  await page.waitForSelector('.divbox', { timeout: 10000 });
  check('division boxes rendered', (await page.$$('.divbox')).length === 3);
  check('AFC heading', (await page.textContent('#view')).includes('American Football Conference'));
  const sTxt = await page.textContent('.divbox');
  check('wins/losses parsed', sTxt.includes('Buffalo Bills') && sTxt.includes('1.000'));
  check('differential signed +', (await page.textContent('#view')).includes('+25'));
  check('negative differential styled', (await page.$$('.divbox td.neg')).length >= 1);
  check('streak column', sTxt.includes('W2'));
  check('no "rebuilt locally" note when API works', !(await page.textContent('#view')).includes('Rebuilt locally'));
  await page.screenshot({ path: OUT + '/02-standings.png', fullPage: true });
  await page.click('.toolbar .chipbtn:has-text("By conference")');
  await page.waitForTimeout(400);
  check('conference view collapses to 2 boxes', (await page.$$('.divbox')).length === 2);
  await page.click('.toolbar .chipbtn:has-text("By division")');
  await page.waitForTimeout(300);

  console.log('\n--- TEAMS ---');
  await page.click('nav.tabs button:has-text("Teams")');
  await page.waitForSelector('.tcard', { timeout: 10000 });
  check('all 32 teams rendered', (await page.$$('.tcard')).length === 32);
  check('division subtitle', (await page.textContent('.tcard')).includes('AFC East'));
  await page.screenshot({ path: OUT + '/03-teams.png', fullPage: true });

  await page.click('.tcard:has-text("Buffalo Bills")');
  await page.waitForSelector('.thero', { timeout: 10000 });
  const hero = await page.textContent('.thero');
  check('team hero record', hero.includes('2-0') && hero.includes('1st in AFC East'));
  check('next game card', (await page.textContent('#view')).includes('Next game'));
  check('schedule rows', (await page.$$('.srow')).length === 2);
  const row1 = await page.textContent('.srow');
  check('object-shaped score parsed (31-17)', row1.includes('31-17'), row1.trim());
  check('W result marker', row1.includes('W'));
  check('home/away prefix', row1.includes('vs New York Jets'));
  const row2 = await (await page.$$('.srow'))[1].textContent();
  check('away game prefix @', row2.includes('@ Kansas City Chiefs'), row2.trim());
  check('deep-link hash updated', page.url().includes('#teams/2'), page.url());
  await page.screenshot({ path: OUT + '/04-team-detail.png', fullPage: true });
  await page.click('.backbtn');
  await page.waitForSelector('.tcard', { timeout: 5000 });
  check('back to team grid', (await page.$$('.tcard')).length === 32);

  console.log('\n--- LEADERS ---');
  await page.click('nav.tabs button:has-text("Leaders")');
  await page.waitForSelector('.leadbox', { timeout: 10000 });
  check('empty category filtered out', (await page.$$('.leadbox')).length === 2);
  check('leader value', (await page.textContent('.leadbox')).includes('661'));
  check('position appended', (await page.textContent('.leadbox')).includes('Josh Allen · QB'));
  await page.screenshot({ path: OUT + '/05-leaders.png', fullPage: true });

  console.log('\n--- NEWS ---');
  await page.click('nav.tabs button:has-text("News")');
  await page.waitForSelector('.ncard', { timeout: 10000 });
  check('news cards', (await page.$$('.ncard')).length === 2);
  check('headline text', (await page.textContent('.ncard')).includes('Bills roll past Jets'));
  check('relative time', /(ago|in )/.test(await page.textContent('#view')), (await page.textContent('.ncard')).slice(0,60));
  await page.screenshot({ path: OUT + '/06-news.png', fullPage: true });

  console.log('\n--- THEME + MOBILE ---');
  const theme0 = await page.getAttribute('html', 'data-theme');
  await page.click('#themeBtn');
  await page.waitForTimeout(200);
  const theme1 = await page.getAttribute('html', 'data-theme');
  check('theme toggles', theme1 !== theme0, theme0 + ' -> ' + theme1);
  check('both themes paint a background', await page.evaluate(() =>
    getComputedStyle(document.body).backgroundColor !== 'rgba(0, 0, 0, 0)'));
  await page.click('#themeBtn');
  await page.waitForTimeout(150);
  check('theme toggles back', await page.getAttribute('html', 'data-theme') === theme0);

  await page.click('nav.tabs button:has-text("Games")');
  await page.waitForSelector('.game');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('no horizontal overflow at 390px', overflow <= 1, 'overflow=' + overflow);
  await page.screenshot({ path: OUT + '/07-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1280, height: 1000 });

  console.log('\n--- FAILURE HANDLING ---');
  const p2 = await ctx.newPage();
  const e2 = []; p2.on('pageerror', e => e2.push(e.message));
  await p2.route('**/*', route => {
    const url = route.request().url();
    if (url.startsWith('file://')) return route.continue();
    if (/a\.espncdn\.com|\.jpg|\.png/.test(url)) return route.abort();
    if (/\/standings/.test(url)) return route.fulfill({ status: 500, body: 'boom' });
    if (/\/scoreboard/.test(url)) return route.fulfill(json(F.scoreboard));
    if (/\/teams(\?|$)/.test(url)) return route.fulfill(json(F.teams));
    return route.fulfill({ status: 500, body: 'boom' });
  });
  await p2.goto(PAGE + '#standings');
  await p2.waitForSelector('.divbox, .note', { timeout: 20000 });
  const stTxt = await p2.textContent('#view');
  check('standings fall back to local computation', stTxt.includes('Rebuilt locally'), stTxt.slice(0, 120));
  check('computed standings produce 8 divisions', (await p2.$$('.divbox')).length === 8);
  check('computed record from scoreboard results', stTxt.includes('Buffalo Bills'));
  check('winless teams still get full names', stTxt.includes('Miami Dolphins'), stTxt.slice(300,430));
  const rowH = await p2.evaluate(() => Math.max(...[...document.querySelectorAll('.divbox td')].map(td => Math.round(td.getBoundingClientRect().height))));
  check('standings cells stay on one line', rowH <= 36, 'tallest cell ' + rowH + 'px');
  check('wide tables scroll instead of squashing', await p2.evaluate(() =>
    [...document.querySelectorAll('.tablewrap')].every(w => w.scrollWidth >= w.clientWidth)));
  await p2.screenshot({ path: OUT + '/08-standings-fallback.png', fullPage: true });

  // /teams works here but /teams/{id} and /teams/{id}/schedule are down
  await p2.goto(PAGE + '#teams/2');
  await p2.waitForSelector('.thero', { timeout: 20000 });
  check('team detail survives dead team endpoints', (await p2.textContent('.thero')).includes('Buffalo Bills'),
    (await p2.textContent('.thero')).trim());
  check('schedule derived from scoreboard', (await p2.$$('.srow')).length > 0);
  check('derivation is disclosed', (await p2.textContent('#view')).includes('assembled from the weekly scoreboard'));
  check('record computed from derived games', /Record \d+-\d+/.test(await p2.textContent('.thero')),
    (await p2.textContent('.thero')).trim());
  await p2.screenshot({ path: OUT + '/10-team-detail-fallback.png', fullPage: true });

  const pT = await ctx.newPage();
  await pT.route('**/*', route => {
    const url = route.request().url();
    if (url.startsWith('file://')) return route.continue();
    if (/a\.espncdn\.com|\.jpg|\.png/.test(url)) return route.abort();
    if (/\/teams(\?|$)/.test(url)) return route.abort();   // the reported failure
    if (/\/scoreboard/.test(url)) return route.fulfill(json(F.scoreboard));
    if (/\/standings/.test(url)) return route.fulfill(json(F.standings));
    return route.fulfill({ status: 404, body: '{}' });
  });
  await pT.goto(PAGE + '#teams');
  await pT.waitForSelector('.tcard', { timeout: 20000 });
  check('Teams tab renders when /teams is unreachable', (await pT.$$('.tcard')).length === 32);
  const rosterTxt = await pT.textContent('#view');
  check('roster fallback keeps real names', rosterTxt.includes('Kansas City Chiefs') && rosterTxt.includes('Washington Commanders'));
  check('no error box on the Teams tab', (await pT.$$('.note')).length === 0);
  check('team names are not truncated', await pT.evaluate(() =>
    [...document.querySelectorAll('.tcard .nm')].every(n => n.scrollWidth <= n.clientWidth + 1)));
  await pT.screenshot({ path: OUT + '/11-teams-no-endpoint.png', fullPage: true });

  const p3 = await ctx.newPage();
  await p3.route('**/*', route => route.request().url().startsWith('file://') ? route.continue() : route.abort());
  await p3.goto(PAGE);
  await p3.waitForSelector('.note', { timeout: 20000 });
  check('total API outage shows error note, not blank', (await p3.textContent('.note')).includes('Could not load'));
  await p3.screenshot({ path: OUT + '/09-offline.png' });

  console.log('\n--- CONSOLE ---');
  check('no uncaught page errors', errors.filter(e => e.startsWith('pageerror')).length === 0, errors.join(' | '));
  if (errors.length) console.log('  (non-fatal console noise: ' + errors.slice(0,4).join(' | ') + ')');

  await browser.close();
  console.log('\n' + (fails.length ? 'FAILURES (' + fails.length + '): ' + fails.join(', ') : 'ALL CHECKS PASSED'));
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); process.exit(2); });
