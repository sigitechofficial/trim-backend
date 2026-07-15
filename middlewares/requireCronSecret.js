/**
 * Protects internal cron/Lambda endpoints that send emails or mutate data.
 *
 * Accepts secret from (first match wins):
 * - Header: x-cron-secret
 * - Query:  ?secret=
 * - Authorization: Bearer <secret>
 *
 * Env: CRON_JOB_SECRET (required when this middleware is used)
 */
module.exports = function requireCronSecret(req, res, next) {
  const configured = process.env.CRON_JOB_SECRET
  if (!configured) {
    console.error('[cron-guard] CRON_JOB_SECRET is not configured')
    return res.status(503).json({
      status: '0',
      message: 'Cron endpoint is not configured',
      data: {},
      error: 'CRON_JOB_SECRET missing',
    })
  }

  const headerSecret = req.headers['x-cron-secret']
  const querySecret = req.query?.secret
  const authHeader = req.headers.authorization || ''
  const bearerSecret = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null

  const provided = headerSecret || querySecret || bearerSecret
  if (!provided || provided !== configured) {
    return res.status(401).json({
      status: '0',
      message: 'Unauthorized',
      data: {},
      error: 'Invalid or missing cron secret',
    })
  }

  return next()
}
