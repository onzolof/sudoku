export const difficulties = ['easy', 'medium', 'hard', 'expert', 'insane'] as const;
export type Difficulty = typeof difficulties[number];
