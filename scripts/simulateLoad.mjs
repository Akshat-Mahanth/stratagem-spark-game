import { createClient } from '@supabase/supabase-js'

// Usage examples:
// node scripts/simulateLoad.mjs                      # default: connections-only
// node scripts/simulateLoad.mjs mode=full games=20 teams=5 durationSec=300 staggerMs=300
// node scripts/simulateLoad.mjs mode=writes games=10 teams=5 durationSec=180
//
// Required env vars:
//   SUPABASE_URL
//   SUPABASE_ANON_KEY
//
// Modes:
//   connections (default) -> only opens realtime channels to simulate players
//   writes                -> creates temp games/teams and upserts decisions, then cleans up
//   full                  -> writes mode + invokes quarter calc edge function (staggered)

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables.')
  process.exit(1)
}

// Parse CLI args key=value
const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, ...rest] = a.split('=')
  return [k, rest.join('=') || 'true']
}))

const MODE = (args.mode || 'connections').toString()
const GAMES = Number(args.games || 20)
const TEAMS_PER_GAME = Number(args.teams || 5)
const DURATION_SEC = Number(args.durationSec || 300)
const STAGGER_MS = Number(args.staggerMs || 250)
const SAVE_INTERVAL_MS = Number(args.saveIntervalMs || 15000) // 15s

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { params: { eventsPerSecond: 10 } },
})

const sleep = (ms) => new Promise(res => setTimeout(res, ms))

async function simulateConnectionsOnly() {
  console.log(`[simulate] mode=connections games=${GAMES} teams=${TEAMS_PER_GAME} durationSec=${DURATION_SEC}`)
  const channels = []
  for (let g = 0; g < GAMES; g++) {
    for (let t = 0; t < TEAMS_PER_GAME + 1; t++) { // +1 for host
      const ch = client.channel(`game-${g}-conn-${t}`)
      await ch.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // no-op
        }
      })
      channels.push(ch)
      await sleep(5) // small pacing
    }
  }
  console.log(`[simulate] opened ${channels.length} realtime channels`)
  await sleep(DURATION_SEC * 1000)
  for (const ch of channels) {
    await ch.unsubscribe()
  }
  console.log('[simulate] complete (connections-only)')
}

async function createTempGame(idx) {
  const code = `SIM${String(idx).padStart(3, '0')}`
  const { data: game, error } = await client
    .from('games')
    .insert({ game_code: code, host_name: 'SimHost', status: 'active', current_quarter: 1, max_quarters: 8, quarter_duration_seconds: 600, starting_capital: 10000000, quarter_start_time: new Date().toISOString() })
    .select()
    .single()
  if (error) throw error
  return game
}

async function createTempTeams(gameId, count) {
  const rows = Array.from({ length: count }).map((_, i) => ({
    game_id: gameId,
    team_name: `SimTeam-${i+1}`,
    current_capital: 10000000,
    total_debt: 0,
    debt_ceiling: 5000000,
    total_profit: 0,
    market_share: 0,
    stock_price: 100,
  }))
  const { data, error } = await client.from('teams').insert(rows).select()
  if (error) throw error
  return data
}

async function upsertDecision(teamId, quarter) {
  const body = {
    team_id: teamId,
    quarter,
    units_produced: 1000,
    cost_per_unit: 20000,
    luxury_percentage: 10,
    flagship_percentage: 30,
    midtier_percentage: 40,
    lowertier_percentage: 20,
    luxury_price: 120000,
    flagship_price: 65000,
    midtier_price: 25000,
    lowertier_price: 10000,
    marketing_budget: 200000,
    rnd_budget: 150000,
    employee_budget: 100000,
    new_debt: 0,
    debt_repayment: 0,
  }
  const { error } = await client.from('team_decisions')
    .upsert(body, { onConflict: 'team_id,quarter' })
  if (error) throw error
}

async function simulateWrites(invokeEdge = false) {
  console.log(`[simulate] mode=${invokeEdge ? 'full' : 'writes'} games=${GAMES} teams=${TEAMS_PER_GAME} durationSec=${DURATION_SEC}`)
  const created = []
  try {
    // create games and teams
    for (let g = 0; g < GAMES; g++) {
      const game = await createTempGame(g)
      const teams = await createTempTeams(game.id, TEAMS_PER_GAME)
      created.push({ game, teams })
      await sleep(STAGGER_MS)
    }

    const startedAt = Date.now()
    let round = 0
    while ((Date.now() - startedAt) < DURATION_SEC * 1000) {
      round++
      // periodic decision saves
      for (const { game, teams } of created) {
        await Promise.all(teams.map(t => upsertDecision(t.id, game.current_quarter)))
      }

      if (invokeEdge && round % Math.max(1, Math.floor(30000 / SAVE_INTERVAL_MS)) === 0) {
        // stagger edge function calls per game
        for (const { game } of created) {
          await sleep(STAGGER_MS)
          await client.functions.invoke('calculate-quarter-results', {
            body: { gameId: game.id, quarter: game.current_quarter }
          })
        }
      }

      await sleep(SAVE_INTERVAL_MS)
    }
  } finally {
    // cleanup temp data
    // delete in dependency order to satisfy FKs
    for (const { game, teams } of created) {
      const teamIds = teams.map(t => t.id)
      // delete per-team rows
      await client.from('team_metrics').delete().in('team_id', teamIds)
      await client.from('team_decisions').delete().in('team_id', teamIds)
      await client.from('stock_trades').delete().or(`buyer_team_id.in.(${teamIds.join(',')}),target_team_id.in.(${teamIds.join(',')})`)
      await client.from('factory_locations').delete().in('team_id', teamIds)
      // delete teams
      await client.from('teams').delete().in('id', teamIds)
      // delete allocations tied via decision_id will cascade if FK ON DELETE CASCADE; otherwise they will have been removed with decisions
      // delete game
      await client.from('games').delete().eq('id', game.id)
      await sleep(5)
    }
    console.log('[simulate] cleanup complete')
  }
}

async function main() {
  if (MODE === 'connections') {
    await simulateConnectionsOnly()
  } else if (MODE === 'writes') {
    await simulateWrites(false)
  } else if (MODE === 'full') {
    await simulateWrites(true)
  } else {
    console.error(`Unknown mode: ${MODE}`)
    process.exit(2)
  }
}

main().then(() => process.exit(0)).catch(err => {
  console.error('[simulate] error:', err)
  process.exit(1)
})
