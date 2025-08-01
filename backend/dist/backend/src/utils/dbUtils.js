"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheableModel = exports.flushCache = exports.invalidateCache = exports.getOrFetch = void 0;
// Ultra-optimized database utilities with functional composition and caching optimization
const node_cache_1 = __importDefault(require("node-cache"));
// Ultra-compact cache initialization with inline configuration
const cache = new node_cache_1.default({ stdTTL: 300, checkperiod: 60, useClones: false });
// Ultra-compact cache operations with functional composition
const getOrFetch = async (key, dbFetch, ttl = 300) => {
    const cached = cache.get(key);
    if (cached !== undefined)
        return cached;
    const data = await dbFetch();
    return data && (cache.set(key, data, ttl), true), data;
};
exports.getOrFetch = getOrFetch;
const invalidateCache = (key) => { cache.del(key); };
exports.invalidateCache = invalidateCache;
const flushCache = () => { cache.flushAll(); };
exports.flushCache = flushCache;
// Ultra-compact cacheable model factory with method chaining and inline operations
const cacheableModel = (model, prefix) => {
    const keyGen = (type, data) => `${prefix}:${type}:${typeof data === 'string' ? data : JSON.stringify(data)}`;
    const invalidateAll = () => [':id:', ':findOne:', ':find:'].forEach(t => invalidateCache(`${prefix}${t}*`));
    return {
        model,
        findById: (id, projection, options) => getOrFetch(keyGen('id', id), () => model.findById(id, projection, options).exec()),
        findOne: (conditions, projection, options) => getOrFetch(keyGen('findOne', conditions), () => model.findOne(conditions, projection, options).exec()),
        find: (conditions, projection, options) => getOrFetch(keyGen('find', conditions), () => model.find(conditions, projection, options).exec()),
        create: async (data) => (invalidateAll(), model.create(data)),
        update: async (conditions, update, options) => {
            const result = await model.updateOne(conditions, update, options).exec();
            return conditions._id && invalidateCache(keyGen('id', conditions._id)), invalidateAll(), result;
        },
        findByIdAndUpdate: async (id, update, options) => {
            const result = await model.findByIdAndUpdate(id, update, options).exec();
            return invalidateCache(keyGen('id', id)), invalidateAll(), result;
        }
    };
};
exports.cacheableModel = cacheableModel;
