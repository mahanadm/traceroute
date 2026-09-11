const T = {
  BUF:{id:'2',abbreviation:'BUF',displayName:'Buffalo Bills',shortDisplayName:'Bills',location:'Buffalo',name:'Bills',color:'00338d',logo:'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png'},
  NYJ:{id:'20',abbreviation:'NYJ',displayName:'New York Jets',shortDisplayName:'Jets',location:'New York',name:'Jets',color:'115740',logo:'https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png'},
  KC:{id:'12',abbreviation:'KC',displayName:'Kansas City Chiefs',shortDisplayName:'Chiefs',location:'Kansas City',name:'Chiefs',color:'e31837',logo:'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png'},
  DEN:{id:'7',abbreviation:'DEN',displayName:'Denver Broncos',shortDisplayName:'Broncos',location:'Denver',name:'Broncos',color:'0a2343',logo:'https://a.espncdn.com/i/teamlogos/nfl/500/den.png'},
  SEA:{id:'26',abbreviation:'SEA',displayName:'Seattle Seahawks',shortDisplayName:'Seahawks',location:'Seattle',name:'Seahawks',color:'002244',logo:'https://a.espncdn.com/i/teamlogos/nfl/500/sea.png'},
  MIA:{id:'15',abbreviation:'MIA',displayName:'Miami Dolphins',shortDisplayName:'Dolphins',location:'Miami',name:'Dolphins',color:'008e97',logo:'https://a.espncdn.com/i/teamlogos/nfl/500/mia.png'},
  SF:{id:'25',abbreviation:'SF',displayName:'San Francisco 49ers',shortDisplayName:'49ers',location:'San Francisco',name:'49ers',color:'aa0000',logo:'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png'},
};

const ev = (id, away, home, opts = {}) => ({
  id, date: opts.date, name: `${home.displayName} at ${away.displayName}`, shortName: `${away.abbreviation} @ ${home.abbreviation}`,
  season: { year: 2026, type: 2 }, week: { number: 2 },
  competitions: [{
    id, date: opts.date,
    venue: { fullName: opts.venue || 'Stadium', address: { city: 'Somewhere', state: 'ST' } },
    competitors: [
      { id: home.id, homeAway: 'home', winner: opts.homeWin === true, team: home,
        score: opts.homeScore, records: [{ name: 'overall', type: 'total', summary: opts.homeRec || '1-0' }] },
      { id: away.id, homeAway: 'away', winner: opts.homeWin === false, team: away,
        score: opts.awayScore, records: [{ name: 'overall', type: 'total', summary: opts.awayRec || '0-1' }] },
    ],
    status: { displayClock: opts.clock || '0:00', period: opts.period || 4,
      type: { state: opts.state, completed: opts.state === 'post', detail: opts.detail, shortDetail: opts.detail, description: opts.detail } },
    broadcasts: [{ names: [opts.tv || 'CBS'] }],
    odds: opts.state === 'pre' ? [{ details: 'HOME -3.5', overUnder: 44.5 }] : [],
    notes: opts.note ? [{ headline: opts.note }] : [],
    situation: opts.state === 'in'
      ? { possession: home.id, downDistanceText: '2nd & 7 at DEN 41', lastPlay: { text: 'Mahomes pass complete to Kelce for 12 yards.' } }
      : undefined,
  }],
  status: { type: { state: opts.state } },
  links: [{ rel: ['summary', 'desktop', 'event'], href: 'https://www.espn.com/nfl/game/_/gameId/' + id }],
});

const scoreboard = {
  leagues: [{ season: { year: 2026, type: { id: '2', type: 2, name: 'Regular Season', week: 2 } } }],
  season: { type: 2, year: 2026 },
  week: { number: 2 },
  events: [
    ev('1', T.NYJ, T.BUF, { date: '2026-09-17T00:15Z', state: 'post', detail: 'Final', homeScore: '31', awayScore: '17', homeWin: true, venue: 'Highmark Stadium', tv: 'Prime Video' }),
    ev('2', T.KC, T.DEN, { date: '2026-09-20T17:00Z', state: 'in', detail: 'Q3 8:42', clock: '8:42', period: 3, homeScore: '14', awayScore: '21', venue: 'Empower Field', tv: 'FOX' }),
    ev('3', T.SF, T.SEA, { date: '2026-09-20T20:25Z', state: 'pre', detail: '4:25 PM ET', homeScore: '', awayScore: '', venue: 'Lumen Field', tv: 'NBC', note: 'NFC West showdown' }),
  ],
};

