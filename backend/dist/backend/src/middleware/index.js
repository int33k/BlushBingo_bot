"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.default = exports.errorHandler = void 0;
/**
 * Ultra-compact middleware exports with import consolidation
 */
var errorHandler_1 = require("./errorHandler");
Object.defineProperty(exports, "errorHandler", { enumerable: true, get: function () { return errorHandler_1.errorHandler; } });
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return errorHandler_1.errorHandler; } });
var validate_1 = require("./validate");
Object.defineProperty(exports, "validate", { enumerable: true, get: function () { return validate_1.validate; } });
