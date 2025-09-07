import React, {useEffect, useState, useCallback} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useServices} from '../hooks';
import {useUserDbReady} from '../db/dbProviders';
import Sudoku from './Sudoku';
import {CURRENT_PROGRESS_ID_STORAGE_KEY, SUDOKU_DIFFICULTY_STORAGE_KEY, type ProgressStorage} from "../constants";
import {defaultDifficulty, type Difficulty} from '../utils';

interface ContentProps {
  onDifficultyChange?: (reinitializeFn: (newDifficulty: Difficulty) => Promise<void>) => void;
}

export default function Content({onDifficultyChange}: ContentProps = {}) {
    const {puzzleService, progressService} = useServices();
    const isUserDbReady = useUserDbReady();

    const [currentProgressId, setCurrentProgressId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);
    const [canGoLeft, setCanGoLeft] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const [currentPuzzleDifficulty, setCurrentPuzzleDifficulty] = useState<string | null>(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(defaultDifficulty);

    // Load difficulty from storage
    const loadDifficultyFromStorage = useCallback(async () => {
        try {
            const storedDifficulty = await AsyncStorage.getItem(SUDOKU_DIFFICULTY_STORAGE_KEY);
            if (storedDifficulty && storedDifficulty !== selectedDifficulty) {
                setSelectedDifficulty(storedDifficulty as Difficulty);
            }
        } catch (error) {
            console.error('Failed to load difficulty from storage:', error);
        }
    }, [selectedDifficulty]);

    // Load progress IDs for all difficulties
    const loadProgressStorage = useCallback(async (): Promise<ProgressStorage> => {
        try {
            const stored = await AsyncStorage.getItem(CURRENT_PROGRESS_ID_STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored) as ProgressStorage;
            }
        } catch (error) {
            console.error('Failed to load progress storage:', error);
        }
        return {};
    }, []);

    // Save progress ID for current difficulty
    const saveProgressForDifficulty = useCallback(async (difficulty: Difficulty, progressId: number | null) => {
        try {
            const currentStorage = await loadProgressStorage();
            currentStorage[difficulty] = progressId;
            await AsyncStorage.setItem(CURRENT_PROGRESS_ID_STORAGE_KEY, JSON.stringify(currentStorage));
        } catch (error) {
            console.error('Failed to save progress for difficulty:', error);
        }
    }, [loadProgressStorage]);

    // Reinitialize content when difficulty changes
    const reinitializeForDifficulty = useCallback(async (newDifficulty: Difficulty) => {
        if (!isUserDbReady) return;

        setLoading(true);
        try {
            setSelectedDifficulty(newDifficulty)
            // Load progress for the new difficulty
            const progressStorage = await loadProgressStorage();
            const savedProgressId = progressStorage[newDifficulty];

            if (savedProgressId) {
                // Check if the progress record still exists
                const progressRecord = await progressService.getProgressRecordById(savedProgressId);
                if (progressRecord) {
                    setCurrentProgressId(savedProgressId);
                    // Load puzzle difficulty for display
                    const puzzle = await puzzleService.getPuzzleById(progressRecord.puzzleId);
                    if (puzzle) {
                        setCurrentPuzzleDifficulty(puzzle.difficulty);
                    }
                    console.debug('Restored from saved progress for difficulty:', newDifficulty, savedProgressId);
                } else {
                    // Progress record doesn't exist, create new puzzle
                    console.debug('Saved progress not found, creating new puzzle for difficulty:', newDifficulty);
                    const newSudokuId = await puzzleService.createNewSudoku(newDifficulty);
                    if (newSudokuId) {
                        setCurrentProgressId(newSudokuId);
                        await saveProgressForDifficulty(newDifficulty, newSudokuId);
                        const puzzle = await puzzleService.getPuzzleById((await progressService.getProgressRecordById(newSudokuId))?.puzzleId || '');
                        if (puzzle) {
                            setCurrentPuzzleDifficulty(puzzle.difficulty);
                        }
                    }
                }
            } else {
                // No saved progress for this difficulty, create new puzzle
                console.debug('No saved progress for difficulty, creating new puzzle:', newDifficulty);
                const newSudokuId = await puzzleService.createNewSudoku(newDifficulty);
                if (newSudokuId) {
                    setCurrentProgressId(newSudokuId);
                    await saveProgressForDifficulty(newDifficulty, newSudokuId);
                    const puzzle = await puzzleService.getPuzzleById((await progressService.getProgressRecordById(newSudokuId))?.puzzleId || '');
                    if (puzzle) {
                        setCurrentPuzzleDifficulty(puzzle.difficulty);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to reinitialize for difficulty:', error);
        } finally {
            setLoading(false);
        }
    }, [isUserDbReady, loadProgressStorage, progressService, puzzleService, saveProgressForDifficulty]);

    // Check navigation availability
    const checkNavigationAvailability = useCallback(async () => {
        if (!isUserDbReady || !currentProgressId) {
            setCanGoLeft(false);
            return;
        }

        try {
            const [currentOffset] = await Promise.all([
                progressService.getProgressRecordOffset(currentProgressId, selectedDifficulty)
            ]);

            setCanGoLeft(currentOffset > 0);
        } catch (error) {
            console.error('Failed to check navigation availability:', error);
            setCanGoLeft(false);
        }
    }, [progressService, isUserDbReady, currentProgressId, selectedDifficulty]);

    // Load puzzle difficulty for current progress
    const loadPuzzleDifficulty = useCallback(async (progressId: number) => {
        if (!isUserDbReady) return;

        try {
            const progressRecord = await progressService.getProgressRecordById(progressId);
            if (progressRecord) {
                const puzzle = await puzzleService.getPuzzleById(progressRecord.puzzleId);
                if (puzzle) {
                    setCurrentPuzzleDifficulty(puzzle.difficulty);
                }
            }
        } catch (error) {
            console.error('Failed to load puzzle difficulty:', error);
            setCurrentPuzzleDifficulty(null);
        }
    }, [progressService, puzzleService, isUserDbReady]);

    // Simple transition handler
    const performTransition = useCallback(async (operation: () => Promise<void>) => {
        setIsNavigating(true);

        try {
            await operation();
        } finally {
            setIsNavigating(false);
        }
    }, []);

    // Navigation functions
    const navigateToPrevious = useCallback(async () => {
        if (!canGoLeft || isNavigating || !currentProgressId) return;

        await performTransition(async () => {
            const currentOffset = await progressService.getProgressRecordOffset(currentProgressId, selectedDifficulty);
            const previousRecords = await progressService.getProgressRecordsPaginated(currentOffset - 1, 1, selectedDifficulty);

            if (previousRecords.length > 0) {
                const previousId = previousRecords[0].id;
                setCurrentProgressId(previousId);
                await saveProgressForDifficulty(selectedDifficulty, previousId);
                await loadPuzzleDifficulty(previousId);
            }
        });
    }, [canGoLeft, isNavigating, currentProgressId, progressService, performTransition, selectedDifficulty]);

    const createNewRandomPuzzle = useCallback(async () => {
        if (!isUserDbReady) {
            console.debug('Database not ready, cannot create new puzzle');
            return false;
        }

        try {
            const newSudokuId = await puzzleService.createNewSudoku(selectedDifficulty);
            if (!newSudokuId) {
                console.error('Failed to create new Sudoku');
                return false;
            } else {
                setCurrentProgressId(newSudokuId);
                await saveProgressForDifficulty(selectedDifficulty, newSudokuId);
                await loadPuzzleDifficulty(newSudokuId);
            }
            return true;
        } catch (error) {
            console.error('Failed to create new random puzzle:', error);
            return false;
        }
    }, [puzzleService, progressService, isUserDbReady, selectedDifficulty]);

    const navigateToNext = useCallback(async () => {
        if (isNavigating) return;

        await performTransition(async () => {
            if (!currentProgressId) {
                // No current puzzle, create a new one
                await createNewRandomPuzzle();
                return;
            }

            const currentOffset = await progressService.getProgressRecordOffset(currentProgressId, selectedDifficulty);
            const totalCount = await progressService.getTotalProgressCount(selectedDifficulty);

            if (currentOffset < totalCount - 1) {
                // There are more records, load the next one
                const nextRecords = await progressService.getProgressRecordsPaginated(currentOffset + 1, 1, selectedDifficulty);

                if (nextRecords.length > 0) {
                    const nextId = nextRecords[0].id;
                    setCurrentProgressId(nextId);
                    await saveProgressForDifficulty(selectedDifficulty, nextId);
                    await loadPuzzleDifficulty(nextId);
                }
            } else {
                // No more records, create a new puzzle
                await createNewRandomPuzzle();
            }
        });
    }, [isNavigating, currentProgressId, progressService, createNewRandomPuzzle, performTransition, selectedDifficulty]);

    const restoreFromSavedProgress = useCallback(async (difficulty: Difficulty) => {
        if (!isUserDbReady) {
            console.debug('Database not ready, cannot restore progress');
            return null;
        }

        const progressStorage = await loadProgressStorage();
        const currentId = progressStorage[difficulty];
        
        if (!currentId) return null;

        // Check if the progress record exists in the database
        const progressRecord = await progressService.getProgressRecordById(currentId);
        if (!progressRecord) {
            // Remove invalid progress ID from storage
            await saveProgressForDifficulty(difficulty, null);
            return null;
        }

        return currentId;
    }, [isUserDbReady, progressService, loadProgressStorage, saveProgressForDifficulty]);

    // Main initialization effect
    useEffect(() => {
        if (!isUserDbReady || isInitialized) {
            return;
        }

        const initializeApp = async () => {
            setLoading(true);
            try {
                // Load difficulty first
                await loadDifficultyFromStorage();
                
                const savedProgressId = await restoreFromSavedProgress(selectedDifficulty);
                if (savedProgressId) {
                    setCurrentProgressId(savedProgressId);
                    await loadPuzzleDifficulty(savedProgressId);
                    console.debug('Restored from saved progress:', savedProgressId);
                } else {
                    console.debug('Creating new random puzzle');
                    await createNewRandomPuzzle();
                }
                setIsInitialized(true);
            } catch (error) {
                console.error('Failed to initialize app:', error);
            } finally {
                setLoading(false);
            }
        };

        initializeApp();
    }, [isUserDbReady, isInitialized, restoreFromSavedProgress, createNewRandomPuzzle, loadDifficultyFromStorage]);

    // Check navigation availability when currentProgressId changes
    useEffect(() => {
        if (currentProgressId) {
            checkNavigationAvailability();
        }
    }, [currentProgressId, checkNavigationAvailability]);

    // Expose reinitialize function to parent component
    useEffect(() => {
        if (onDifficultyChange) {
            onDifficultyChange(reinitializeForDifficulty);
        }
    }, [onDifficultyChange, reinitializeForDifficulty]);

    if (loading || !isUserDbReady) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="text-base text-gray-600">
                    {loading ? 'Loading Sudoku...' : 'Initializing database...'}
                </Text>
            </View>
        );
    }

    return (
        <View className="flex">

            {/* Header with navigation buttons */}
            <View className="flex-row justify-between items-center px-4 py-2">
                <Text className="text-lg font-semibold text-black">
                    {currentPuzzleDifficulty ? currentPuzzleDifficulty.toUpperCase() : ''} ({currentProgressId})
                </Text>

                <View className="flex-row gap-2">
                    {canGoLeft &&
                        <TouchableOpacity
                            onPress={navigateToPrevious}
                            className="w-12 h-12 rounded-full items-center justify-center bg-gray-600"
                        >
                            <Text className="text-white text-xl font-bold">←</Text>
                        </TouchableOpacity>
                    }

                    <TouchableOpacity
                        onPress={navigateToNext}
                        className="w-12 h-12 rounded-full items-center justify-center bg-gray-600"
                    >
                        <Text className="text-white text-xl font-bold">→</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Main content area */}
            <View className="flex items-center justify-center">
                {currentProgressId ? (
                    <Sudoku progressId={currentProgressId}/>
                ) : (
                    <Text className="text-base text-gray-600">
                        No puzzle loaded
                    </Text>
                )}
            </View>
        </View>
    );
}

