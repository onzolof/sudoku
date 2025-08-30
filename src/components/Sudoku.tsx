import React, {useEffect, useState} from 'react';
import {View, Text} from 'react-native';
import {ProgressSchema} from "../types";
import {useServices} from "../hooks";

type SudokuProps = {
    puzzleId: string | null;
};

export default function Sudoku({puzzleId}: SudokuProps) {
    const {progressService} = useServices();
    const [loading, setLoading] = useState(true);
    const [sudoku, setSudoku] = useState<ProgressSchema | null>(null);

    const gridString = (sudoku?.puzzle ?? '');
    const seedGrid = gridString.match(/.{1,9}/g) || [];

    useEffect(() => {
        const loadProgress = async () => {
            if (!puzzleId) return;

            try {
                const loadedSudoku = await progressService.getProgressRecord(puzzleId);
                if (loadedSudoku) {
                    setSudoku(loadedSudoku);
                } else {
                    // This should not happen - Content component ensures progress records exist
                    console.error(`Progress record not found for puzzle ID: ${puzzleId}`);
                }
            } catch (error) {
                console.error('Failed to load Sudoku progress:', error);
            } finally {
                setLoading(false);
            }
        };

        setLoading(true);
        loadProgress();
    }, [puzzleId, progressService]);

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="text-base text-foreground opacity-70">Loading puzzle...</Text>
            </View>
        );
    }

    if (!sudoku) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="text-base text-foreground">Puzzle not found</Text>
                <Text className="text-xs text-muted">ID: {puzzleId}</Text>
            </View>
        );
    }

    return (
        <View className="w-full items-center justify-center py-4">
            <View className="border-2 border-border">
                {seedGrid.map((row, rowIndex) => (
                    <View key={`row-${rowIndex}`} className="flex-row">
                        {[...row].map((cell, colIndex) => {
                            const thickLeft = colIndex === 0 ? ' border-l-2' : '';
                            const thickTop = rowIndex === 0 ? ' border-t-2' : '';
                            const thickRight = (colIndex === 2 || colIndex === 5 || colIndex === 8) ? ' border-r-2' : '';
                            const thickBottom = (rowIndex === 2 || rowIndex === 5 || rowIndex === 8) ? ' border-b-2' : '';
                            return (
                                <View
                                    key={`cell-${rowIndex}-${colIndex}`}
                                    className={
                                        'w-9 h-9 items-center justify-center border border-border' +
                                        thickLeft + thickTop + thickRight + thickBottom
                                    }
                                >
                                    {cell !== '0' ? (
                                        <Text className="text-base text-foreground">{cell}</Text>
                                    ) : null}
                                </View>
                            );
                        })}
                    </View>
                ))}
            </View>
        </View>
    )
}