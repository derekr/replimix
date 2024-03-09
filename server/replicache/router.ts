import express from 'express'
import { handlePoke } from './routes/handle-poke.ts' 

export const replicacheRouter = express.Router()
  
replicacheRouter.get('/poke', handlePoke)