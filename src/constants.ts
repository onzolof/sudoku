


// local storage
export const CURRENT_PROGRESS_ID_STORAGE_KEY = '@current_progress_id';
export const SUDOKU_DIFFICULTY_STORAGE_KEY = '@sudoku_difficulty';

// Progress storage structure for each difficulty
export interface ProgressStorage {
  [difficulty: string]: number | null;
}



