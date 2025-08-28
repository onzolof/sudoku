import React, {useEffect, useMemo, useState, useCallback} from 'react';
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
    const [currentProgressIndex, setCurrentProgressIndex] = useState<number>(0);

    // Add debugging
    console.log('Content render state:', {
        loading,
        currentPuzzleId,
        progressRecordsLength: progressRecords.length,
        currentProgressIndex,
        nextPuzzleId
    });

    // Memoized current puzzle for performance
    const currentPuzzle = useMemo(() =>
            progressRecords[currentProgressIndex] || null,
        [progressRecords, currentProgressIndex]
    );

    // Load progress records ordered by creation (we'll use rowid for ordering)
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
            const batchSize = 20;
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


    // Initialize app state
    useEffect(() => {
        const initializeApp = async () => {
            setLoading(true);
            try {
                console.log('Starting app initialization...');

                // 1. Load progress records first
                const records = await loadProgressRecords();
                console.log('Loaded progress records:', records.length);

                // 2. Try to restore from @current_sudoku_id
                const savedPuzzleId = await AsyncStorage.getItem(CURRENT_SUDOKU_ID_STORAGE_KEY);
                console.log('Saved puzzle ID:', savedPuzzleId);

                if (savedPuzzleId) {
                    // Check if this puzzle exists in progress and find its index
                    const existingIndex = records.findIndex(r => r.puzzleId === savedPuzzleId);
                    console.log('Existing index:', existingIndex);

                    if (existingIndex !== -1) {
                        setCurrentPuzzleId(savedPuzzleId);
                        setCurrentProgressIndex(existingIndex);

                        // Pre-fetch next puzzle for the restored puzzle
                        const excludeIds = [savedPuzzleId, ...records.map(r => r.puzzleId)];
                        await preFetchNextPuzzle(excludeIds);
                        console.log('Restored from saved puzzle');
                        return; // Exit early since we restored successfully
                    } else {
                        // Saved ID doesn't exist in progress, clear it
                        await AsyncStorage.removeItem(CURRENT_SUDOKU_ID_STORAGE_KEY);
                        console.log('Cleared invalid saved puzzle ID');
                    }
                }

                // 3. If no current puzzle, pick a random one not in progress
                console.log('Picking random puzzle...');
                const excludeIds = records.map(r => r.puzzleId);
                const randomPuzzle = await pickRandomPuzzleId(excludeIds);
                console.log('Random puzzle selected:', randomPuzzle);

                if (randomPuzzle) {
                    setCurrentPuzzleId(randomPuzzle);
                    // Create progress record for this puzzle
                    console.log('Creating progress record...');
                    await createProgressRecord(randomPuzzle);

                    // Refresh records and set index
                    const newRecords = await loadProgressRecords();
                    console.log('New records after creation:', newRecords.length);

                    const newIndex = newRecords.findIndex(r => r.puzzleId === randomPuzzle);
                    setCurrentProgressIndex(newIndex);
                    console.log('Set current index to:', newIndex);

                    // Pre-fetch next puzzle
                    const updatedExcludeIds = [randomPuzzle, ...newRecords.map(r => r.puzzleId)];
                    await preFetchNextPuzzle(updatedExcludeIds);
                } else {
                    console.log('No random puzzle available');
                }

            } catch (error) {
                console.error('Failed to initialize app:', error);
            } finally {
                setLoading(false);
                console.log('App initialization complete');
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
            // Go to existing next puzzle
            const nextIndex = currentProgressIndex + 1;
            const nextRecord = progressRecords[nextIndex];

            setCurrentProgressIndex(nextIndex);
            setCurrentPuzzleId(nextRecord.puzzleId);
            await AsyncStorage.setItem(CURRENT_SUDOKU_ID_STORAGE_KEY, nextRecord.puzzleId);
        } else if (nextPuzzleId) {
            // Add new puzzle
            try {
                await createProgressRecord(nextPuzzleId);

                // Refresh records and move to the new puzzle
                const updatedRecords = await loadProgressRecords();
                const newIndex = updatedRecords.length - 1;

                setCurrentProgressIndex(newIndex);
                setCurrentPuzzleId(nextPuzzleId);
                await AsyncStorage.setItem(CURRENT_SUDOKU_ID_STORAGE_KEY, nextPuzzleId);

                // Clear next puzzle and pre-fetch new one
                setNextPuzzleId(null);

                // Pre-fetch next puzzle
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
                <Text className="text-base text-foreground opacity-70">Loading puzzle...</Text>
            </View>
        );
    }

    // Add more detailed debugging
    console.log('Render decision:', {
        currentPuzzleId,
        progressRecordsLength: progressRecords.length,
        shouldShowNoPuzzle: !currentPuzzleId || progressRecords.length === 0
    });

    if (!currentPuzzleId || progressRecords.length === 0) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="text-base text-foreground">No puzzle found</Text>
                <Text className="text-xs text-muted mt-2">
                    currentPuzzleId: {currentPuzzleId || 'null'}
                </Text>
                <Text className="text-xs text-muted">
                    progressRecords: {progressRecords.length}
                </Text>
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

