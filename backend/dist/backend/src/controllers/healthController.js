"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealth = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const package_json_1 = require("../../package.json");
const getHealth = (_, res) => {
    const s = mongoose_1.default.connection.readyState;
    try {
        res.json({
            status: s !== 1 ? 'WARNING' : 'UP',
            uptime: process.uptime(),
            timestamp: Date.now(),
            version: package_json_1.version,
            database: { status: ['disconnected', 'connected', 'connecting', 'disconnecting'][s] || 'unknown' }
        });
    }
    catch (e) {
        res.status(500).json({
            status: 'ERROR',
            uptime: process.uptime(),
            timestamp: Date.now(),
            version: package_json_1.version,
            database: { status: ['disconnected', 'connected', 'connecting', 'disconnecting'][s] || 'unknown' },
            error: e.message
        });
    }
};
exports.getHealth = getHealth;
