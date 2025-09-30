import React, {memo, useEffect, useMemo} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
} from 'react-native';
import {ProgressSchema} from "../types";
import {useSudokuGame} from "../hooks";
import {Ionicons} from "@expo/vector-icons";
import * as Haptics from 'expo-haptics';

type SudokuProps = {
    progressId: number;
};

// todo: review and clean up this state
// todo: do the individual Haptics-Styles make sense / match each other?
// todo: the following bugs exist
// todo: undo a clear does not work
// todo: disabled/enabled of undo button does not work (when starting a new sudoku it is already enabled)
// todo: undo disable/enabled seems to be wrong when closing & reopening the app after doing few numbers. first it is enabled, then it gets disabled even though the undo does still work and remove move by move
// todo: number button: when pressed, opacity remains existing after inserting a number into the grid

function Sudoku({progressId}: SudokuProps) {
    const {
        selectedCell,
        sudoku,
        isSolved,
        loading,
        cellSelected,
        numberPressed,
        undo,
        clearSelectedCell
    } = useSudokuGame({progressId});

    const handleNumberPress = (number: number) => {
        numberPressed(number!);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    };

    const handleCellPress = (row: number, col: number, isFixed: boolean) => {
        cellSelected(row, col, isFixed);
    };

    const handleClearCell = () => {
        clearSelectedCell()
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const handleUndo = () => {
        undo();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    useEffect(() => {
        // todo: this is just for debugging
        if (sudoku?.moves) {
            console.log('last move: ', sudoku.moves)
        }
    }, [sudoku?.moves]);

    // Check if the selected cell has a value (either original or user input)
    const hasSelectedCellValue = () => {
        if (!selectedCell || !sudoku) return false;

        const {row, col} = selectedCell;

        // Check if there's a user move for this cell
        const moves = Array.isArray(sudoku.moves) ? sudoku.moves : [];
        const userMove = moves.find(move => move.row === row && move.col === col);

        if (userMove) {
            // If there's a user move, check if it has a value (not cleared)
            return userMove.value !== null;
        }

        // Check if there's an original value (fixed cell)
        const gridString = sudoku.puzzle;
        const seedGrid = gridString.match(/.{1,9}/g) || [];
        const originalValue = seedGrid[row]?.[col] || '0';

        return originalValue !== '0';
    };

    const isClearDisabled = useMemo(() => {
        return !selectedCell || selectedCell.isFixed || !hasSelectedCellValue();
    }, [selectedCell, sudoku?.moves]);

    const isUndoDisabled = useMemo(() => {
        return !sudoku?.moves || sudoku.moves.length === 0;
    }, [sudoku?.moves]);

    // todo: maybe get rid of this progress
    if (loading) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="text-base text-foreground">Loading Sudoku...</Text>
            </View>
        );
    }

    if (!sudoku) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="text-base text-foreground">Puzzle not found</Text>
                <Text className="text-xs text-muted">Progress ID: {progressId}</Text>
            </View>
        );
    }

    return (
        <View className="w-full p-6">
            {/*todo: restyle this?*/}
            {isSolved && (
                <View className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg">
                    <Text className="text-center text-green-800 font-bold">
                        🎉 Sudoku Solved! 🎉
                    </Text>
                </View>
            )}

            <View>
                <Row rowIndex={0} sudoku={sudoku} onCellPress={handleCellPress} selectedCell={selectedCell}/>
                <Row rowIndex={1} sudoku={sudoku} onCellPress={handleCellPress} selectedCell={selectedCell}/>
                <Row rowIndex={2} sudoku={sudoku} onCellPress={handleCellPress} selectedCell={selectedCell}/>
                <View className={`h-3`}></View>
                <Row rowIndex={3} sudoku={sudoku} onCellPress={handleCellPress} selectedCell={selectedCell}/>
                <Row rowIndex={4} sudoku={sudoku} onCellPress={handleCellPress} selectedCell={selectedCell}/>
                <Row rowIndex={5} sudoku={sudoku} onCellPress={handleCellPress} selectedCell={selectedCell}/>
                <View className={`h-3`}></View>
                <Row rowIndex={6} sudoku={sudoku} onCellPress={handleCellPress} selectedCell={selectedCell}/>
                <Row rowIndex={7} sudoku={sudoku} onCellPress={handleCellPress} selectedCell={selectedCell}/>
                <Row rowIndex={8} sudoku={sudoku} onCellPress={handleCellPress} selectedCell={selectedCell}/>
            </View>

            <View className="flex-row justify-center items-center mt-6 gap-4">
                {/*todo: restyle these buttons*/}
                <TouchableOpacity
                    onPress={handleUndo}
                    className="w-16 h-16 items-center rounded justify-center"
                    disabled={isUndoDisabled}
                >
                    <Text className="text-lg font-bold text-muted-foreground">
                        <Ionicons name="arrow-undo-outline" size={32}/>
                        <Text className="text-muted-foreground">Undo</Text>
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleClearCell}
                    className="w-16 h-16 items-center rounded justify-center"
                    disabled={isClearDisabled}
                >
                    <Text className="text-lg font-bold text-muted-foreground">
                        <Ionicons
                            name="trash-outline"
                            size={32}
                            color={(!selectedCell || selectedCell.isFixed || !hasSelectedCellValue()) ? '#9CA3AF' : undefined}
                        />
                        <Text
                            className={`${(!selectedCell || selectedCell.isFixed || !hasSelectedCellValue()) ? 'text-gray-400' : 'text-muted-foreground'}`}>
                            Clear
                        </Text>
                    </Text>
                </TouchableOpacity>
            </View>
            <View className="mt-12">
                <View className="w-full flex-row justify-center gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
                        <TouchableOpacity
                            key={number}
                            onPress={() => handleNumberPress(number)}
                            disabled={!selectedCell || selectedCell.isFixed}
                            className="flex-1 rounded-lg"
                        >
                            <Text
                                key={`${number}`}
                                className={`font-mono text-5xl font-bold ${selectedCell && !selectedCell.isFixed ? 'text-primary' : 'text-primary/50'}`}>
                                {number}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    )
}

