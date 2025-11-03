import 'dotenv/config'
import cron from 'node-cron'

const endpoint = process.env.RESCORE_CRON_ENDPOINT ?? 'http://localhost:3002/api/admin/rescore'
const cronToken = process.env.RESCORE_CRON_TOKEN
const cronExpression = process.env.RESCORE_CRON_EXPRESSION ?? '0 3 * * *'
const timezone = process.env.RESCORE_CRON_TZ ?? 'Asia/Kolkata'
const defaultStatuses = process.env.RESCORE_CRON_STATUSES
  ? process.env.RESCORE_CRON_STATUSES.split(',').map((status) => status.trim()).filter(Boolean)
  : ['PROCESSING', 'MANUAL_REVIEW']

const rawLimit = process.env.RESCORE_CRON_LIMIT
let limit: number | undefined

if (rawLimit !== undefined) {
  const parsedLimit = Number(rawLimit)
  if (Number.isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
    console.error('❌ RESCORE_CRON_LIMIT must be a number between 1 and 100 when provided.')
    process.exit(1)
  }
  limit = parsedLimit
}
const staleOnly = process.env.RESCORE_CRON_STALE_ONLY !== 'false'
const runOnStart = process.env.RESCORE_CRON_RUN_ON_START !== 'false'

if (!cronToken) {
  console.error('❌ RESCORE_CRON_TOKEN is not set. Aborting scheduler start.')
  process.exit(1)
}

if (!cron.validate(cronExpression)) {
  console.error(`❌ Invalid RESCORE_CRON_EXPRESSION provided: ${cronExpression}`)
  process.exit(1)
}

const buildPayload = () => {
  const payload: Record<string, unknown> = {}

  if (defaultStatuses.length) {
    payload.statuses = defaultStatuses
  }

  if (staleOnly) {
    payload.staleOnly = true
  }

  if (limit !== undefined) {
    payload.limit = limit
  }

  return payload
}

const triggerRescore = async () => {
  const payload = buildPayload()
  const timestamp = new Date().toISOString()

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-safecred-cron-token': cronToken,
      },
      body: JSON.stringify(payload),
    })

    const body = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(body?.error || response.statusText)
    }

    console.log(`✅ [${timestamp}] Rescore run succeeded → processed=${body.processed ?? 0}`)
    if ((body.failures?.length ?? 0) > 0) {
      console.warn(`⚠️ [${timestamp}] Failures reported: ${JSON.stringify(body.failures)}`)
    }
  } catch (error: any) {
    console.error(`❌ [${timestamp}] Rescore run failed:`, error?.message || error)
  }
}

console.log('🕒 SafeCred rescore scheduler starting...')
console.log(`🔁 Cron expression: ${cronExpression} (${timezone})`)
console.log(`🎯 Target endpoint: ${endpoint}`)
console.log(`🛡️ Sending statuses: ${defaultStatuses.join(', ') || 'none'}`)

cron.schedule(
  cronExpression,
  () => {
    void triggerRescore()
  },
  { timezone }
)

if (runOnStart) {
  void triggerRescore()
}

const shutdown = (signal: string) => {
  console.log(`👋 Received ${signal}. Exiting scheduler.`)
  process.exit(0)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
