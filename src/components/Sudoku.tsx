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

export default function Sudoku() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const puzzlesDb = usePuzzlesDb();

  useEffect(() => {
    const loadPuzzle = async () => {
      try {
        const result = await puzzlesDb.getAllAsync("SELECT * FROM puzzle LIMIT 1;");
        if (result && result.length > 0) {
          setPuzzle(result[0] as Puzzle);
        }
      } catch (error) {
        console.error('Failed to load puzzle:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPuzzle();
  }, [puzzlesDb]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-lg">Loading puzzle...</Text>
      </View>
    );
  }

  if (!puzzle) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-lg">No puzzle found</Text>
      </View>
    );
  }

  // Convert seed string to 9x9 grid
  const seedGrid = puzzle.seed.match(/.{1,9}/g) || [];
  
  return (
    <View className="flex-1 items-center justify-center p-4">
      <Text className="text-2xl font-bold mb-4">Sudoku Puzzle</Text>
      <Text className="text-sm text-gray-600 mb-4">
        Difficulty: {puzzle.difficulty} | Clues: {puzzle.number_of_clues}
      </Text>
      
      {/* Sudoku Grid */}
      <View className="border-2 border-gray-800">
        {seedGrid.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row">
            {row.split('').map((cell, colIndex) => {
              const isRightBorder = (colIndex + 1) % 3 === 0;
              const isBottomBorder = (rowIndex + 1) % 3 === 0;
              
              return (
                <View
                  key={`${rowIndex}-${colIndex}`}
                  className={`
                    w-10 h-10 items-center justify-center border border-gray-400
                    ${isRightBorder ? 'border-r-2 border-r-gray-800' : ''}
                    ${isBottomBorder ? 'border-b-2 border-b-gray-800' : ''}
                    ${rowIndex === 0 ? 'border-t-2 border-t-gray-800' : ''}
                    ${colIndex === 0 ? 'border-l-2 border-l-gray-800' : ''}
                  `}
                >
                  <Text className={`
                    text-lg font-semibold
                    ${cell === '0' ? 'text-gray-300' : 'text-black'}
                  `}>
                    {cell === '0' ? '' : cell}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
