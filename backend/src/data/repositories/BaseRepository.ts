/**
 * Ultra-optimized base repository with consolidated error handling and logging
 */
import { logger } from '../../config';

export abstract class BaseRepository {
  /**
   * Execute operation with optimized error handling and logging
   */
  protected async execute<T>(operation: () => Promise<T>, context: string, throwOnError = false): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`${context}: ${message}`);
      if (throwOnError) throw error;
      return null;
    }
  }

  /**
   * Execute operation that should always throw on error
   */
  protected async executeOrThrow<T>(operation: () => Promise<T>, context: string): Promise<T> {
    return this.execute(operation, context, true) as Promise<T>;
  }
}
