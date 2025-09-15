import React, {memo, useEffect, useState} from 'react';
import {View, Text} from 'react-native';
import {ProgressSchema} from "../types";
import {useServices} from "../hooks";
import {SquircleView} from "react-native-figma-squircle";

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
            <Row/>
            <Row/>
            <Row/>
            <View className={`h-3`}></View>
            <Row/>
            <Row/>
            <Row/>
            <View className={`h-3`}></View>
            <Row/>
            <Row/>
            <Row/>
        </View>
    )
}

export default memo(Sudoku);

type RowProps = {};

const Row = memo(({}: RowProps) => {
    return (
        <View className={`flex flex-row gap-3`}>
            <NineGrid/>
            <NineGrid/>
            <NineGrid/>
        </View>
    );
});


type NineGridProps = {};

const NineGrid = memo(({}: NineGridProps) => {

    return (
        <View className="flex-1 flex-row items-center justify-center">
            <Cell></Cell>
            <Cell></Cell>
            <Cell></Cell>
        </View>
    );
});

type CellProps = {};

const Cell = memo(({}: CellProps) => {
    // noinspection TypeScriptValidateTypes
    return (
        <SquircleView
            className="flex-1 items-center justify-center aspect-square m-0.5 bg-background"
            squircleParams={{
                cornerSmoothing: 0.8,
                cornerRadius: 4,
                fillColor: 'grey',
            }}
        >
            <Text className="font-mono text-xl font-bold tracking-wider sudoku-number">3</Text>
        </SquircleView>
        // todo: use this if no squircle is used
        // <View className="flex-1 items-center justify-center aspect-square m-1 bg-background shadow-md rounded-xl">
        // <Text>1</Text>
        //   </View>
    );
});
