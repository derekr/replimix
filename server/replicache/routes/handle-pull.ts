import type Express from 'express';
import {pull} from '../pull.ts';
import {z} from 'zod';

export async function handlePull(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction,
): Promise<void> {
  try {
    const userID = z.string().parse(req.query.userID);
    const resp = await pull(userID, req.body);
    res.json(resp);
  } catch (e) {
    next(e);
  }
}
