import React, {useEffect, useState, useCallback} from 'react';
import {View, Text, TouchableOpacity, ActivityIndicator} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useServices} from '../hooks';
import {useUserDbReady} from '../db/dbProviders';
import Sudoku from './Sudoku';
import {CURRENT_PROGRESS_ID_STORAGE_KEY} from "../constants";

export default function Content() {
    const {puzzleService, progressService, gameService} = useServices();
    const isUserDbReady = useUserDbReady();

    const [currentProgressId, setCurrentProgressId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);
    const [canGoLeft, setCanGoLeft] = useState(false);
    const [canGoRight, setCanGoRight] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);

    // Check navigation availability
    const checkNavigationAvailability = useCallback(async () => {
        if (!isUserDbReady || !currentProgressId) {
            setCanGoLeft(false);
            setCanGoRight(true); // Always enable right button
            return;
        }

        try {
            const [totalCount, currentOffset] = await Promise.all([
                progressService.getTotalProgressCount(),
                progressService.getProgressRecordOffset(currentProgressId)
            ]);

            setCanGoLeft(currentOffset > 0);
            setCanGoRight(true); // Always enable right button - will create new puzzle if needed
        } catch (error) {
            console.error('Failed to check navigation availability:', error);
            setCanGoLeft(false);
            setCanGoRight(true); // Always enable right button
        }
    }, [progressService, isUserDbReady, currentProgressId]);

    // Navigation functions
    const navigateToPrevious = useCallback(async () => {
        if (!canGoLeft || isNavigating || !currentProgressId) return;

        setIsNavigating(true);
        try {
            const currentOffset = await progressService.getProgressRecordOffset(currentProgressId);
            const previousRecords = await progressService.getProgressRecordsPaginated(currentOffset - 1, 1);
            
            if (previousRecords.length > 0) {
                const previousId = previousRecords[0].id;
                setCurrentProgressId(previousId);
                await AsyncStorage.setItem(CURRENT_PROGRESS_ID_STORAGE_KEY, previousId.toString());
            }
        } catch (error) {
            console.error('Failed to navigate to previous puzzle:', error);
        } finally {
            setIsNavigating(false);
        }
    }, [canGoLeft, isNavigating, currentProgressId, progressService]);

    const createNewRandomPuzzle = useCallback(async () => {
        if (!isUserDbReady) {
            console.debug('Database not ready, cannot create new puzzle');
            return false;
        }

        try {
            const newSudoku = await puzzleService.findRandomPuzzleId([], [20, 40, 80, 160]);
            if (!newSudoku) {
                console.error('No random puzzle available');
                return false;
            }

            const progressId = await gameService.createNewGame(newSudoku);
            if (progressId) {
                setCurrentProgressId(progressId);
                await AsyncStorage.setItem(CURRENT_PROGRESS_ID_STORAGE_KEY, progressId.toString());
            }
            return true;
        } catch (error) {
            console.error('Failed to create new random puzzle:', error);
            return false;
        }
    }, [puzzleService, gameService, isUserDbReady]);

    const navigateToNext = useCallback(async () => {
        if (isNavigating) return;

        setIsNavigating(true);
        try {
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
                }
            } else {
                // No more records, create a new puzzle
                await createNewRandomPuzzle();
            }
        } catch (error) {
            console.error('Failed to navigate to next puzzle:', error);
        } finally {
            setIsNavigating(false);
        }
    }, [isNavigating, currentProgressId, progressService, createNewRandomPuzzle]);

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
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="text-base text-gray-600 mt-4">
                    {loading ? 'Loading sudoku...' : 'Initializing database...'}
                </Text>
            </View>
        );
    }

    return (
        <View className="flex">
            {/* Header */}
            <View className="flex-row justify-center items-center px-4 py-2">
                <Text className="text-lg font-semibold text-black">
                    Puzzle {currentProgressId}
                </Text>
            </View>

            {/* Main content area */}
            <View className="flex items-center justify-center">
                {isNavigating ? (
                    <View className="items-center">
                        <ActivityIndicator size="large" color="#3B82F6" />
                        <Text className="text-base text-gray-600 mt-4">
                            Loading puzzle...
                        </Text>
                    </View>
                ) : currentProgressId ? (
                    <Sudoku progressId={currentProgressId} />
                ) : (
                    <Text className="text-base text-gray-600">
                        No puzzle loaded
                    </Text>
                )}
            </View>

            {/* Navigation buttons */}
            <View className="flex-row justify-between items-center px-8 py-4">
                <TouchableOpacity
                    onPress={navigateToPrevious}
                    disabled={!canGoLeft || isNavigating}
                    className={`w-16 h-16 rounded-full items-center justify-center ${
                        canGoLeft && !isNavigating ? 'bg-gray-600' : 'bg-gray-300'
                    }`}
                >
                    <Text className="text-white text-2xl font-bold">←</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={navigateToNext}
                    disabled={isNavigating}
                    className={`w-16 h-16 rounded-full items-center justify-center ${
                        !isNavigating ? 'bg-gray-600' : 'bg-gray-300'
                    }`}
                >
                    <Text className="text-white text-2xl font-bold">→</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

