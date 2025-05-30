// Ultra-optimized database utilities with functional composition and caching optimization
import NodeCache from 'node-cache';
import { Model, Document, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';

// Ultra-compact cache initialization with inline configuration
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60, useClones: false });

// Ultra-compact cache operations with functional composition
const getOrFetch = async <T>(key: string, dbFetch: () => Promise<T>, ttl = 300): Promise<T | undefined> => {
  const cached = cache.get<T>(key);
  if (cached !== undefined) return cached;
  const data = await dbFetch();
  return data && (cache.set(key, data, ttl), true), data;
};

const invalidateCache = (key: string): void => { cache.del(key); };
const flushCache = (): void => { cache.flushAll(); };

// Ultra-compact cacheable model factory with method chaining and inline operations
const cacheableModel = <T extends Document>(model: Model<T>, prefix: string) => {
  const keyGen = (type: string, data: any) => `${prefix}:${type}:${typeof data === 'string' ? data : JSON.stringify(data)}`;
  const invalidateAll = () => [':id:', ':findOne:', ':find:'].forEach(t => invalidateCache(`${prefix}${t}*`));

  return {
    model,
    findById: (id: string, projection?: any, options?: QueryOptions) =>
      getOrFetch(keyGen('id', id), () => model.findById(id, projection, options).exec()),
    findOne: (conditions: FilterQuery<T>, projection?: any, options?: QueryOptions) =>
      getOrFetch(keyGen('findOne', conditions), () => model.findOne(conditions, projection, options).exec()),
    find: (conditions: FilterQuery<T>, projection?: any, options?: QueryOptions) =>
      getOrFetch(keyGen('find', conditions), () => model.find(conditions, projection, options).exec()),
    create: async (data: Partial<T>) => (invalidateAll(), model.create(data)),
    update: async (conditions: FilterQuery<T>, update: UpdateQuery<T>, options?: any) => {
      const result = await model.updateOne(conditions, update, options).exec();
      return conditions._id && invalidateCache(keyGen('id', conditions._id)), invalidateAll(), result;
    },
    findByIdAndUpdate: async (id: string, update: UpdateQuery<T>, options?: QueryOptions) => {
      const result = await model.findByIdAndUpdate(id, update, options).exec();
      return invalidateCache(keyGen('id', id)), invalidateAll(), result;
    }
  };
};

export { getOrFetch, invalidateCache, flushCache, cacheableModel };
