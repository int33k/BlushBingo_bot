import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { version } from '../../package.json';

export const getHealth = (_: Request, res: Response): void => {
  const s = mongoose.connection.readyState;
  try {
    res.json({
      status: s !== 1 ? 'WARNING' : 'UP',
      uptime: process.uptime(),
      timestamp: Date.now(),
      version,
      database: { status: ['disconnected', 'connected', 'connecting', 'disconnecting'][s] || 'unknown' }
    });
  } catch (e) {
    res.status(500).json({
      status: 'ERROR',
      uptime: process.uptime(),
      timestamp: Date.now(),
      version,
      database: { status: ['disconnected', 'connected', 'connecting', 'disconnecting'][s] || 'unknown' },
      error: (e as Error).message
    });
  }
};
