/**
 * Shared Game Logic - Consolidated from frontend and backend
 * Eliminates duplication between LINE_PATTERNS and game logic
 */
export interface CellPosition {
    row: number;
    col: number;
}
export interface LinePattern {
    cells: CellPosition[];
}
export declare const LINE_PATTERNS: LinePattern[];
export declare const generateLines: (card: number[][]) => number[][];
export declare const isLineComplete: (line: number[], markedCells: Array<string | number>) => boolean;
export declare const checkCompletedLines: (card: number[][], markedCells: Array<string | number>) => {
    completedLines: number;
    markedLetters: string[];
};
export declare const generatePositionMap: (card: number[][]) => Record<number, [number, number]>;
export declare const generateLookupTable: (card1: number[][], card2: number[][]) => number[][];
//# sourceMappingURL=logic.d.ts.map