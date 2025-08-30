import React, {useEffect, useState, useCallback, useMemo, useRef} from 'react';
import {View, Text, FlatList, Dimensions} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useServices} from '../hooks';
import Sudoku from './Sudoku';
import {CURRENT_SUDOKU_ID_STORAGE_KEY} from "../constants";
import {PuzzleProgress} from "../types";

const {width: SCREEN_WIDTH} = Dimensions.get("window");

export default function Content() {
    const {puzzleService, progressService, gameService} = useServices();

    // todo: can i get rid of currentPuzzleId, since we have this information in ref?
    const [currentPuzzleId, setCurrentPuzzleId] = useState<string | null>(null);
    // todo: can i get rid of this nextPuzzle state?
    const [nextPuzzleId, setNextPuzzleId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [progressRecords, setProgressRecords] = useState<PuzzleProgress[]>([]);
    const [shouldScrollToSaved, setShouldScrollToSaved] = useState(false);

    // noinspection TypeScriptValidateTypes
    const listRef = useRef<FlatList<PuzzleProgress>>(null);
    const currentIndex = useMemo(() =>
            currentPuzzleId
                ? progressRecords.findIndex(r => r.puzzleId === currentPuzzleId)
                : -1,
        [currentPuzzleId, progressRecords]
    );

    // After data + currentIndex are known, ensure we’re scrolled correctly.
    useEffect(() => {
        if (!loading && shouldScrollToSaved && currentIndex >= 0 && progressRecords.length > 0) {
            console.debug('Attempting to scroll to index:', currentIndex, 'of', progressRecords.length);
            // Small delay to ensure FlatList is fully rendered
            setTimeout(() => {
                if (listRef.current && currentIndex < progressRecords.length) {
                    console.debug('Scrolling to index:', currentIndex);
                    listRef.current.scrollToIndex({
                        index: currentIndex,
                        animated: false
                    });
                    setShouldScrollToSaved(false); // Reset flag after scrolling
                }
            }, 200); // Increased delay for better reliability
        }
    }, [loading, shouldScrollToSaved, currentIndex, progressRecords.length]);

    const loadProgressRecords = useCallback(async () => {
        const records = await progressService.loadProgressRecords();
        setProgressRecords(records);
        return records;
    }, [progressService]);

    const findRandomPuzzleId = useCallback(async (
        excludeIds: string[],
        batchSizes: number[]
    ): Promise<string | null> => {
        return await puzzleService.findRandomPuzzleId(excludeIds, batchSizes);
    }, [puzzleService]);

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

    const pickRandomPuzzleId = useCallback(async (excludeIds: string[]): Promise<string | null> => {
        try {
            return await findRandomPuzzleId(excludeIds, [20, 40, 80, 160]);
        } catch (error) {
            console.error('Failed to pick random puzzle:', error);
            return null;
        }
    }, [findRandomPuzzleId]);

    const createProgressRecord = useCallback(async (puzzleId: string) => {
        try {
            await gameService.createNewGame(puzzleId);
            await loadProgressRecords();
        } catch (error) {
            console.error('Failed to create progress record:', error);
        }
    }, [gameService, loadProgressRecords]);

    // Extract initialization logic into smaller, focused functions
    const restoreFromSavedPuzzle = useCallback(async (userProgress: PuzzleProgress[]) => {
        const currentSudoku = await AsyncStorage.getItem(CURRENT_SUDOKU_ID_STORAGE_KEY);

        if (!currentSudoku) return false;

        const existingIndex = userProgress.findIndex(r => r.puzzleId === currentSudoku);
        if (existingIndex === -1) {
            await AsyncStorage.removeItem(CURRENT_SUDOKU_ID_STORAGE_KEY);
            console.debug('Cleared invalid saved puzzle ID');
            return false;
        }

        setCurrentPuzzleId(currentSudoku);
        const excludeIds = [currentSudoku, ...userProgress.map(r => r.puzzleId)];
        await preFetchNextPuzzle(excludeIds);
        console.debug('Restored from saved puzzle');
        return true;
    }, [preFetchNextPuzzle]);

    const createNewRandomPuzzle = useCallback(async (userProgress: PuzzleProgress[]) => {
        const excludeIds = userProgress.map(r => r.puzzleId);
        const newSudoku = await pickRandomPuzzleId(excludeIds);
        console.debug('Random puzzle selected:', newSudoku);

        if (!newSudoku) {
            console.error('No random puzzle available');
            return false;
        }

        setCurrentPuzzleId(newSudoku);
        await createProgressRecord(newSudoku);

        // Pre-fetch next puzzle
        const updatedRecords = await loadProgressRecords();
        const updatedExcludeIds = [newSudoku, ...updatedRecords.map(r => r.puzzleId)];
        await preFetchNextPuzzle(updatedExcludeIds);
        return true;
    }, [pickRandomPuzzleId, createProgressRecord, loadProgressRecords, preFetchNextPuzzle]);

    // Add scroll event handling to update current puzzle
    const handleScroll = useCallback((event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / SCREEN_WIDTH);
        
        if (index >= 0 && index < progressRecords.length) {
            const newPuzzleId = progressRecords[index].puzzleId;
            if (newPuzzleId !== currentPuzzleId) {
                setCurrentPuzzleId(newPuzzleId);
                AsyncStorage.setItem(CURRENT_SUDOKU_ID_STORAGE_KEY, newPuzzleId);
            }
        }
    }, [progressRecords, currentPuzzleId]);

    useEffect(() => {
        const initializeApp = async () => {
            setLoading(true);
            try {
                // First, try to restore from saved state
                const savedPuzzleId = await AsyncStorage.getItem(CURRENT_SUDOKU_ID_STORAGE_KEY);
                console.debug('Saved puzzle ID found:', savedPuzzleId);
                
                // Load progress records
                const userProgress = await loadProgressRecords();
                console.debug('Progress records loaded:', userProgress.length);
                
                if (savedPuzzleId && userProgress.some(r => r.puzzleId === savedPuzzleId)) {
                    // Restore from saved state
                    setCurrentPuzzleId(savedPuzzleId);
                    setShouldScrollToSaved(true); // Mark that we should scroll to saved position
                    console.debug('Restored from saved puzzle:', savedPuzzleId);
                    
                    // Pre-fetch next puzzle for smooth swiping
                    const excludeIds = [savedPuzzleId, ...userProgress.map(r => r.puzzleId)];
                    await preFetchNextPuzzle(excludeIds);
                } else {
                    // Create new random puzzle if no valid saved state
                    if (savedPuzzleId) {
                        await AsyncStorage.removeItem(CURRENT_SUDOKU_ID_STORAGE_KEY);
                        console.debug('Cleared invalid saved puzzle ID');
                    }
                    
                    console.debug('Creating new random puzzle');
                    await createNewRandomPuzzle(userProgress);
                }
            } catch (error) {
                console.error('Failed to initialize app:', error);
            } finally {
                setLoading(false);
            }
        };

        initializeApp();
    }, [loadProgressRecords, preFetchNextPuzzle, createNewRandomPuzzle]);

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="text-base text-foreground opacity-70">Loading sudoku...</Text>
            </View>
        );
    }

    // noinspection TypeScriptUnresolvedReference,TypeScriptValidateTypes
    return (
        <FlatList<PuzzleProgress>
            ref={listRef}
            data={progressRecords}
            keyExtractor={(item) => item.puzzleId}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={true} // todo: just for testing
            renderItem={({item}) => (
                <View className="w-screen flex-1 items-center justify-center">
                    <Sudoku puzzleId={item.puzzleId}/>
                </View>
            )}
            initialNumToRender={2}
            windowSize={3}
            removeClippedSubviews
            // Start on currentSudoku the first time the list mounts:
            initialScrollIndex={currentIndex >= 0 ? currentIndex : undefined}
            // Help FlatList jump to indices without measuring:
            getItemLayout={(_, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
            })}
            // If RN can’t yet scroll to that index (not measured), retry shortly:
            onScrollToIndexFailed={(info) => {
                setTimeout(() => {
                    listRef.current?.scrollToIndex({
                        index: info.index,
                        animated: false,
                    });
                }, 50);
            }}
            onScroll={handleScroll} // Add scroll handling
            scrollEventThrottle={16} // Optimize scroll performance
            onLayout={() => {
                // Additional safety: scroll to saved position after layout
                if (shouldScrollToSaved && currentIndex >= 0 && progressRecords.length > 0) {
                    setTimeout(() => {
                        listRef.current?.scrollToIndex({
                            index: currentIndex,
                            animated: false
                        });
                        setShouldScrollToSaved(false);
                    }, 100);
                }
            }}
        />
    )
}

