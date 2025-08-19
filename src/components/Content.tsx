import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { usePuzzlesDb } from '../db/dbProviders';
import Sudoku from './Sudoku';

export default function Content() {
  const [puzzleId, setPuzzleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const puzzlesDb = usePuzzlesDb();

  useEffect(() => {
    const choosePuzzle = async () => {
      try {
        const result = await puzzlesDb.getAllAsync('SELECT id FROM puzzle LIMIT 1;');
        if (result && result.length > 0) {
          const row = result[0] as { id: string };
          setPuzzleId(row.id);
        } else {
          setPuzzleId(null);
        }
      } catch (error) {
        console.error('Failed to choose puzzle id:', error);
      } finally {
        setLoading(false);
      }
    };

    choosePuzzle();
  }, [puzzlesDb]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-base text-foreground opacity-70">Loading puzzle...</Text>
      </View>
    );
  }

  if (!puzzleId) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-base text-foreground">No puzzle found</Text>
      </View>
    );
  }

  return (
    <Sudoku puzzleId={puzzleId} />
  );
}