export default memo(Sudoku);

type RowProps = {
    rowIndex: number;
    sudoku: ProgressSchema;
    onCellPress: (row: number, col: number, isFixed: boolean) => void;
};

const Row = memo(({rowIndex, sudoku, onCellPress, selectedCell}: RowProps & {
    selectedCell: { row: number, col: number, isFixed: boolean } | null
}) => {
    return (
        <View className={`flex flex-row gap-3`}>
            <NineGrid rowIndex={rowIndex} sudoku={sudoku} startCol={0} onCellPress={onCellPress}
                      selectedCell={selectedCell}/>
            <NineGrid rowIndex={rowIndex} sudoku={sudoku} startCol={3} onCellPress={onCellPress}
                      selectedCell={selectedCell}/>
            <NineGrid rowIndex={rowIndex} sudoku={sudoku} startCol={6} onCellPress={onCellPress}
                      selectedCell={selectedCell}/>
        </View>
    );
});


type NineGridProps = {
    rowIndex: number;
    sudoku: ProgressSchema;
    startCol: number;
    onCellPress: (row: number, col: number, isFixed: boolean) => void;
};

const NineGrid = memo(({
                           rowIndex, sudoku, startCol, onCellPress, selectedCell
                       }: NineGridProps & { selectedCell: { row: number, col: number, isFixed: boolean } | null }) => {

    return (
        <View className="flex-1 flex-row items-center justify-center">
            <Cell rowIndex={rowIndex} colIndex={startCol} sudoku={sudoku} onCellPress={onCellPress}
                  selectedCell={selectedCell}/>
            <Cell rowIndex={rowIndex} colIndex={startCol + 1} sudoku={sudoku} onCellPress={onCellPress}
                  selectedCell={selectedCell}/>
            <Cell rowIndex={rowIndex} colIndex={startCol + 2} sudoku={sudoku} onCellPress={onCellPress}
                  selectedCell={selectedCell}/>
        </View>
    );
});

