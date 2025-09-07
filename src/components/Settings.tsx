import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, Modal, ScrollView} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Ionicons} from '@expo/vector-icons';
import {Difficulty} from '../types';
import {SUDOKU_DIFFICULTY_STORAGE_KEY} from '../constants';
import {difficulties} from "../utils";

interface SettingsProps {
    visible: boolean;
    onClose: () => void;
}

const difficultyIcons: Record<Difficulty, keyof typeof Ionicons.glyphMap> = {
    easy: 'leaf-outline',
    medium: 'bulb-outline',
    hard: 'flame-outline',
    expert: 'rocket-outline',
    insane: 'skull-outline',
};

export default function Settings({visible, onClose}: SettingsProps) {
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');

    useEffect(() => {
        loadDifficulty();
    }, []);

    const loadDifficulty = async () => {
        try {
            const savedDifficulty = await AsyncStorage.getItem(SUDOKU_DIFFICULTY_STORAGE_KEY);
            if (savedDifficulty && difficulties.includes(savedDifficulty)) {
                setDifficulty(savedDifficulty as Difficulty);
            }
        } catch (error) {
            console.error('Failed to load difficulty:', error);
        }
    };

    const handleDifficultyChange = async (newDifficulty: Difficulty) => {
        try {
            setDifficulty(newDifficulty);
            await AsyncStorage.setItem(SUDOKU_DIFFICULTY_STORAGE_KEY, newDifficulty);
        } catch (error) {
            console.error('Failed to save difficulty:', error);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-background">
                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-3">
                    <Text className="text-xl font-semibold text-foreground">Settings</Text>
                    <TouchableOpacity
                        onPress={onClose}
                        className="w-8 h-8 items-center justify-center"
                    >
                        <Ionicons name="close" size={24} color="#000"/>
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 px-4 py-6">
                    {/* Difficulty Selection */}
                    <View className="mb-6">
                        <Text className="text-lg font-semibold mb-3 text-foreground">Sudoku Difficulty</Text>
                        <View className="space-y-2">
                            {difficulties.map((difficulty) => {
                                const Icon = difficultyIcons[difficulty];
                                const isSelected = difficulty === difficulty;

                                return (
                                    <TouchableOpacity
                                        key={difficulty}
                                        onPress={() => handleDifficultyChange(difficulty)}
                                        className={`flex-row items-center px-4 py-3 rounded-lg border ${
                                            isSelected
                                                ? 'bg-blue-500 border-blue-500'
                                                : 'bg-white border-gray-300'
                                        }`}
                                    >
                                        <Ionicons
                                            name={Icon}
                                            size={20}
                                            color={isSelected ? '#fff' : '#666'}
                                            style={{marginRight: 12}}
                                        />
                                        <Text
                                            className={`text-base font-medium ${
                                                isSelected ? 'text-white' : 'text-gray-700'
                                            }`}
                                        >
                                            {firstCharUpper(difficulty)}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
}

function firstCharUpper(s: string): string {
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
}
