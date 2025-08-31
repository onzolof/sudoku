import React, {useEffect, useState, useCallback, useMemo, useRef} from 'react';
import {View, Text, FlatList, Dimensions} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useServices} from '../hooks';
import {useUserDbReady} from '../db/dbProviders';
import Sudoku from './Sudoku';
import {CURRENT_PROGRESS_ID_STORAGE_KEY} from "../constants";
import {PuzzleProgress} from "../types";

const {width: SCREEN_WIDTH} = Dimensions.get("window");

export default function Content() {
    const {puzzleService, progressService, gameService} = useServices();
    const isUserDbReady = useUserDbReady();

    // todo: can i get rid of currentProgressId, since we have this information in ref?
    const [currentProgressId, setCurrentProgressId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [progressRecords, setProgressRecords] = useState<PuzzleProgress[]>([]);
    const [shouldScrollToSaved, setShouldScrollToSaved] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // noinspection TypeScriptValidateTypes
    const listRef = useRef<FlatList<PuzzleProgress>>(null);
    const currentIndex = useMemo(() =>
            currentProgressId
                ? progressRecords.findIndex(r => r.id === currentProgressId)
                : -1,
        [currentProgressId, progressRecords]
    );

    // After data + currentIndex are known, ensure we're scrolled correctly.
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
        if (!isUserDbReady) {
            console.debug('Database not ready, returning empty array');
            return [];
        }
        
        try {
            const records = await progressService.loadProgressRecords();
            setProgressRecords(records);
            return records;
        } catch (error) {
            console.error('Failed to load progress records:', error);
            return [];
        }
    }, [progressService, isUserDbReady]);

    const findRandomPuzzleId = useCallback(async (
        batchSizes: number[]
    ): Promise<string | null> => {
        return await puzzleService.findRandomPuzzleId([], batchSizes);
    }, [puzzleService]);

    const pickRandomPuzzleId = useCallback(async (): Promise<string | null> => {
        try {
            return await findRandomPuzzleId([20, 40, 80, 160]);
        } catch (error) {
            console.error('Failed to pick random puzzle:', error);
            return null;
        }
    }, [findRandomPuzzleId]);

    const createProgressRecord = useCallback(async (puzzleId: string) => {
        if (!isUserDbReady) {
            console.debug('Database not ready, cannot create progress record');
            return null;
        }
        
        try {
            const progressId = await gameService.createNewGame(puzzleId);
            // Don't reload here - let the caller handle it if needed
            return progressId;
        } catch (error) {
            console.error('Failed to create progress record:', error);
            return null;
        }
    }, [gameService, isUserDbReady]);

    // Extract initialization logic into smaller, focused functions
    const restoreFromSavedProgress = useCallback(async (userProgress: PuzzleProgress[]) => {
        if (!isUserDbReady) {
            console.debug('Database not ready, cannot restore progress');
            return false;
        }
        
        const currentProgressIdStr = await AsyncStorage.getItem(CURRENT_PROGRESS_ID_STORAGE_KEY);

        if (!currentProgressIdStr) return false;

        const currentId = parseInt(currentProgressIdStr, 10);
        if (isNaN(currentId)) {
            await AsyncStorage.removeItem(CURRENT_PROGRESS_ID_STORAGE_KEY);
            console.debug('Cleared invalid saved progress ID');
            return false;
        }

        const existingIndex = userProgress.findIndex(r => r.id === currentId);
        if (existingIndex === -1) {
            await AsyncStorage.removeItem(CURRENT_PROGRESS_ID_STORAGE_KEY);
            console.debug('Cleared invalid saved progress ID');
            return false;
        }

        setCurrentProgressId(currentId);
        setShouldScrollToSaved(true); // Mark that we should scroll to saved position
        console.debug('Restored from saved progress');
        return true;
    }, [isUserDbReady]);

    const createNewRandomPuzzle = useCallback(async (userProgress: PuzzleProgress[]) => {
        if (!isUserDbReady) {
            console.debug('Database not ready, cannot create new puzzle');
            return false;
        }
        
        const newSudoku = await pickRandomPuzzleId();
        console.debug('Random puzzle selected:', newSudoku);

        if (!newSudoku) {
            console.error('No random puzzle available');
            return false;
        }

        const progressId = await createProgressRecord(newSudoku);
        if (progressId) {
            setCurrentProgressId(progressId);
            // Reload progress records to get the updated list
            await loadProgressRecords();
        }

        return true;
    }, [pickRandomPuzzleId, createProgressRecord, loadProgressRecords, isUserDbReady]);

    // Add scroll event handling to update current progress
    const handleScroll = useCallback((event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / SCREEN_WIDTH);
        
        if (index >= 0 && index < progressRecords.length) {
            const newProgressId = progressRecords[index].id;
            if (newProgressId !== currentProgressId) {
                setCurrentProgressId(newProgressId);
                AsyncStorage.setItem(CURRENT_PROGRESS_ID_STORAGE_KEY, newProgressId.toString());
            }
        }
    }, [progressRecords, currentProgressId]);

    // Main initialization effect
    useEffect(() => {
        // Only run initialization when database is ready and not already initialized
        if (!isUserDbReady || isInitialized) {
            return;
        }

        console.debug('Starting app initialization...');
        const initializeApp = async () => {
            setLoading(true);
            try {
                // Load progress records first
                const userProgress = await loadProgressRecords();
                console.debug('Progress records loaded:', userProgress.length);
                
                // Try to restore from saved state
                const restored = await restoreFromSavedProgress(userProgress);
                
                if (!restored) {
                    // Create new random puzzle if no valid saved state
                    console.debug('Creating new random puzzle');
                    await createNewRandomPuzzle(userProgress);
                }
                setIsInitialized(true); // Mark initialization as complete
                console.debug('App initialization complete');
            } catch (error) {
                console.error('Failed to initialize app:', error);
            } finally {
                setLoading(false);
            }
        };

        initializeApp();
    }, [isUserDbReady, isInitialized, loadProgressRecords, restoreFromSavedProgress, createNewRandomPuzzle]);

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="text-base text-foreground opacity-70">Loading sudoku...</Text>
            </View>
        );
    }

    if (!isUserDbReady) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="text-base text-foreground opacity-70">Initializing database...</Text>
            </View>
        );
    }

    // todo:
     // 1. ✅ use progress id instead of puzzle id and drop unique-puzzle constraint
     // 2. implementing rolling window on progress records (keep at max 10 puzzles in the memory)
     // 3. draw a new sudoku from puzzles db and create a corresponding instance on user db when swiping right when no progress records exist anymore (maybe create a dedicated button for it first)
     // 4. ask what could improved
     // 5. extract gameLogic to gameService.ts
     // 6. review everything and test properly

    // noinspection TypeScriptUnresolvedReference,TypeScriptValidateTypes
    return (
        <FlatList<PuzzleProgress>
            ref={listRef}
            data={progressRecords}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={true} // todo: just for testing
            renderItem={({item}) => (
                <View className="w-screen flex-1 items-center justify-center">
                    <Sudoku progressId={item.id}/>
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
            // If RN can't yet scroll to that index (not measured), retry shortly:
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

