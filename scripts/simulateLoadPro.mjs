import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'

// Advanced load simulator with:
// - Pre/post cleanup of previous simulation data (SIM_*)
// - Per-op timing and aggregated reporting
// - Safe modes: connections | writes | full | cleanupOnly
//
// Usage (PowerShell):
//   $env:SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
//   $env:SUPABASE_ANON_KEY="YOUR-ANON-KEY"
//   node scripts/simulateLoadPro.mjs mode=connections games=25 teams=5 durationSec=300
//   node scripts/simulateLoadPro.mjs mode=writes games=10 teams=5 durationSec=180
//   node scripts/simulateLoadPro.mjs mode=full games=10 teams=5 durationSec=180 staggerMs=300
//   node scripts/simulateLoadPro.mjs mode=cleanupOnly
//
// Data tagging strategy:
//   All simulation games use game_code with prefix `SIM_` and host_name `SimHost`
//   This allows safe cleanup before and after runs without touching real data.

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[simulatePro] Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars')
  process.exit(1)
}

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...rest] = a.split('=')
    return [k, rest.join('=') || 'true']
  })
)

const MODE = (args.mode || 'connections').toString()
const GAMES = Number(args.games || 20)
const TEAMS_PER_GAME = Number(args.teams || 5)
const DURATION_SEC = Number(args.durationSec || 300)
const STAGGER_MS = Number(args.staggerMs || 250)
const SAVE_INTERVAL_MS = Number(args.saveIntervalMs || 15000)
const RUN_ID = args.runId || crypto.randomUUID()

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { params: { eventsPerSecond: 10 } },
})

const sleep = (ms) => new Promise((res) => setTimeout(res, ms))
const now = () => Date.now()

const report = {
  runId: RUN_ID,
  mode: MODE,
  config: { games: GAMES, teams: TEAMS_PER_GAME, durationSec: DURATION_SEC, staggerMs: STAGGER_MS, saveIntervalMs: SAVE_INTERVAL_MS },
  timings: {
    start: 0,
    end: 0,
    ops: [], // { type, ok, ms }
  },
  counts: {
    channelsOpened: 0,
    gamesCreated: 0,
    teamsCreated: 0,
    decisionsUpserted: 0,
    functionsInvoked: 0,
    errors: 0,
  },
  errors: [],
}

function recOp(type, startMs, ok, extraErr) {
  report.timings.ops.push({ type, ok, ms: now() - startMs })
  if (!ok) {
    report.counts.errors += 1
    if (extraErr) report.errors.push({ type, message: String(extraErr?.message || extraErr) })
  }
}

async function fetchSimGames() {
  const { data, error } = await client
    .from('games')
    .select('id, game_code')
    .ilike('game_code', 'SIM_%')
  if (error) throw error
  return data || []
}

async function fetchTeamsForGames(gameIds) {
  if (gameIds.length === 0) return []
  const { data, error } = await client
    .from('teams')
    .select('id, game_id')
    .in('game_id', gameIds)
  if (error) throw error
  return data || []
}

async function preCleanup() {
  const t0 = now()
  try {
    const games = await fetchSimGames()
    if (games.length === 0) return recOp('preCleanup', t0, true)
    const gameIds = games.map((g) => g.id)
    const teams = await fetchTeamsForGames(gameIds)
    const teamIds = teams.map((t) => t.id)

    if (teamIds.length) {
      await client.from('team_metrics').delete().in('team_id', teamIds)
      await client.from('team_decisions').delete().in('team_id', teamIds)
      await client
        .from('stock_trades')
        .delete()
        .or(`buyer_team_id.in.(${teamIds.join(',')}),target_team_id.in.(${teamIds.join(',')})`)
      await client.from('factory_locations').delete().in('team_id', teamIds)
      await client.from('teams').delete().in('id', teamIds)
    }
    await client.from('games').delete().in('id', gameIds)
    recOp('preCleanup', t0, true)
  } catch (e) {
    recOp('preCleanup', t0, false, e)
  }
}

async function createGame(idx) {
  const code = `SIM_${RUN_ID.slice(0, 8)}_${String(idx).padStart(3, '0')}`
  const t0 = now()
  const { data, error } = await client
    .from('games')
    .insert({
      game_code: code,
      host_name: 'SimHost',
      status: 'active',
      current_quarter: 1,
      max_quarters: 8,
      quarter_duration_seconds: 600,
      starting_capital: 10000000,
      quarter_start_time: new Date().toISOString(),
    })
    .select()
    .single()
  recOp('createGame', t0, !error, error)
  if (error) throw error
  report.counts.gamesCreated += 1
  return data
}

async function createTeams(gameId, count) {
  const rows = Array.from({ length: count }).map((_, i) => ({
    game_id: gameId,
    team_name: `SimTeam-${i + 1}`,
    current_capital: 10000000,
    total_debt: 0,
    debt_ceiling: 5000000,
    total_profit: 0,
    market_share: 0,
    stock_price: 100,
  }))
  const t0 = now()
  const { data, error } = await client.from('teams').insert(rows).select()
  recOp('createTeams', t0, !error, error)
  if (error) throw error
  report.counts.teamsCreated += data.length
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
  const t0 = now()
  const { error } = await client.from('team_decisions').upsert(body, { onConflict: 'team_id,quarter' })
  recOp('upsertDecision', t0, !error, error)
  if (error) throw error
  report.counts.decisionsUpserted += 1
}

