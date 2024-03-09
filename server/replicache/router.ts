import express from 'express'
import { pokeRoute } from './routes/poke.ts' 

export const replicacheRouter = express.Router()
  
replicacheRouter.use('/poke', pokeRoute)