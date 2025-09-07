import React, {useEffect, useState} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useServices} from '../hooks';
import {useDifficulty} from '../provider';
import {useUserDbReady} from '../db/dbProviders';
import Sudoku from './Sudoku';
import {CURRENT_PROGRESS_ID_STORAGE_KEY, type ProgressStorage} from "../constants";
import {type Difficulty} from '../utils';


// todo:
// 1. proper testing of changing difficulty
// 2. cleaning up
// 3. re-adding back button
// 4. extracting primary color / theming logic from settings component to utils

export default function Content() {
    const {puzzleService, progressService} = useServices();
    const isUserDbReady = useUserDbReady();
    const {difficulty} = useDifficulty();

    const [currentProgressId, setCurrentProgressId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

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

    const saveProgressForDifficulty = async (difficulty: Difficulty, progressId: number | null) => {
        try {
            const currentStorage = await loadProgressStorage();
            currentStorage[difficulty] = progressId;
            await AsyncStorage.setItem(CURRENT_PROGRESS_ID_STORAGE_KEY, JSON.stringify(currentStorage));
        } catch (error) {
            console.error('Failed to save progress for difficulty:', error);
        }
    };


    const loadPuzzleDifficulty = async (progressId: number) => {
        if (!isUserDbReady) return;

        try {
            const progressRecord = await progressService.getProgressRecordById(progressId);
            if (progressRecord) {
                const puzzle = await puzzleService.getPuzzleById(progressRecord.puzzleId);
            }
        } catch (error) {
            console.error('Failed to load puzzle difficulty:', error);
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
                setCurrentProgressId(newSudokuId);
                await saveProgressForDifficulty(difficulty, newSudokuId);
                await loadPuzzleDifficulty(newSudokuId);
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
    };

    const loadNextPuzzle = async () => {
        await createNewRandomPuzzle();
    };

    const initializeApp = async () => {
        if (!isUserDbReady) return;

        setLoading(true);
        try {
            const savedProgressId = await restoreFromSavedProgress(difficulty);
            if (savedProgressId) {
                setCurrentProgressId(savedProgressId);
                await loadPuzzleDifficulty(savedProgressId);
                console.debug('Restored from saved progress:', savedProgressId);
            } else {
                console.debug('Creating new random puzzle');
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

            {/* Header with next puzzle button */}
            <View className="flex-row justify-between items-center px-4 py-2">
                <Text className="text-lg font-semibold text-black">
                    {difficulty.toUpperCase() ?? ''} ({currentProgressId})
                </Text>

                {/*todo: button for loading Previous Puzzle*/}
                <TouchableOpacity
                    onPress={loadNextPuzzle}
                    className="w-12 h-12 rounded-full items-center justify-center bg-gray-600"
                >
                    <Text className="text-white text-xl font-bold">→</Text>
                </TouchableOpacity>
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

