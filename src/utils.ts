// Difficulty
export const difficulties = ['easy', 'medium', 'hard', 'expert', 'insane'] as const;
export const defaultDifficulty = difficulties[1]
export type Difficulty = typeof difficulties[number];



// Theme
const difficultyColors: Record<Difficulty, string> = {
    easy: '#16A34A', // HSL(142.1, 76.2%, 36.3%)
    medium: '#F97316', // HSL(24.6, 95%, 53.1%)
    hard: '#CC0066', // HSL(346.8, 77.2%, 49.8%)
    expert: '#8A2BE2', // HSL(262.1, 83.3%, 57.8%)
    insane: '#171717', // HSL(0, 0%, 9%)
};
export function getThemeColor(difficulty: Difficulty){
    return difficultyColors[difficulty]
}