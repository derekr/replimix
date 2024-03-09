import {Request, Response} from 'express';

export function pokeRoute(req: Request, res: Response) {
  res.json({poke: "hello"})
}