const standings = {
  children: [
    { id: '8', name: 'American Football Conference', abbreviation: 'AFC', children: [
      { id: '4', name: 'AFC East', standings: { entries: [
        { team: { id: '2', displayName: 'Buffalo Bills', abbreviation: 'BUF', logos: [{ href: 'x' }] }, stats: [
          { name: 'wins', value: 2, displayValue: '2' }, { name: 'losses', value: 0, displayValue: '0' },
          { name: 'ties', value: 0, displayValue: '0' }, { name: 'winPercent', value: 1, displayValue: '1.000' },
          { name: 'pointsFor', value: 55, displayValue: '55' }, { name: 'pointsAgainst', value: 30, displayValue: '30' },
          { name: 'differential', value: 25, displayValue: '+25' }, { name: 'vsDiv', displayValue: '1-0' },
          { name: 'streak', value: 2, displayValue: 'W2' }] },
        { team: { id: '20', displayName: 'New York Jets', abbreviation: 'NYJ', logos: [{ href: 'x' }] }, stats: [
          { name: 'wins', value: 0, displayValue: '0' }, { name: 'losses', value: 2, displayValue: '2' },
          { name: 'ties', value: 0, displayValue: '0' }, { name: 'winPercent', value: 0, displayValue: '.000' },
          { name: 'pointsFor', value: 24, displayValue: '24' }, { name: 'pointsAgainst', value: 48, displayValue: '48' },
          { name: 'differential', value: -24, displayValue: '-24' }, { name: 'vsDiv', displayValue: '0-1' },
          { name: 'streak', value: -2, displayValue: 'L2' }] },
      ] } },
      { id: '12', name: 'AFC West', standings: { entries: [
        { team: { id: '12', displayName: 'Kansas City Chiefs', abbreviation: 'KC', logos: [{ href: 'x' }] }, stats: [
          { name: 'wins', value: 1, displayValue: '1' }, { name: 'losses', value: 1, displayValue: '1' },
          { name: 'winPercent', value: 0.5, displayValue: '.500' }, { name: 'differential', value: 3, displayValue: '+3' }] },
      ] } },
    ] },
    { id: '7', name: 'National Football Conference', abbreviation: 'NFC', children: [
      { id: '3', name: 'NFC West', standings: { entries: [
        { team: { id: '26', displayName: 'Seattle Seahawks', abbreviation: 'SEA', logos: [{ href: 'x' }] }, stats: [
          { name: 'wins', value: 2, displayValue: '2' }, { name: 'losses', value: 0, displayValue: '0' },
          { name: 'winPercent', value: 1, displayValue: '1.000' }, { name: 'differential', value: 18, displayValue: '+18' }] },
      ] } },
    ] },
  ],
};

// ESPN answers with all 32; anything short of that makes the page fall back to
// its built-in roster, so the happy-path fixture has to be complete.
const REST = [
  ['33','BAL','Baltimore Ravens'], ['4','CIN','Cincinnati Bengals'], ['5','CLE','Cleveland Browns'],
  ['23','PIT','Pittsburgh Steelers'], ['34','HOU','Houston Texans'], ['11','IND','Indianapolis Colts'],
  ['30','JAX','Jacksonville Jaguars'], ['10','TEN','Tennessee Titans'], ['24','LAC','Los Angeles Chargers'],
  ['13','LV','Las Vegas Raiders'], ['17','NE','New England Patriots'], ['6','DAL','Dallas Cowboys'],
  ['19','NYG','New York Giants'], ['21','PHI','Philadelphia Eagles'], ['28','WSH','Washington Commanders'],
  ['3','CHI','Chicago Bears'], ['8','DET','Detroit Lions'], ['9','GB','Green Bay Packers'],
  ['16','MIN','Minnesota Vikings'], ['1','ATL','Atlanta Falcons'], ['29','CAR','Carolina Panthers'],
  ['18','NO','New Orleans Saints'], ['27','TB','Tampa Bay Buccaneers'], ['22','ARI','Arizona Cardinals'],
  ['14','LAR','Los Angeles Rams'],
].map(([id, abbreviation, displayName]) => ({ id, abbreviation, displayName, color: '222222',
  logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/' + abbreviation.toLowerCase() + '.png' }));

const allTeams = [...Object.values(T), ...REST];
const teams = { sports: [{ leagues: [{ teams: allTeams.map(t => ({ team: { ...t, logos: [{ href: t.logo }] } })) }] }] };

const teamDetail = { team: { ...T.BUF, logos: [{ href: T.BUF.logo }],
  record: { items: [{ type: 'total', description: 'Overall Record', summary: '2-0' }] },
  standingSummary: '1st in AFC East',
  nextEvent: [ev('9', T.KC, T.BUF, { date: '2026-09-27T17:00Z', state: 'pre', detail: '1:00 PM ET', homeScore: '', awayScore: '' })] } };

const teamSchedule = { team: { ...T.BUF, id: '2' }, events: [
  { id: '1', date: '2026-09-17T00:15Z', week: { number: 1 }, seasonType: { type: 2 },
    competitions: [{ competitors: [
      { id: '2', homeAway: 'home', winner: true, team: T.BUF, score: { value: 31, displayValue: '31' } },
      { id: '20', homeAway: 'away', winner: false, team: T.NYJ, score: { value: 17, displayValue: '17' } }],
      status: { type: { state: 'post', completed: true, shortDetail: 'Final' } } }],
    links: [{ rel: ['summary'], href: 'https://espn.com/g/1' }] },
  { id: '9', date: '2026-09-27T17:00Z', week: { number: 2 }, seasonType: { type: 2 },
    competitions: [{ competitors: [
      { id: '12', homeAway: 'home', team: T.KC, score: { displayValue: '' } },
      { id: '2', homeAway: 'away', team: T.BUF, score: { displayValue: '' } }],
      status: { type: { state: 'pre', completed: false, shortDetail: '1:00 PM ET' } } }],
    links: [{ rel: ['summary'], href: 'https://espn.com/g/9' }] },
] };

const news = { articles: [
  { headline: 'Bills roll past Jets in the opener', description: 'Josh Allen threw for four scores as Buffalo cruised.', published: new Date(Date.now()-3*3600*1000).toISOString(), type: 'Recap', images: [{ url: 'https://a.espncdn.com/photo/1.jpg', caption: 'Allen' }], links: { web: { href: 'https://espn.com/n/1' } } },
  { headline: 'Injury report: Week 2', description: 'Everything you need to know before Sunday.', published: '2026-09-19T14:00Z', type: 'Story', images: [], links: { web: { href: 'https://espn.com/n/2' } } },
] };

module.exports = { scoreboard, standings, teams, teamDetail, teamSchedule, news };
