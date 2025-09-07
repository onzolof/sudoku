import React, {createContext, useContext, useState, useEffect, useCallback, ReactNode} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Difficulty, defaultDifficulty} from '../utils';
import {SUDOKU_DIFFICULTY_STORAGE_KEY} from '../constants';

interface DifficultyContextType {
    difficulty: Difficulty;
    setDifficulty: (newDifficulty: Difficulty) => void;
    isLoading: boolean;
}

const DifficultyContext = createContext<DifficultyContextType | undefined>(undefined);

interface DifficultyProviderProps {
    children: ReactNode;
}

/**
 * Provider component that manages difficulty state globally
 * This ensures all components share the same difficulty state
 */
export function DifficultyProvider({children}: DifficultyProviderProps) {
    const [difficulty, setDifficultyState] = useState<Difficulty>(defaultDifficulty);
    const [isLoading, setIsLoading] = useState(true);

    // Load difficulty from storage on mount
    useEffect(() => {
        const loadDifficulty = async () => {
            try {
                const storedDifficulty = await AsyncStorage.getItem(SUDOKU_DIFFICULTY_STORAGE_KEY);
                if (storedDifficulty && storedDifficulty !== difficulty) {
                    setDifficultyState(storedDifficulty as Difficulty);
                }
            } catch (error) {
                console.error('Failed to load difficulty from storage:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadDifficulty();
    }, []);

    // Save difficulty to storage whenever it changes
    useEffect(() => {
        if (isLoading) return; // Don't save during initial load

        const saveDifficulty = async () => {
            try {
                await AsyncStorage.setItem(SUDOKU_DIFFICULTY_STORAGE_KEY, difficulty);
            } catch (error) {
                console.error('Failed to save difficulty to storage:', error);
            }
        };

        saveDifficulty();
    }, [difficulty, isLoading]);

    // Memoized setter to prevent unnecessary re-renders
    const setDifficulty = useCallback((newDifficulty: Difficulty) => {
        setDifficultyState(newDifficulty);
    }, []);

    const value = {
        difficulty,
        setDifficulty,
        isLoading,
    };

    return (
        <DifficultyContext.Provider value={value}>
            {children}
        </DifficultyContext.Provider>
    );
}

/**
 * Hook to access difficulty context
 * Must be used within a DifficultyProvider
 */
export function useDifficulty(): DifficultyContextType {
    const context = useContext(DifficultyContext);
    if (context === undefined) {
        throw new Error('useDifficulty must be used within a DifficultyProvider');
    }
    return context;
}
