/**
 * Shared Validation Schemas - Cross-platform validation
 * Eliminates validation duplication between frontend and backend
 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}
export declare const validateString: (value: unknown, fieldName: string, required?: boolean) => ValidationResult;
export declare const validateNumber: (value: unknown, fieldName: string, min?: number, max?: number, required?: boolean) => ValidationResult;
export declare const validateGameId: (gameId: unknown) => ValidationResult;
export declare const validatePlayerId: (playerId: unknown) => ValidationResult;
export declare const validatePlayerName: (playerName: unknown) => ValidationResult;
export declare const validateGameNumber: (number: unknown) => ValidationResult;
export declare const validateCreateGame: (data: any) => ValidationResult;
export declare const validateJoinGame: (data: any) => ValidationResult;
export declare const validateMove: (data: any) => ValidationResult;
//# sourceMappingURL=schemas.d.ts.map