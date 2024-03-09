import type { Express } from 'express'
import { replicacheRouter } from './replicache/router.ts'

export function allRoutes(app: Express) {
  app.use('/replicache', replicacheRouter)
  return app
}