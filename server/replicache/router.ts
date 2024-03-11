import express from 'express'
import { handlePoke } from './routes/handle-poke.ts' 
import { handlePull } from './routes/handle-pull.ts'

export const replicacheRouter = express.Router()
  
replicacheRouter.get('/poke', handlePoke)
replicacheRouter.get('/pull', handlePull)