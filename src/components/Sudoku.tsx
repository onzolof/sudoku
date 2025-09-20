import React, {memo, useEffect, useState} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
} from 'react-native';
import {Move, ProgressSchema} from "../types";
import {useServices} from "../hooks";
import {Ionicons} from "@expo/vector-icons";
import * as Haptics from 'expo-haptics';

type SudokuProps = {
    progressId: number;
};

function Sudoku({progressId}: SudokuProps) {
    const {progressService} = useServices();
    const [loading, setLoading] = useState(true);
    const [sudoku, setSudoku] = useState<ProgressSchema | null>(null);
    const [selectedCell, setSelectedCell] = useState<{ row: number, col: number, isFixed: boolean } | null>(null);

    const gridString = (sudoku?.puzzle ?? '');
    const seedGrid = gridString.match(/.{1,9}/g) || [];

    const handleNumberPress = (number: number) => {
        if (selectedCell && !selectedCell.isFixed) {
            setNumber(number)
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
        }
    };

    const setNumber = (number: number) => {
        if (!sudoku!.moves) {
            // empty initialize moves if not already happened
            sudoku!.moves = []
        }
        // todo: only add a new move, when the value changed for the given cell. check the current value of the cell first.
        sudoku!.moves!.push({col: selectedCell!.col, row: selectedCell!.row, value: number})
        saveSudoku()
    }

    const saveSudoku = () => {
       // todo:
       // progressService.updateProgress(sudoku)
    }

    const handleCellPress = (row: number, col: number, isFixed: boolean) => {
        setSelectedCell({row, col, isFixed});
    };

    useEffect(() => {
        const loadProgress = async () => {
            try {
                const loadedSudoku = await progressService.getProgressRecordById(progressId);
                if (loadedSudoku) {
                    setSudoku(loadedSudoku);
                } else {
                    // This should not happen - Content component ensures progress records exist
                    console.error(`Progress record not found for progress ID: ${progressId}`);
                }
            } catch (error) {
                console.error('Failed to load Sudoku progress:', error);
            } finally {
                setLoading(false);
            }
        };

        setLoading(true);
        loadProgress();
    }, [progressId, progressService]);

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
            <View className="flex-row justify-center items-center mt-6">
                <TouchableOpacity
                    onPress={() => console.log('Clear cell')}
                    className="w-16 h-16 items-center rounded justify-center"
                >
                    <Text className="text-lg font-bold text-muted-foreground">
                        <Ionicons name="trash-outline" size={32}/>
                        <Text className="text-muted-foreground">Bin inactive</Text>
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

const Row = memo(({rowIndex, sudoku, onCellPress, selectedCell}: RowProps & { selectedCell: { row: number, col: number, isFixed: boolean } | null }) => {
    return (
        <View className={`flex flex-row gap-3`}>
            <NineGrid rowIndex={rowIndex} sudoku={sudoku} startCol={0} onCellPress={onCellPress} selectedCell={selectedCell}/>
            <NineGrid rowIndex={rowIndex} sudoku={sudoku} startCol={3} onCellPress={onCellPress} selectedCell={selectedCell}/>
            <NineGrid rowIndex={rowIndex} sudoku={sudoku} startCol={6} onCellPress={onCellPress} selectedCell={selectedCell}/>
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
            <Cell rowIndex={rowIndex} colIndex={startCol} sudoku={sudoku} onCellPress={onCellPress} selectedCell={selectedCell}/>
            <Cell rowIndex={rowIndex} colIndex={startCol + 1} sudoku={sudoku} onCellPress={onCellPress} selectedCell={selectedCell}/>
            <Cell rowIndex={rowIndex} colIndex={startCol + 2} sudoku={sudoku} onCellPress={onCellPress} selectedCell={selectedCell}/>
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
    const gridString = sudoku.puzzle;
    const seedGrid = gridString.match(/.{1,9}/g) || [];
    const cellValue = seedGrid[rowIndex]?.[colIndex] || '0';
    const displayValue = cellValue === '0' ? '' : cellValue;
    const isFixedValue = !!displayValue;

    // Helper function to get the 3x3 grid boundaries
    const getGridBoundaries = (row: number, col: number) => {
        const startRow = Math.floor(row / 3) * 3;
        const endRow = startRow + 2;
        const startCol = Math.floor(col / 3) * 3;
        const endCol = startCol + 2;
        return { startRow, endRow, startCol, endCol };
    };

    // Check if this cell should be highlighted
    const shouldHighlight = () => {
        if (!selectedCell) return false;

        const { row: selectedRow, col: selectedCol } = selectedCell;

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
        if (displayValue && cellValue === seedGrid[selectedRow]?.[selectedCol]) {
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
            <View className={`flex-1 items-center justify-center aspect-square m-0.5 rounded-xl ${getBackgroundStyleClasses()}`}>
                <Text
                    className={`font-mono text-xl font-bold tracking-wider sudoku-number ${getTextStyleClasses()}`}>{displayValue}</Text>
            </View>
        </TouchableWithoutFeedback>
    );
});