async function invokeQuarterCalc(gameId, quarter) {
  const t0 = now()
  const { error } = await client.functions.invoke('calculate-quarter-results', {
    body: { gameId, quarter },
  })
  recOp('invokeFunction', t0, !error, error)
  if (error) throw error
  report.counts.functionsInvoked += 1
}

async function connectionsOnly() {
  console.log(`[simulatePro] mode=connections games=${GAMES} teams=${TEAMS_PER_GAME} durationSec=${DURATION_SEC}`)
  const channels = []
  for (let g = 0; g < GAMES; g++) {
    for (let t = 0; t < TEAMS_PER_GAME + 1; t++) {
      const ch = client.channel(`SIM_${RUN_ID}_g${g}_t${t}`)
      const t0 = now()
      // subscribe
      await ch.subscribe()
      recOp('openChannel', t0, true)
      channels.push(ch)
      report.counts.channelsOpened += 1
      await sleep(5)
    }
  }
  await sleep(DURATION_SEC * 1000)
  // close
  for (const ch of channels) {
    const t0 = now()
    await ch.unsubscribe()
    recOp('closeChannel', t0, true)
  }
}

async function writesOrFull(invokeEdge = false) {
  console.log(`[simulatePro] mode=${invokeEdge ? 'full' : 'writes'} games=${GAMES} teams=${TEAMS_PER_GAME} durationSec=${DURATION_SEC}`)
  const created = []
  for (let g = 0; g < GAMES; g++) {
    const game = await createGame(g)
    const teams = await createTeams(game.id, TEAMS_PER_GAME)
    created.push({ game, teams })
    await sleep(STAGGER_MS)
  }

  const startedAt = now()
  while ((now() - startedAt) < DURATION_SEC * 1000) {
    for (const { game, teams } of created) {
      await Promise.all(teams.map((t) => upsertDecision(t.id, game.current_quarter)))
    }
    if (invokeEdge) {
      for (const { game } of created) {
        await sleep(STAGGER_MS)
        await invokeQuarterCalc(game.id, game.current_quarter)
      }
    }
    await sleep(SAVE_INTERVAL_MS)
  }

  // post-cleanup of run data
  await postCleanupByRun(created)
}

async function postCleanupAll() {
  const t0 = now()
  try {
    await preCleanup() // same logic as pre cleanup
    recOp('postCleanupAll', t0, true)
  } catch (e) {
    recOp('postCleanupAll', t0, false, e)
  }
}

async function postCleanupByRun(created) {
  // More targeted cleanup using the created references for speed
  const t0 = now()
  try {
    for (const { game, teams } of created) {
      const teamIds = teams.map((t) => t.id)
      if (teamIds.length) {
        await client.from('team_metrics').delete().in('team_id', teamIds)
        await client.from('team_decisions').delete().in('team_id', teamIds)
        await client
          .from('stock_trades')
          .delete()
          .or(`buyer_team_id.in.(${teamIds.join(',')}),target_team_id.in.(${teamIds.join(',')})`)
        await client.from('factory_locations').delete().in('team_id', teamIds)
        await client.from('teams').delete().in('id', teamIds)
      }
      await client.from('games').delete().eq('id', game.id)
      await sleep(5)
    }
    recOp('postCleanupByRun', t0, true)
  } catch (e) {
    recOp('postCleanupByRun', t0, false, e)
  }
}

function summarizeReport() {
  const totalMs = report.timings.end - report.timings.start
  const byType = {}
  for (const op of report.timings.ops) {
    byType[op.type] ||= { count: 0, ok: 0, totalMs: 0 }
    byType[op.type].count += 1
    byType[op.type].totalMs += op.ms
    if (op.ok) byType[op.type].ok += 1
  }
  const typeSummary = Object.fromEntries(
    Object.entries(byType).map(([k, v]) => [k, { count: v.count, ok: v.ok, avgMs: Number((v.totalMs / Math.max(1, v.count)).toFixed(2)) }])
  )
  return {
    ...report,
    durationMs: totalMs,
    opsSummary: typeSummary,
    throughput: {
      decisionsPerSec: Number((report.counts.decisionsUpserted / Math.max(1, totalMs / 1000)).toFixed(2)),
      functionCallsPerSec: Number((report.counts.functionsInvoked / Math.max(1, totalMs / 1000)).toFixed(2)),
      channelsPerSec: Number((report.counts.channelsOpened / Math.max(1, totalMs / 1000)).toFixed(2)),
    },
  }
}

async function main() {
  report.timings.start = now()
  try {
    if (MODE === 'cleanupOnly') {
      await postCleanupAll()
      return
    }

    // Pre cleanup any lingering simulation data
    await preCleanup()

    if (MODE === 'connections') {
      await connectionsOnly()
    } else if (MODE === 'writes') {
      await writesOrFull(false)
    } else if (MODE === 'full') {
      await writesOrFull(true)
    } else {
      throw new Error(`Unknown mode: ${MODE}`)
    }
  } catch (e) {
    report.errors.push({ type: 'fatal', message: String(e?.message || e) })
    report.counts.errors += 1
  } finally {
    report.timings.end = now()
    const summary = summarizeReport()
    const pretty = JSON.stringify(summary, null, 2)
    console.log('\n[simulatePro] Report:\n' + pretty)
  }
}

main().then(() => process.exit(0)).catch((e) => {
  console.error('[simulatePro] error:', e)
  process.exit(1)
})