type CellProps = {
    rowIndex: number;
    colIndex: number;
    sudoku: ProgressSchema;
    onCellPress: (row: number, col: number, isFixed: boolean) => void;
};

const Cell = memo(({
                       rowIndex, colIndex, sudoku, onCellPress, selectedCell
                   }: CellProps & { selectedCell: { row: number, col: number, isFixed: boolean } | null }) => {
    // Get the original puzzle seed
    const gridString = sudoku.puzzle;
    const seedGrid = gridString.match(/.{1,9}/g) || [];
    const originalValue = seedGrid[rowIndex]?.[colIndex] || '0';
    const isFixedValue = originalValue !== '0';

    // Get the current value (original + moves)
    const moves = sudoku.moves || [];
    const currentMove = moves.findLast(move => move.row === rowIndex && move.col === colIndex);
    const currentValue = currentMove ? currentMove.value : (originalValue !== '0' ? parseInt(originalValue) : null);
    const displayValue = currentValue ? currentValue.toString() : '';

    // Helper function to get current cell value for any row/col
    const getCurrentCellValue = (row: number, col: number) => {
        const move = moves.find(m => m.row === row && m.col === col);
        if (move) return move.value;
        const originalVal = seedGrid[row]?.[col] || '0';
        return originalVal !== '0' ? parseInt(originalVal) : null;
    };

    // Helper function to get the 3x3 grid boundaries
    const getGridBoundaries = (row: number, col: number) => {
        const startRow = Math.floor(row / 3) * 3;
        const endRow = startRow + 2;
        const startCol = Math.floor(col / 3) * 3;
        const endCol = startCol + 2;
        return {startRow, endRow, startCol, endCol};
    };

    // Check if this cell should be highlighted
    const shouldHighlight = () => {
        if (!selectedCell) return false;

        const {row: selectedRow, col: selectedCol} = selectedCell;

        // Same cell
        if (rowIndex === selectedRow && colIndex === selectedCol) return 'selected';

        // Same row
        if (rowIndex === selectedRow) return 'highlight';

        // Same column
        if (colIndex === selectedCol) return 'highlight';

        // Same 3x3 grid
        const selectedGrid = getGridBoundaries(selectedRow, selectedCol);
        const currentGrid = getGridBoundaries(rowIndex, colIndex);
        if (selectedGrid.startRow === currentGrid.startRow &&
            selectedGrid.startCol === currentGrid.startCol) {
            return 'highlight';
        }

        // Same number (if selected cell has a value)
        const selectedCellValue = getCurrentCellValue(selectedRow, selectedCol);
        if (displayValue && selectedCellValue && displayValue === selectedCellValue.toString()) {
            return 'highlight';
        }

        return false;
    };

    const highlightType = shouldHighlight();

    const getBackgroundStyleClasses = () => {
        if (highlightType === 'selected') {
            if (isFixedValue) {
                return 'bg-primary/20 border-2 border-gray-950'
            } else {
                return 'bg-primary border-2 border-primary'
            }
        } else if (highlightType === 'highlight') {
            if (isFixedValue) {
                return 'bg-primary/20 border-2 border-gray-950'
            } else {
                return 'bg-primary/20 border-2 border-primary/20'
            }
        } else {
            if (isFixedValue) {
                return 'bg-gray-300 border-2 border-gray-950'
            } else {
                return 'bg-gray-200 border-2 border-gray-200'
            }
        }
    };

    const getTextStyleClasses = () => {
        if (highlightType === 'selected' && !isFixedValue) {
            return 'text-primary-foreground'
        } else {
            return 'text-gray-950'
        }
    };

    return (
        <TouchableWithoutFeedback
            onPress={() => onCellPress(rowIndex, colIndex, isFixedValue)}>
            <View
                className={`flex-1 items-center justify-center aspect-square m-0.5 rounded-xl ${getBackgroundStyleClasses()}`}>
                <Text
                    className={`font-mono text-xl font-bold tracking-wider sudoku-number ${getTextStyleClasses()}`}>{displayValue}</Text>
            </View>
        </TouchableWithoutFeedback>
    );
});
