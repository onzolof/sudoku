import React, {memo, useEffect, useState} from 'react';
import {View, Text} from 'react-native';
import {ProgressSchema} from "../types";
import {useServices} from "../hooks";
import {SquircleView} from "react-native-figma-squircle";
import {useColorScheme} from "nativewind";

type SudokuProps = {
    progressId: number;
};

function Sudoku({progressId}: SudokuProps) {
    const {progressService} = useServices();
    const [loading, setLoading] = useState(true);
    const [sudoku, setSudoku] = useState<ProgressSchema | null>(null);

    const gridString = (sudoku?.puzzle ?? '');
    const seedGrid = gridString.match(/.{1,9}/g) || [];

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
            <Row rowIndex={0} sudoku={sudoku}/>
            <Row rowIndex={1} sudoku={sudoku}/>
            <Row rowIndex={2} sudoku={sudoku}/>
            <View className={`h-3`}></View>
            <Row rowIndex={3} sudoku={sudoku}/>
            <Row rowIndex={4} sudoku={sudoku}/>
            <Row rowIndex={5} sudoku={sudoku}/>
            <View className={`h-3`}></View>
            <Row rowIndex={6} sudoku={sudoku}/>
            <Row rowIndex={7} sudoku={sudoku}/>
            <Row rowIndex={8} sudoku={sudoku}/>
        </View>
    )
}

export default memo(Sudoku);

type RowProps = {
    rowIndex: number;
    sudoku: ProgressSchema;
};

const Row = memo(({rowIndex, sudoku}: RowProps) => {
    return (
        <View className={`flex flex-row gap-3`}>
            <NineGrid rowIndex={rowIndex} sudoku={sudoku} startCol={0}/>
            <NineGrid rowIndex={rowIndex} sudoku={sudoku} startCol={3}/>
            <NineGrid rowIndex={rowIndex} sudoku={sudoku} startCol={6}/>
        </View>
    );
});


type NineGridProps = {
    rowIndex: number;
    sudoku: ProgressSchema;
    startCol: number;
};

const NineGrid = memo(({rowIndex, sudoku, startCol}: NineGridProps) => {

    return (
        <View className="flex-1 flex-row items-center justify-center">
            <Cell rowIndex={rowIndex} colIndex={startCol} sudoku={sudoku}/>
            <Cell rowIndex={rowIndex} colIndex={startCol + 1} sudoku={sudoku}/>
            <Cell rowIndex={rowIndex} colIndex={startCol + 2} sudoku={sudoku}/>
        </View>
    );
});

type CellProps = {
    rowIndex: number;
    colIndex: number;
    sudoku: ProgressSchema;
};

const Cell = memo(({rowIndex, colIndex, sudoku}: CellProps) => {
    const gridString = sudoku.puzzle;
    const seedGrid = gridString.match(/.{1,9}/g) || [];
    const cellValue = seedGrid[rowIndex]?.[colIndex] || '0';
    const displayValue = cellValue === '0' ? '' : cellValue;
    const isFixedValue = !!displayValue


    const getBackgroundStyleClasses = () => {
        if (isFixedValue) {
            return 'bg-gray-600'
        } else {
            return 'bg-gray-200'
        }
    };

    const getFontColorClass = () => {
        if (isFixedValue) {
            return 'text-neutral-200'
        } else {
            return 'text-gray-900'
        }
    }

    return (
        <View
            className={`flex-1 items-center justify-center aspect-square m-0.5 rounded-xl ${getBackgroundStyleClasses()}`}>
            <Text
                className={`font-mono text-xl font-bold tracking-wider sudoku-number ${getFontColorClass()}`}>{displayValue}</Text>
        </View>
    );
});
