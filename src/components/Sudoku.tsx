import React, {memo, useEffect, useState} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {ProgressSchema} from "../types";
import {useServices} from "../hooks";
import {Ionicons} from "@expo/vector-icons";

type SudokuProps = {
    progressId: number;
};

function Sudoku({progressId}: SudokuProps) {
    const {progressService} = useServices();
    const [loading, setLoading] = useState(true);
    const [sudoku, setSudoku] = useState<ProgressSchema | null>(null);
    const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
    const [selectedCell, setSelectedCell] = useState<{ row: number, col: number } | null>(null);
    const [isContinuousMode, setIsContinuousMode] = useState(false);

    const gridString = (sudoku?.puzzle ?? '');
    const seedGrid = gridString.match(/.{1,9}/g) || [];

    const handleNumberPress = (number: string) => {
        if (selectedNumber === number) {
            // If same number is pressed again, reset selection
            setSelectedNumber(null);
            setSelectedCell(null);
            setIsContinuousMode(false);
        } else {
            // Select new number (this will exit continuous mode)
            setSelectedNumber(number);
            setSelectedCell(null);
            setIsContinuousMode(false);
        }
    };

    const handleNumberLongPress = (number: string) => {
        setSelectedNumber(number);
        setSelectedCell(null);
        setIsContinuousMode(true);
    };

    const handleCellPress = (row: number, col: number, isFixed: boolean) => {
        if (isFixed) {
            // Do nothing for fixed cells
            return;
        }

        if (selectedNumber) {
            // Insert the selected number into the cell
            // TODO: Update the sudoku puzzle state here
            console.log(`Inserting ${selectedNumber} into cell (${row}, ${col})`);

            // Only reset selection if not in continuous mode
            if (!isContinuousMode) {
                setSelectedNumber(null);
                setSelectedCell(null);
            }
        } else {
            // Select the cell for future number insertion
            setSelectedCell({row, col});
        }
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

    // todo: replace with a beutifyl spinner
    // if (loading) {
    // return (
    // <View className="flex-1 items-center justify-center">
    //     <Text className="text-base text-foreground opacity-70">Loading puzzle...</Text>
    // </View>
    // );
    // }

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
                <Row rowIndex={0} sudoku={sudoku} onCellPress={handleCellPress}/>
                <Row rowIndex={1} sudoku={sudoku} onCellPress={handleCellPress}/>
                <Row rowIndex={2} sudoku={sudoku} onCellPress={handleCellPress}/>
                <View className={`h-3`}></View>
                <Row rowIndex={3} sudoku={sudoku} onCellPress={handleCellPress}/>
                <Row rowIndex={4} sudoku={sudoku} onCellPress={handleCellPress}/>
                <Row rowIndex={5} sudoku={sudoku} onCellPress={handleCellPress}/>
                <View className={`h-3`}></View>
                <Row rowIndex={6} sudoku={sudoku} onCellPress={handleCellPress}/>
                <Row rowIndex={7} sudoku={sudoku} onCellPress={handleCellPress}/>
                <Row rowIndex={8} sudoku={sudoku} onCellPress={handleCellPress}/>
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
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((number) => (
                        <TouchableOpacity
                            key={number}
                            onPress={() => handleNumberPress(number)}
                            onLongPress={() => handleNumberLongPress(number)}
                            delayLongPress={500}
                            className="w-16 h-16 flex-1 items-center justify-center rounded-lg"
                        >
                            <Text
                                className={`text-5xl font-bold ${
                                    selectedNumber === number
                                        ? isContinuousMode
                                            ? 'text-primary border-b border-primary'
                                            : 'text-primary'
                                        : 'text-primary/50'
                                }`}>
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

const Row = memo(({rowIndex, sudoku, onCellPress}: RowProps) => {
    return (
        <View className={`flex flex-row gap-3`}>
            <NineGrid rowIndex={rowIndex} sudoku={sudoku} startCol={0} onCellPress={onCellPress}/>
            <NineGrid rowIndex={rowIndex} sudoku={sudoku} startCol={3} onCellPress={onCellPress}/>
            <NineGrid rowIndex={rowIndex} sudoku={sudoku} startCol={6} onCellPress={onCellPress}/>
        </View>
    );
});


type NineGridProps = {
    rowIndex: number;
    sudoku: ProgressSchema;
    startCol: number;
    onCellPress: (row: number, col: number, isFixed: boolean) => void;
};

const NineGrid = memo(({rowIndex, sudoku, startCol, onCellPress}: NineGridProps) => {

    return (
        <View className="flex-1 flex-row items-center justify-center">
            <Cell rowIndex={rowIndex} colIndex={startCol} sudoku={sudoku} onCellPress={onCellPress}/>
            <Cell rowIndex={rowIndex} colIndex={startCol + 1} sudoku={sudoku} onCellPress={onCellPress}/>
            <Cell rowIndex={rowIndex} colIndex={startCol + 2} sudoku={sudoku} onCellPress={onCellPress}/>
        </View>
    );
});

type CellProps = {
    rowIndex: number;
    colIndex: number;
    sudoku: ProgressSchema;
    onCellPress: (row: number, col: number, isFixed: boolean) => void;
};

const Cell = memo(({rowIndex, colIndex, sudoku, onCellPress}: CellProps) => {
    const gridString = sudoku.puzzle;
    const seedGrid = gridString.match(/.{1,9}/g) || [];
    const cellValue = seedGrid[rowIndex]?.[colIndex] || '0';
    const displayValue = cellValue === '0' ? '' : cellValue;
    const isFixedValue = !!displayValue

    const getBackgroundStyleClasses = () => {
        if (isFixedValue) {
            return 'bg-gray-300 border-2 border-gray-950'
        } else {
            return 'bg-gray-200 border-2 border-gray-200'
        }
    };

    const getFontColorClass = () => {
        return 'text-gray-950'
    }

    return (
        <TouchableOpacity
            onPress={() => onCellPress(rowIndex, colIndex, isFixedValue)}
            className={`flex-1 items-center justify-center aspect-square m-0.5 rounded-xl ${getBackgroundStyleClasses()}`}>
            <Text
                className={`font-mono text-xl font-bold tracking-wider sudoku-number ${getFontColorClass()}`}>{displayValue}</Text>
        </TouchableOpacity>
    );
});
