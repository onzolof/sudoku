export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'insane';

export interface PuzzleProgress {
    id: number;
    puzzleId: string;
    puzzle: string;
    moves: string | null;
    notes: string | null;
    solved: number;
}

// --v-- db entities --v--
export interface PuzzleSchema {
    // todo: ideally use camel case here as well
    id: string;
    difficulty: string;
    number_of_clues: number;
    seed: string;
    solution: string;
    version: number;
    added_at: number;
}
export interface ProgressSchema {
    id: number;
    puzzleId: string;
    puzzle: string;          // the original starting point of the sudoku
    difficulty: string;      // difficulty level
    moves: string | null;    // stored as JSON TEXT
    notes: string | null;    // stored as JSON TEXT
    solved: number;          // 0/1 in DB
}
