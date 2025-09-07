import React, {useEffect, useState, useCallback, useMemo, useRef} from 'react';
import {View, Text, FlatList, Dimensions, TouchableOpacity} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useServices} from '../hooks';
import {useUserDbReady} from '../db/dbProviders';
import Sudoku from './Sudoku';
import {CURRENT_PROGRESS_ID_STORAGE_KEY, LAZY_LOADING_WINDOW_SIZE} from "../constants";
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
    const [totalCount, setTotalCount] = useState(0);
    const [currentOffset, setCurrentOffset] = useState(0);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);

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

    const loadProgressRecords = useCallback(async (offset: number = 0, limit: number = LAZY_LOADING_WINDOW_SIZE) => {
        if (!isUserDbReady) {
            console.debug('Database not ready, returning empty array');
            return [];
        }

        try {
            const [records, total] = await Promise.all([
                progressService.getProgressRecordsPaginated(offset, limit),
                progressService.getTotalProgressCount()
            ]);
            
            setProgressRecords(records);
            setTotalCount(total);
            setCurrentOffset(offset);
            return records;
        } catch (error) {
            console.error('Failed to load progress records:', error);
            return [];
        }
    }, [progressService, isUserDbReady]);

    const loadMoreRecords = useCallback(async () => {
        if (isLoadingMore || !isUserDbReady || progressRecords.length >= totalCount) {
            return;
        }

        setIsLoadingMore(true);
        try {
            const nextOffset = currentOffset + LAZY_LOADING_WINDOW_SIZE;
            const newRecords = await progressService.getProgressRecordsPaginated(nextOffset, LAZY_LOADING_WINDOW_SIZE);
            
            if (newRecords.length > 0) {
                setProgressRecords(prev => {
                    // Deduplicate records by ID to prevent duplicate keys
                    const existingIds = new Set(prev.map(record => record.id));
                    const filteredNewRecords = newRecords.filter(record => !existingIds.has(record.id));
                    
                    if (filteredNewRecords.length !== newRecords.length) {
                        console.debug(`Filtered out ${newRecords.length - filteredNewRecords.length} duplicate records when loading more`);
                    }
                    
                    return [...prev, ...filteredNewRecords];
                });
                setCurrentOffset(nextOffset);
            }
        } catch (error) {
            console.error('Failed to load more records:', error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [progressService, isUserDbReady, isLoadingMore, currentOffset, progressRecords.length, totalCount]);

    const loadPreviousRecords = useCallback(async () => {
        if (isLoadingPrevious || !isUserDbReady || currentOffset <= 0) {
            return;
        }

        setIsLoadingPrevious(true);
        try {
            const previousOffset = Math.max(0, currentOffset - LAZY_LOADING_WINDOW_SIZE);
            
            // Only load if we're not already at the beginning and the offset is different
            if (previousOffset < currentOffset) {
                const previousRecords = await progressService.getProgressRecordsPaginated(previousOffset, LAZY_LOADING_WINDOW_SIZE);
                
                if (previousRecords.length > 0) {
                    setProgressRecords(prev => {
                        // Deduplicate records by ID to prevent duplicate keys
                        const existingIds = new Set(prev.map(record => record.id));
                        const newRecords = previousRecords.filter(record => !existingIds.has(record.id));
                        
                        if (newRecords.length !== previousRecords.length) {
                            console.debug(`Filtered out ${previousRecords.length - newRecords.length} duplicate records when loading previous`);
                        }
                        
                        return [...newRecords, ...prev];
                    });
                    setCurrentOffset(previousOffset);
                    
                    // Adjust scroll position to maintain current view
                    setTimeout(() => {
                        if (listRef.current) {
                            const newIndex = previousRecords.length; // Index of the first previously visible item
                            listRef.current.scrollToIndex({
                                index: newIndex,
                                animated: false
                            });
                        }
                    }, 100);
                }
            }
        } catch (error) {
            console.error('Failed to load previous records:', error);
        } finally {
            setIsLoadingPrevious(false);
        }
    }, [progressService, isUserDbReady, isLoadingPrevious, currentOffset]);

    // Check if we're at the end of the list
    const isAtEnd = useMemo(() => {
        return progressRecords.length >= totalCount;
    }, [progressRecords.length, totalCount]);

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
            console.debug('Cleared invalid saved progress ID');
            return null;
        }

        // Check if the progress record exists in the database
        const progressRecord = await progressService.getProgressRecordById(currentId);
        if (!progressRecord) {
            await AsyncStorage.removeItem(CURRENT_PROGRESS_ID_STORAGE_KEY);
            console.debug('Cleared invalid saved progress ID');
            return null;
        }

        console.debug('Found valid saved progress ID:', currentId);
        return currentId;
    }, [isUserDbReady, progressService]);

    const loadProgressRecordsForCurrentId = useCallback(async (progressId: number) => {
        if (!isUserDbReady) {
            console.debug('Database not ready, cannot load progress records');
            return [];
        }

        try {
            // Get the offset for the current progress ID
            const recordOffset = await progressService.getProgressRecordOffset(progressId);
            const pageOffset = Math.floor(recordOffset / LAZY_LOADING_WINDOW_SIZE) * LAZY_LOADING_WINDOW_SIZE;
            
            // Load the page containing the current progress record
            const [records, total] = await Promise.all([
                progressService.getProgressRecordsPaginated(pageOffset, LAZY_LOADING_WINDOW_SIZE),
                progressService.getTotalProgressCount()
            ]);
            
            setProgressRecords(records);
            setTotalCount(total);
            setCurrentOffset(pageOffset);
            return records;
        } catch (error) {
            console.error('Failed to load progress records for current ID:', error);
            return [];
        }
    }, [progressService, isUserDbReady]);

    const createNewRandomPuzzle = useCallback(async () => {
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
            // Load the first page to get the updated list
            await loadProgressRecords();
        }

        return true;
    }, [pickRandomPuzzleId, createProgressRecord, loadProgressRecords, isUserDbReady]);

    const addNewRandomPuzzle = useCallback(async () => {
        if (!isUserDbReady) {
            console.debug('Database not ready, cannot add new puzzle');
            return;
        }

        try {
            const newSudoku = await pickRandomPuzzleId();
            if (!newSudoku) {
                console.error('No random puzzle available');
                return;
            }

            const progressId = await createProgressRecord(newSudoku);
            if (progressId) {
                // Get updated total count and load the last page
                const updatedTotalCount = await progressService.getTotalProgressCount();
                const lastPageOffset = Math.max(0, updatedTotalCount - (updatedTotalCount % LAZY_LOADING_WINDOW_SIZE));
                await loadProgressRecords(lastPageOffset, LAZY_LOADING_WINDOW_SIZE);
                
                // Set the new puzzle as current and scroll to it
                setCurrentProgressId(progressId);
                
                // Small delay to ensure the new item is rendered
                setTimeout(() => {
                    if (listRef.current && progressRecords.length > 0) {
                        const newIndex = progressRecords.length - 1;
                        listRef.current.scrollToIndex({
                            index: newIndex,
                            animated: true
                        });
                    }
                }, 100);
            }
        } catch (error) {
            console.error('Failed to add new random puzzle:', error);
        }
    }, [pickRandomPuzzleId, createProgressRecord, loadProgressRecords, isUserDbReady, progressService, progressRecords.length]);

    // Add scroll event handling to update current progress and trigger lazy loading
    const handleScroll = useCallback((event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / SCREEN_WIDTH);

        if (index >= 0 && index < progressRecords.length) {
            const newProgressId = progressRecords[index].id;
            if (newProgressId !== currentProgressId) {
                setCurrentProgressId(newProgressId);
                AsyncStorage.setItem(CURRENT_PROGRESS_ID_STORAGE_KEY, newProgressId.toString());
            }

            // Trigger backward loading when near the beginning
            if (index <= 2 && currentOffset > 0 && !isLoadingPrevious) {
                loadPreviousRecords();
            }
        }
    }, [progressRecords, currentProgressId, currentOffset, isLoadingPrevious, loadPreviousRecords]);

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
                // Try to restore from saved state first
                const savedProgressId = await restoreFromSavedProgress();

                if (savedProgressId) {
                    // Set the current progress ID and load the correct page
                    setCurrentProgressId(savedProgressId);
                    setShouldScrollToSaved(true);
                    await loadProgressRecordsForCurrentId(savedProgressId);
                    console.debug('Restored from saved progress:', savedProgressId);
                } else {
                    // Create new random puzzle if no valid saved state
                    console.debug('Creating new random puzzle');
                    await createNewRandomPuzzle();
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
    }, [isUserDbReady, isInitialized, loadProgressRecordsForCurrentId, restoreFromSavedProgress, createNewRandomPuzzle]);

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

    // noinspection TypeScriptUnresolvedReference,TypeScriptValidateTypes
    return (
        <View>
                <View className="flex-row justify-start items-center px-4 py-2">
                    <TouchableOpacity
                        onPress={addNewRandomPuzzle}
                        className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center"
                    >
                        <Text className="text-white text-2xl font-bold">+</Text>
                    </TouchableOpacity>
                </View>
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
                    onEndReached={!isAtEnd ? loadMoreRecords : undefined} // Forward lazy loading
                    onEndReachedThreshold={0.5} // Load more when 50% from end
                    onScrollBeginDrag={() => {
                        // Trigger backward loading when user starts scrolling and is near beginning
                        if (currentIndex <= 2 && currentOffset > 0 && !isLoadingPrevious) {
                            loadPreviousRecords();
                        }
                    }}
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
        </View>
    )
}

