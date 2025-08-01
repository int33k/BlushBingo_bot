"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const errors_1 = require("../utils/errors");
// Ultra-compact validation factory with inline operations and functional composition
const validate = (schema, property = 'body') => (req, _res, next) => {
    const { error, value } = schema.validate(req[property], { abortEarly: false, stripUnknown: true });
    // Inline error handling with ternary and method chaining
    error
        ? next((0, errors_1.createValidationError)({ message: 'Validation failed' }, { details: error.details.map(({ message, path }) => ({ message, path })) }))
        : (req[property] = value, next());
};
exports.validate = validate;
exports.default = exports.validate;
