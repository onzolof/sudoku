import React, {useEffect, useState, useCallback, useMemo} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useServices} from '../hooks';
import Sudoku from './Sudoku';
import {CURRENT_SUDOKU_ID_STORAGE_KEY} from "../constants";
import {PuzzleProgress} from "../types";

export default function Content() {
    const { puzzleService, progressService, gameService } = useServices();

    const [currentPuzzleId, setCurrentPuzzleId] = useState<string | null>(null);
    const [nextPuzzleId, setNextPuzzleId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [progressRecords, setProgressRecords] = useState<PuzzleProgress[]>([]);

    const currentIndex = useMemo(() => 
        currentPuzzleId
            ? progressRecords.findIndex(r => r.puzzleId === currentPuzzleId)
            : -1,
        [currentPuzzleId, progressRecords]
    );
    
    const canGoPrevious = useMemo(() => currentIndex > 0, [currentIndex]);
    const canGoNext = useMemo(() => 
        currentIndex < progressRecords.length - 1 || nextPuzzleId, 
        [currentIndex, progressRecords.length, nextPuzzleId]
    );

    const loadProgressRecords = useCallback(async () => {
        const records = await progressService.loadProgressRecords();
        setProgressRecords(records);
        return records;
    }, [progressService]);

    // Core function to find a random puzzle ID that's not in the exclude list
    const findRandomPuzzleId = useCallback(async (
        excludeIds: string[], 
        batchSizes: number[]
    ): Promise<string | null> => {
        return await puzzleService.findRandomPuzzleId(excludeIds, batchSizes);
    }, [puzzleService]);

    // Pre-fetch next puzzle for instant swiping
    const preFetchNextPuzzle = useCallback(async (excludeIds: string[]) => {
        try {
            const puzzleId = await findRandomPuzzleId(excludeIds, [100, 300]);
            if (puzzleId) {
                setNextPuzzleId(puzzleId);
            }
        } catch (error) {
            console.error('Failed to pre-fetch next puzzle:', error);
        }
    }, [findRandomPuzzleId]);

    // Pick random puzzle ID (avoiding long NOT IN queries)
    const pickRandomPuzzleId = useCallback(async (excludeIds: string[]): Promise<string | null> => {
        try {
            return await findRandomPuzzleId(excludeIds, [20, 40, 80, 160]);
        } catch (error) {
            console.error('Failed to pick random puzzle:', error);
            return null;
        }
    }, [findRandomPuzzleId]);

    // Create progress record for a new puzzle
    const createProgressRecord = useCallback(async (puzzleId: string) => {
        try {
            await gameService.createNewGame(puzzleId);
            await loadProgressRecords();
        } catch (error) {
            console.error('Failed to create progress record:', error);
        }
    }, [gameService, loadProgressRecords]);

    // Navigate to previous puzzle
    const goToPreviousPuzzle = useCallback(async () => {
        if (!canGoPrevious) return;
        
        const previousRecord = progressRecords[currentIndex - 1];
        setCurrentPuzzleId(previousRecord.puzzleId);
        await AsyncStorage.setItem(CURRENT_SUDOKU_ID_STORAGE_KEY, previousRecord.puzzleId);
    }, [canGoPrevious, currentIndex, progressRecords]);

    // Navigate to next puzzle or add new one
    const goToNextPuzzle = useCallback(async () => {
        if (currentIndex < progressRecords.length - 1) {
            // Go to existing next puzzle
            const nextRecord = progressRecords[currentIndex + 1];
            setCurrentPuzzleId(nextRecord.puzzleId);
            await AsyncStorage.setItem(CURRENT_SUDOKU_ID_STORAGE_KEY, nextRecord.puzzleId);
        } else if (nextPuzzleId) {
            // Load new puzzle and add it to user db
            try {
                await createProgressRecord(nextPuzzleId);
                
                setCurrentPuzzleId(nextPuzzleId);
                await AsyncStorage.setItem(CURRENT_SUDOKU_ID_STORAGE_KEY, nextPuzzleId);
                setNextPuzzleId(null);

                // Pre-fetch next puzzle for future use
                const updatedRecords = await loadProgressRecords();
                const excludeIds = [nextPuzzleId, ...updatedRecords.map(r => r.puzzleId)];
                await preFetchNextPuzzle(excludeIds);
            } catch (error) {
                console.error('Failed to add new puzzle:', error);
            }
        }
    }, [currentIndex, progressRecords, nextPuzzleId, createProgressRecord, loadProgressRecords, preFetchNextPuzzle]);

    // todo: muss diese funktion so umfangreich sein?
    useEffect(() => {
        const initializeApp = async () => {
            setLoading(true);
            try {
                const userProgress = await loadProgressRecords();
                const currentSudoku = await AsyncStorage.getItem(CURRENT_SUDOKU_ID_STORAGE_KEY);
                
                if (currentSudoku) {
                    const existingIndex = userProgress.findIndex(r => r.puzzleId === currentSudoku);
                    if (existingIndex !== -1) {
                        setCurrentPuzzleId(currentSudoku);
                        const excludeIds = [currentSudoku, ...userProgress.map(r => r.puzzleId)];
                        await preFetchNextPuzzle(excludeIds);
                        console.debug('Restored from saved puzzle');
                        return;
                    } else {
                        await AsyncStorage.removeItem(CURRENT_SUDOKU_ID_STORAGE_KEY);
                        console.debug('Cleared invalid saved puzzle ID');
                    }
                }

                // Pick a new random puzzle
                const excludeIds = userProgress.map(r => r.puzzleId);
                const newSudoku = await pickRandomPuzzleId(excludeIds);
                console.debug('Random puzzle selected:', newSudoku);

                if (newSudoku) {
                    setCurrentPuzzleId(newSudoku);
                    await createProgressRecord(newSudoku);

                    // Pre-fetch next puzzle
                    const updatedRecords = await loadProgressRecords();
                    const updatedExcludeIds = [newSudoku, ...updatedRecords.map(r => r.puzzleId)];
                    await preFetchNextPuzzle(updatedExcludeIds);
                } else {
                    // todo; show alert that no more puzzles are available
                    console.error('No random puzzle available');
                }
            } catch (error) {
                console.error('Failed to initialize app:', error);
            } finally {
                setLoading(false);
            }
        };

        initializeApp();
    }, [loadProgressRecords, pickRandomPuzzleId, createProgressRecord, preFetchNextPuzzle]);

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="text-base text-foreground opacity-70">Loading sudoku...</Text>
            </View>
        );
    }

    return (
        <View>
            <TouchableOpacity
                onPress={goToPreviousPuzzle}
            >
                {canGoPrevious && <Text>←</Text>}
            </TouchableOpacity>

            <TouchableOpacity
                onPress={goToNextPuzzle}
            >
                {canGoNext && <Text>→</Text>}
            </TouchableOpacity>
            
            <View>
                <Sudoku puzzleId={currentPuzzleId}/>
            </View>
        </View>
    );
}

