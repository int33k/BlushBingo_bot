"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const math_1 = require("../utils/math");
const config_1 = require("../config");
// Ultra-compact error handler with inline operations and functional composition
const errorHandler = (err, _req, res, _next) => {
    const appError = (0, math_1.handleHttpError)(err);
    // Optimized logging with ternary and template literals
    appError.isOperational
        ? (config_1.logger.warn(`Operational error: ${appError.message}`), appError.details && config_1.logger.debug(`Error details: ${JSON.stringify(appError.details)}`))
        : (config_1.logger.error(`Unhandled error: ${appError.message}`), config_1.logger.error(appError.stack || ''));
    // Ultra-compact response with spread optimization and inline conditionals
    res.status(appError.statusCode).json({
        success: false,
        error: {
            code: appError.code,
            message: config_1.env.nodeEnv === 'production' && !appError.isOperational ? 'Server error' : appError.message,
            ...(config_1.env.nodeEnv !== 'production' && { details: appError.details })
        }
    });
};
exports.errorHandler = errorHandler;
exports.default = exports.errorHandler;
