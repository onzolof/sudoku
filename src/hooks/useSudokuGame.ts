import {useState, useEffect, useCallback, useMemo} from 'react';
import {ProgressSchema, Move} from '../types';
import {useServices} from './useServices';

interface SelectedCell {
    row: number;
    col: number;
    isFixed: boolean;
}

interface UseSudokuGameProps {
    progressId: number;
}

// todo: be carefull with isMemo here?
// todo: what happens if move is invalid
// todo: fix type issues

interface UseSudokuGameReturn {
    // States
    selectedCell: SelectedCell | null;
    sudoku: ProgressSchema | null;
    isSolved: boolean;
    loading: boolean;

    // Actions
    cellSelected: (row: number, col: number, isFixed: boolean) => void;
    numberPressed: (number: number) => void;
    undo: () => void;
    clearSelectedCell: () => void;
}

export function useSudokuGame({progressId}: UseSudokuGameProps): UseSudokuGameReturn {
    const {progressService} = useServices();
    const [loading, setLoading] = useState(true);
    const [sudoku, setSudoku] = useState<ProgressSchema | null>(null);
    const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);

    // Helper function to check if a move is valid
    const isValidMove = (grid: string[][], row: number, col: number, value: number): boolean => {
        const valueStr = value.toString();

        // Check row
        for (let c = 0; c < 9; c++) {
            if (c !== col && grid[row][c] === valueStr) return false;
        }

        // Check column
        for (let r = 0; r < 9; r++) {
            if (r !== row && grid[r][col] === valueStr) return false;
        }

        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if ((r !== row || c !== col) && grid[r][c] === valueStr) return false;
            }
        }

        return true;
    };

    // Calculate the current grid state by applying moves to the original puzzle
    const currentGrid = useMemo(() => {
        if (!sudoku?.puzzle) return null;

        const seedGrid = sudoku.puzzle.match(/.{1,9}/g) || [];
        const moves = Array.isArray(sudoku.moves) ? sudoku.moves : [];

        // Create a copy of the seed grid
        const grid = seedGrid.map(row => row.split(''));

        // Apply all moves
        moves.forEach(move => {
            if (move.row >= 0 && move.row < 9 && move.col >= 0 && move.col < 9) {
                if (move.value !== null) {
                    // Set the value
                    grid[move.row][move.col] = move.value.toString();
                } else {
                    // Clear the cell (set to empty)
                    grid[move.row][move.col] = '0';
                }
            }
        });

        return grid;
    }, [sudoku?.puzzle, sudoku?.moves]);

    const isSolved = useMemo(() => {
        if (!currentGrid) return false;

        // Check if all cells are filled and valid
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const value = currentGrid[row][col];
                if (value === '0' || value === '') return false;

                // Check if the value is valid in its row, column, and 3x3 box
                if (!isValidMove(currentGrid, row, col, parseInt(value))) {
                    return false;
                }
            }
        }

        return true;
    }, [currentGrid, isValidMove]);

    // Save the current state to the database
    const saveSudoku = useCallback(async () => {
        if (!sudoku) return;

        try {
            // Update the moves in the sudoku object
            const updatedSudoku = {
                ...sudoku,
                moves: sudoku.moves || [],
                solved: isSolved ? 1 : 0
            };

            // Save to database
            await progressService.updateProgress(updatedSudoku);
        } catch (error) {
            console.error('Failed to save Sudoku progress:', error);
        }
    }, [sudoku, isSolved, progressService]);

    // Load the initial puzzle
    useEffect(() => {
        const loadProgress = async () => {
            try {
                setLoading(true);
                const loadedSudoku = await progressService.getProgressRecordById(progressId);
                if (loadedSudoku) {
                    setSudoku(loadedSudoku);
                } else {
                    console.error(`Progress record not found for progress ID: ${progressId}`);
                }
            } catch (error) {
                console.error('Failed to load Sudoku progress:', error);
            } finally {
                setLoading(false);
            }
        };

        loadProgress();
    }, [progressId, progressService]);

    // Actions
    const cellSelected = useCallback((row: number, col: number, isFixed: boolean) => {
        setSelectedCell({row, col, isFixed});
    }, []);

    const numberPressed = useCallback((optionalNumber: number | null) => {
        if (!selectedCell || selectedCell.isFixed || !sudoku) return;

        const {row, col} = selectedCell;
        const currentMoves = Array.isArray(sudoku.moves) ? [...sudoku.moves] : [];
        const newMove = {row, col, value: optionalNumber};

        const previousMove = currentMoves.at(-1);
        const isSameMove = previousMove &&
            previousMove.row === newMove.row &&
            previousMove.col === newMove.col &&
            previousMove.value === newMove.value;

        if (!isSameMove) {
            const updatedMoves = [...currentMoves, newMove]; // Create new array
            setSudoku({
                ...sudoku,
                moves: updatedMoves
            });
            saveSudoku();
        }
    }, [selectedCell, sudoku, saveSudoku]);

    const undo = useCallback(() => {
        if (!sudoku?.moves || !Array.isArray(sudoku?.moves) || sudoku.moves.length === 0) return;

        const updatedMoves = [...sudoku.moves];
        updatedMoves.pop();

        setSudoku({
            ...sudoku,
            moves: updatedMoves
        });

        // Only update selected cell if there are moves left
        if (updatedMoves.length > 0) {
            const previousCell = updatedMoves.at(-1);
            setSelectedCell({row: previousCell.row, col: previousCell.col, isFixed: false});
        }

        saveSudoku();
    }, [sudoku, saveSudoku]);

    const clearSelectedCell = useCallback(() => {
        numberPressed(null)
    }, [numberPressed]);

    return {
        // States
        selectedCell,
        sudoku,
        isSolved,
        loading,

        // Actions
        cellSelected,
        numberPressed,
        undo,
        clearSelectedCell
    };
}
