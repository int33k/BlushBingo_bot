/**
 * API-related type definitions - Ultra-optimized with generic types
 */

import { Request } from 'express';

// Generic API response with type parameter for data
export interface ApiResponse<T = any> { success: boolean; data?: T; error?: string; message?: string; }

// Optimized auth request with inline user type
export interface AuthRequest extends Request { user?: { id: string; username: string; }; }

// Mongoose query options with generic typing
export interface MongooseQueryOptions { lean?: boolean; session?: any; [key: string]: any; }
