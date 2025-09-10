import React, {useEffect, useState} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useServices} from '../hooks';
import {useDifficulty} from '../provider';
import {useUserDbReady} from '../db/dbProviders';
import Sudoku from './Sudoku';
import {CURRENT_PROGRESS_ID_STORAGE_KEY, type ProgressStorage} from "../constants";
import {type Difficulty} from '../utils';


export default function Content() {
    const {puzzleService, progressService} = useServices();
    const isUserDbReady = useUserDbReady();
    const {difficulty} = useDifficulty();

    const [loading, setLoading] = useState(true);
    const [navigationData, setNavigationData] = useState<{
        previous: number | null;
        current: number | null;
        next: number | null;
    }>({previous: null, current: null, next: null});

    const loadProgressStorage = async (): Promise<ProgressStorage> => {
        try {
            const stored = await AsyncStorage.getItem(CURRENT_PROGRESS_ID_STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored) as ProgressStorage;
            }
        } catch (error) {
            console.error('Failed to load progress storage:', error);
        }
        return {};
    };

    const saveProgress = async (progressId: number | null) => {
        try {
            const currentStorage = await loadProgressStorage();
            currentStorage[difficulty] = progressId;
            await AsyncStorage.setItem(CURRENT_PROGRESS_ID_STORAGE_KEY, JSON.stringify(currentStorage));
        } catch (error) {
            console.error('Failed to save progress for difficulty:', error);
        }
    };

    const createNewRandomPuzzle = async () => {
        if (!isUserDbReady) {
            console.debug('Database not ready, cannot create new puzzle');
            return false;
        }

        try {
            const newSudokuId = await puzzleService.createNewSudoku(difficulty);
            if (!newSudokuId) {
                console.error('Failed to create new Sudoku');
                return false;
            } else {
                await loadNavigationData(newSudokuId);
            }
            return true;
        } catch (error) {
            console.error('Failed to create new random puzzle:', error);
            return false;
        }
    };

    const restoreFromSavedProgress = async (difficulty: Difficulty) => {
        if (!isUserDbReady) {
            console.debug('Database not ready, cannot restore progress');
            return null;
        }

        const progressStorage = await loadProgressStorage();
        return progressStorage[difficulty];
    };

    const loadNavigationData = async (progressIdToLoad: number) => {
        if (!isUserDbReady) return;

        try {
            const navData = await progressService.getProgressNavigation(progressIdToLoad, difficulty);

            // If no current record found, the progress ID is invalid
            if (!navData.current) {
                console.error(`Progress record ${progressIdToLoad} not found`);
                return;
            }

            const newNavigationState = {
                previous: navData.previous?.id || null,
                current: navData.current?.id || null,
                next: navData.next?.id || null,
            };
            setNavigationData(newNavigationState);
            await saveProgress(newNavigationState.current)
            console.debug('Navigation Data: ', newNavigationState)
        } catch (error) {
            console.error('Failed to load navigation data:', error);
        }
    };

    const loadNextPuzzle = async () => {
        if (!isUserDbReady) return;

        try {
            // If we have a next progress record, load it
            if (navigationData.next) {
                await loadNavigationData(navigationData.next);
            } else {
                // No next record exists, create a new one
                await createNewRandomPuzzle();
            }
        } catch (error) {
            console.error('Failed to load next puzzle:', error);
        }
    };

    const loadPreviousPuzzle = async () => {
        if (!isUserDbReady || !navigationData.previous) return;

        try {
            await loadNavigationData(navigationData.previous);
        } catch (error) {
            console.error('Failed to load previous puzzle:', error);
        }
    };

    const initializeApp = async () => {
        if (!isUserDbReady) return;

        setLoading(true);
        try {
            const savedProgressId = await restoreFromSavedProgress(difficulty);
            if (savedProgressId) {
                await loadNavigationData(savedProgressId);
                console.debug('Restored from saved progress:', savedProgressId);
            } else {
                await createNewRandomPuzzle();
            }
        } catch (error) {
            console.error('Failed to initialize app:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isUserDbReady) {
            return;
        }

        initializeApp();
    }, [isUserDbReady, difficulty]);

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
                    {difficulty.toUpperCase() ?? ''} ({navigationData.current})
                </Text>

                {navigationData.previous && <TouchableOpacity
                    onPress={loadPreviousPuzzle}

                    className="w-12 h-12 rounded-full items-center justify-center bg-gray-600"
                >
                    <Text className="text-white text-xl font-bold">←</Text>
                </TouchableOpacity>
                }
                <TouchableOpacity
                    onPress={loadNextPuzzle}
                    className="w-12 h-12 rounded-full items-center justify-center bg-gray-600"
                >
                    <Text className="text-white text-xl font-bold">→</Text>
                </TouchableOpacity>
            </View>

            {/* Main content area */}
            <View className="flex items-center justify-center">
                {navigationData.current ? (
                    <Sudoku progressId={navigationData.current}/>
                ) : (
                    <Text className="text-base text-gray-600">
                        No puzzle loaded
                    </Text>
                )}
            </View>
        </View>
    );
}

