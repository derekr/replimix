import express from 'express'
import { handlePoke } from './routes/handle-poke.ts' 
import { handlePull } from './routes/handle-pull.ts'
import { handlePush } from './routes/handle-push.ts'

export const replicacheRouter = express.Router()
  
replicacheRouter.get('/poke', handlePoke)
replicacheRouter.post('/pull', handlePull)
replicacheRouter.post('/push', handlePush)