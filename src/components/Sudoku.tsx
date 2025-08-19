import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { usePuzzlesDb } from '../db/dbProviders';

interface Puzzle {
  id: string;
  difficulty: string;
  number_of_clues: number;
  seed: string;
  solution: string;
  version: number;
  added_at: number;
}

type SudokuProps = {
  puzzleId: string;
};

export default function Sudoku({ puzzleId }: SudokuProps) {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const puzzlesDb = usePuzzlesDb();

  const seed = puzzle?.seed ?? '';
  const seedGrid = seed.match(/.{1,9}/g) || [];

  useEffect(() => {
    const loadPuzzle = async () => {
      try {
        const result = await puzzlesDb.getAllAsync(
            'SELECT * FROM puzzle WHERE id = ? LIMIT 1;',
            [puzzleId]
        );
        if (result && result.length > 0) {
          setPuzzle(result[0] as Puzzle);
        } else {
          setPuzzle(null);
        }
      } catch (error) {
        console.error('Failed to load puzzle:', error);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    loadPuzzle();
  }, [puzzlesDb, puzzleId]);

  if (loading) {
    return (
        <View className="flex-1 items-center justify-center">
          <Text className="text-base text-foreground opacity-70">Loading puzzle...</Text>
        </View>
    );
  }

  if (!puzzle) {
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