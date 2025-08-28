import React, {useEffect, useState, useCallback} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {usePuzzlesDb, useUserDb} from '../db/dbProviders';
import Sudoku from './Sudoku';
import {CURRENT_SUDOKU_ID_STORAGE_KEY} from "../constants";
import {PuzzleProgress} from "../types";

// todo: clean up and review the code carefully, simplify if possible

export default function Content() {
    const puzzlesDb = usePuzzlesDb();
    const userDb = useUserDb();

    const [currentPuzzleId, setCurrentPuzzleId] = useState<string | null>(null);
    const [nextPuzzleId, setNextPuzzleId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [progressRecords, setProgressRecords] = useState<PuzzleProgress[]>([]);
    // todo: can i get rid of this local state?
    const [currentProgressIndex, setCurrentProgressIndex] = useState<number>(0);

    // todo: how can i declare this function to return type PuzzleProgress[]
    const loadProgressRecords = useCallback(async () => {
        try {
            const records = await userDb.getAllAsync(
                'SELECT puzzleId, puzzle, moves, notes, solved FROM progress ORDER BY rowid ASC;'
            ) as PuzzleProgress[];
            setProgressRecords(records);
            return records;
        } catch (error) {
            console.error('Failed to load progress records:', error);
            return [];
        }
    }, [userDb]);

    // Pre-fetch next puzzle for instant swiping
    const preFetchNextPuzzle = useCallback(async (excludeIds: string[]) => {
        try {
            // Get a batch of random puzzles and filter in JS to avoid long NOT IN queries
            const batchSize = 100;
            // todo: extract the following logic in a new function which takes batch size as input and call this function twice then
            const randomPuzzles = await puzzlesDb.getAllAsync(
                'SELECT id FROM puzzle ORDER BY RANDOM() LIMIT ?;',
                [batchSize]
            ) as { id: string }[];

            // Filter out excluded IDs
            const availablePuzzles = randomPuzzles.filter(p => !excludeIds.includes(p.id));

            if (availablePuzzles.length > 0) {
                setNextPuzzleId(availablePuzzles[0].id);
                return;
            }

            // If batch was too small, try a larger one
            const largerBatch = await puzzlesDb.getAllAsync(
                'SELECT id FROM puzzle ORDER BY RANDOM() LIMIT ?;',
                [batchSize * 3]
            ) as { id: string }[];

            const available = largerBatch.filter(p => !excludeIds.includes(p.id));
            if (available.length > 0) {
                setNextPuzzleId(available[0].id);
            }
        } catch (error) {
            console.error('Failed to pre-fetch next puzzle:', error);
        }
    }, [puzzlesDb]);

    // Pick random puzzle ID (avoiding long NOT IN queries)
    const pickRandomPuzzleId = useCallback(async (excludeIds: string[]): Promise<string | null> => {
        // todo: what is the difference between this and the previous function?
        try {
            const batchSize = 20;
            const randomPuzzles = await puzzlesDb.getAllAsync(
                'SELECT id FROM puzzle ORDER BY RANDOM() LIMIT ?;',
                [batchSize]
            ) as { id: string }[];

            const availablePuzzles = randomPuzzles.filter(p => !excludeIds.includes(p.id));

            if (availablePuzzles.length > 0) {
                return availablePuzzles[0].id;
            }

            // If batch was too small, try larger batches
            for (let size = batchSize * 2; size <= batchSize * 5; size *= 2) {
                const largerBatch = await puzzlesDb.getAllAsync(
                    'SELECT id FROM puzzle ORDER BY RANDOM() LIMIT ?;',
                    [size]
                ) as { id: string }[];

                const available = largerBatch.filter(p => !excludeIds.includes(p.id));
                if (available.length > 0) {
                    return available[0].id;
                }
            }

            return null;
        } catch (error) {
            console.error('Failed to pick random puzzle:', error);
            return null;
        }
    }, [puzzlesDb]);

    // Create progress record for a new puzzle
    const createProgressRecord = useCallback(async (puzzleId: string) => {
        try {
            // Get puzzle seed from puzzles DB
            const puzzle = await puzzlesDb.getFirstAsync(
                'SELECT seed FROM puzzle WHERE id = ? LIMIT 1;',
                [puzzleId]
            ) as { seed: string } | null;

            if (puzzle) {
                await userDb.runAsync(
                    'INSERT INTO progress (puzzleId, puzzle, moves, notes, solved) VALUES (?, ?, NULL, NULL, 0);',
                    [puzzleId, puzzle.seed]
                );

                // Refresh progress records
                await loadProgressRecords();
            }
        } catch (error) {
            console.error('Failed to create progress record:', error);
        }
    }, [puzzlesDb, userDb, loadProgressRecords]);


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
                        setCurrentProgressIndex(existingIndex);
                        const excludeIds = [currentSudoku, ...userProgress.map(r => r.puzzleId)];
                        await preFetchNextPuzzle(excludeIds);
                        console.debug('Restored from saved puzzle');
                        return;
                    } else {
                        await AsyncStorage.removeItem(CURRENT_SUDOKU_ID_STORAGE_KEY);
                        console.debug('Cleared invalid saved puzzle ID');
                    }
                }

                // todo: do i have to do this two times?
                const excludeIds = userProgress.map(r => r.puzzleId);
                const newSudoku = await pickRandomPuzzleId(excludeIds);
                console.debug('Random puzzle selected:', newSudoku);

                if (newSudoku) {
                    setCurrentPuzzleId(newSudoku);
                    await createProgressRecord(newSudoku);

                    // Refresh records and set index
                    // todo: can this code be made more elegantly? avoid re-calling the load and find?
                    const newRecords = await loadProgressRecords();
                    const newIndex = newRecords.findIndex(r => r.puzzleId === newSudoku);
                    // todo: is currentProgressIndex even needed as a local state?
                    setCurrentProgressIndex(newIndex);

                    const updatedExcludeIds = [newSudoku, ...newRecords.map(r => r.puzzleId)];
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

    // Handle current puzzle changes
    useEffect(() => {
        if (currentPuzzleId && progressRecords.length > 0) {
            const index = progressRecords.findIndex(r => r.puzzleId === currentPuzzleId);
            if (index !== -1) {
                setCurrentProgressIndex(index);
            }
        }
    }, [currentPuzzleId, progressRecords]);

    // Navigate to previous puzzle
    const goToPreviousPuzzle = useCallback(async () => {
        if (currentProgressIndex > 0) {
            const previousIndex = currentProgressIndex - 1;
            const previousRecord = progressRecords[previousIndex];
            setCurrentProgressIndex(previousIndex);
            setCurrentPuzzleId(previousRecord.puzzleId);
            await AsyncStorage.setItem(CURRENT_SUDOKU_ID_STORAGE_KEY, previousRecord.puzzleId);
        }
    }, [currentProgressIndex, progressRecords]);

    // Navigate to next puzzle or add new one
    const goToNextPuzzle = useCallback(async () => {
        if (currentProgressIndex < progressRecords.length - 1) {
            const nextIndex = currentProgressIndex + 1;
            const nextRecord = progressRecords[nextIndex];
            setCurrentProgressIndex(nextIndex);
            setCurrentPuzzleId(nextRecord.puzzleId);
            await AsyncStorage.setItem(CURRENT_SUDOKU_ID_STORAGE_KEY, nextRecord.puzzleId);
        } else if (nextPuzzleId) {
            // Load new puzzle and add it to user db
            try {
                await createProgressRecord(nextPuzzleId);

                const updatedRecords = await loadProgressRecords();
                const newIndex = updatedRecords.length - 1;

                setCurrentProgressIndex(newIndex);
                setCurrentPuzzleId(nextPuzzleId);
                await AsyncStorage.setItem(CURRENT_SUDOKU_ID_STORAGE_KEY, nextPuzzleId);

                setNextPuzzleId(null);

                // todo: this code duplication should be prevented as well
                const excludeIds = [nextPuzzleId, ...updatedRecords.map(r => r.puzzleId)];
                await preFetchNextPuzzle(excludeIds);
            } catch (error) {
                console.error('Failed to add new puzzle:', error);
            }
        }
    }, [currentProgressIndex, progressRecords, nextPuzzleId, createProgressRecord, loadProgressRecords, preFetchNextPuzzle]);

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="text-base text-foreground opacity-70">Loading sudoku...</Text>
            </View>
        );
    }

    return (
        <View>
            {/*todo: should be left of sudoku*/}
            <TouchableOpacity
                onPress={goToPreviousPuzzle}
                disabled={currentProgressIndex === 0}
            >
                <Text>←</Text>
            </TouchableOpacity>

            {/*todo: should be right of sudoku*/}
            <TouchableOpacity
                onPress={goToNextPuzzle}
                disabled={!nextPuzzleId && currentProgressIndex >= progressRecords.length - 1}
            >
                <Text>→</Text>
            </TouchableOpacity>
            <View>
                <Sudoku puzzleId={currentPuzzleId}/>
            </View>
        </View>
    );
}

