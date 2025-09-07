export const difficulties = ['easy', 'medium', 'hard', 'expert', 'insane'] as const;
export const defaultDifficulty = difficulties[1]
export type Difficulty = typeof difficulties[number];
