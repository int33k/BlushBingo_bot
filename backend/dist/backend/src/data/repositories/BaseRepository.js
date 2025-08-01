"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
/**
 * Ultra-optimized base repository with consolidated error handling and logging
 */
const config_1 = require("../../config");
class BaseRepository {
    /**
     * Execute operation with optimized error handling and logging
     */
    async execute(operation, context, throwOnError = false) {
        try {
            return await operation();
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            config_1.logger.error(`${context}: ${message}`);
            if (throwOnError)
                throw error;
            return null;
        }
    }
    /**
     * Execute operation that should always throw on error
     */
    async executeOrThrow(operation, context) {
        return this.execute(operation, context, true);
    }
}
exports.BaseRepository = BaseRepository;
