import React, {useEffect, useState, useCallback} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useServices} from '../hooks';
import {useUserDbReady} from '../db/dbProviders';
import Sudoku from './Sudoku';
import {CURRENT_PROGRESS_ID_STORAGE_KEY} from "../constants";

export default function Content() {
    const {puzzleService, progressService} = useServices();
    const isUserDbReady = useUserDbReady();

    // todo: next steps
      // create caveat down button which enables configuring the difficulty (store in local storage) and create new sudokus according to the difficulty
      // create dark mode toggle
      // enable settings buttons on pulling down (for 5 seconds)
      // style the main page
      // implement the sudoku logic and component

    const [currentProgressId, setCurrentProgressId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);
    const [canGoLeft, setCanGoLeft] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const [currentPuzzleDifficulty, setCurrentPuzzleDifficulty] = useState<string | null>(null);

    // Check navigation availability
    const checkNavigationAvailability = useCallback(async () => {
        if (!isUserDbReady || !currentProgressId) {
            setCanGoLeft(false);
            return;
        }

        try {
            const [currentOffset] = await Promise.all([
                progressService.getProgressRecordOffset(currentProgressId)
            ]);

            setCanGoLeft(currentOffset > 0);
        } catch (error) {
            console.error('Failed to check navigation availability:', error);
            setCanGoLeft(false);
        }
    }, [progressService, isUserDbReady, currentProgressId]);

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
            const currentOffset = await progressService.getProgressRecordOffset(currentProgressId);
            const previousRecords = await progressService.getProgressRecordsPaginated(currentOffset - 1, 1);

            if (previousRecords.length > 0) {
                const previousId = previousRecords[0].id;
                setCurrentProgressId(previousId);
                await AsyncStorage.setItem(CURRENT_PROGRESS_ID_STORAGE_KEY, previousId.toString());
                await loadPuzzleDifficulty(previousId);
            }
        });
    }, [canGoLeft, isNavigating, currentProgressId, progressService, performTransition]);

    const createNewRandomPuzzle = useCallback(async () => {
        if (!isUserDbReady) {
            console.debug('Database not ready, cannot create new puzzle');
            return false;
        }

        try {
            const newSudokuId = await puzzleService.createNewSudoku();
            if (!newSudokuId) {
                console.error('Failed to create new Sudoku');
                return false;
            } else {
                setCurrentProgressId(newSudokuId);
                await AsyncStorage.setItem(CURRENT_PROGRESS_ID_STORAGE_KEY, newSudokuId.toString());
                await loadPuzzleDifficulty(newSudokuId);
            }
            return true;
        } catch (error) {
            console.error('Failed to create new random puzzle:', error);
            return false;
        }
    }, [puzzleService, progressService, isUserDbReady]);

    const navigateToNext = useCallback(async () => {
        if (isNavigating) return;

        await performTransition(async () => {
            if (!currentProgressId) {
                // No current puzzle, create a new one
                await createNewRandomPuzzle();
                return;
            }

            const currentOffset = await progressService.getProgressRecordOffset(currentProgressId);
            const totalCount = await progressService.getTotalProgressCount();

            if (currentOffset < totalCount - 1) {
                // There are more records, load the next one
                const nextRecords = await progressService.getProgressRecordsPaginated(currentOffset + 1, 1);

                if (nextRecords.length > 0) {
                    const nextId = nextRecords[0].id;
                    setCurrentProgressId(nextId);
                    await AsyncStorage.setItem(CURRENT_PROGRESS_ID_STORAGE_KEY, nextId.toString());
                    await loadPuzzleDifficulty(nextId);
                }
            } else {
                // No more records, create a new puzzle
                await createNewRandomPuzzle();
            }
        });
    }, [isNavigating, currentProgressId, progressService, createNewRandomPuzzle, performTransition]);

    const restoreFromSavedProgress = useCallback(async () => {
        if (!isUserDbReady) {
            console.debug('Database not ready, cannot restore progress');
            return null;
        }

        const currentProgressIdStr = await AsyncStorage.getItem(CURRENT_PROGRESS_ID_STORAGE_KEY);
        if (!currentProgressIdStr) return null;

        const currentId = parseInt(currentProgressIdStr, 10);
        if (isNaN(currentId)) {
            await AsyncStorage.removeItem(CURRENT_PROGRESS_ID_STORAGE_KEY);
            return null;
        }

        // Check if the progress record exists in the database
        const progressRecord = await progressService.getProgressRecordById(currentId);
        if (!progressRecord) {
            await AsyncStorage.removeItem(CURRENT_PROGRESS_ID_STORAGE_KEY);
            return null;
        }

        return currentId;
    }, [isUserDbReady, progressService]);

    // Main initialization effect
    useEffect(() => {
        if (!isUserDbReady || isInitialized) {
            return;
        }

        const initializeApp = async () => {
            setLoading(true);
            try {
                const savedProgressId = await restoreFromSavedProgress();
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
    }, [isUserDbReady, isInitialized, restoreFromSavedProgress, createNewRandomPuzzle]);

    // Check navigation availability when currentProgressId changes
    useEffect(() => {
        if (currentProgressId) {
            checkNavigationAvailability();
        }
    }, [currentProgressId, checkNavigationAvailability]);

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

