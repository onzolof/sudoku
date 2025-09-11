import React from 'react';
import {View, Text, TouchableOpacity, Modal, ScrollView, StatusBar} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {Difficulty} from '../types';
import {difficulties, getThemeColor} from "../utils";
import {useDifficulty} from '../provider';

interface SettingsProps {
    visible: boolean;
    onClose: () => void;
}

const difficultyIcons: Record<Difficulty, keyof typeof Ionicons.glyphMap> = {
    easy: 'leaf',
    medium: 'bulb',
    hard: 'flame',
    expert: 'rocket',
    insane: 'skull',
};


export default function Settings({visible, onClose}: SettingsProps) {
    const {difficulty, setDifficulty} = useDifficulty();

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <StatusBar/>
            <View className="flex-1" style={{backgroundColor: '#F8FAFC'}}>
                <View
                    className="px-6 pt-12 pb-6"
                    style={{
                        backgroundColor: '#FFFFFF',
                        borderBottomLeftRadius: 24,
                        borderBottomRightRadius: 24,
                        shadowColor: '#000',
                        shadowOffset: {width: 0, height: 2},
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 8,
                    }}
                >
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                            <View
                                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                                style={{backgroundColor: '#3B82F6'}}
                            >
                                <Ionicons name="settings" size={20} color="#FFFFFF"/>
                            </View>
                            <Text className="text-2xl font-bold" style={{color: '#1E293B'}}>
                                Settings
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            className="w-10 h-10 rounded-full items-center justify-center"
                            style={{backgroundColor: '#F1F5F9'}}
                        >
                            <Ionicons name="close" size={20} color="#64748B"/>
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={false}>
                    {/* Difficulty Selection Card */}
                    <View
                        className="rounded-2xl p-6 mb-6"
                        style={{
                            backgroundColor: '#FFFFFF',
                            shadowColor: '#000',
                            shadowOffset: {width: 0, height: 4},
                            shadowOpacity: 0.08,
                            shadowRadius: 12,
                            elevation: 8,
                        }}
                    >
                        <View className="flex-row items-center mb-6">
                            <Text className="text-xl font-bold" style={{color: '#1E293B'}}>
                                Difficulty Level
                            </Text>
                        </View>

                        <Text className="text-sm mb-6" style={{color: '#64748B', lineHeight: 20}}>
                            Choose your preferred difficulty level for the Sudokus.
                        </Text>

                        <View>
                            {difficulties.map((diff, index) => {
                                const Icon = difficultyIcons[diff];
                                const isSelected = diff === difficulty;
                                const color = getThemeColor(diff);

                                return (
                                    <View key={diff} style={{marginBottom: index < difficulties.length - 1 ? 12 : 0}}>
                                        <TouchableOpacity
                                            onPress={() => setDifficulty(diff)}
                                            className="flex-row items-center px-4 py-4 rounded-xl"
                                            style={{
                                                backgroundColor: isSelected ? color : '#F8FAFC',
                                                borderWidth: isSelected ? 0 : 1,
                                                borderColor: '#E2E8F0',
                                                shadowColor: isSelected ? color : 'transparent',
                                                shadowOffset: {width: 0, height: isSelected ? 4 : 0},
                                                shadowOpacity: isSelected ? 0.3 : 0,
                                                shadowRadius: isSelected ? 8 : 0,
                                                elevation: isSelected ? 4 : 0,
                                            }}
                                        >
                                            <View
                                                className="w-10 h-10 rounded-full items-center justify-center mr-4"
                                                style={{
                                                    backgroundColor: isSelected ? '#FFFFFF' : color,
                                                }}
                                            >
                                                <Ionicons
                                                    name={Icon}
                                                    size={20}
                                                    color={isSelected ? color : '#FFFFFF'}
                                                />
                                            </View>
                                            <View className="flex-1">
                                                <Text
                                                    className="text-base font-semibold"
                                                    style={{color: isSelected ? '#FFFFFF' : '#1E293B'}}
                                                >
                                                    {firstCharUpper(diff)}
                                                </Text>
                                                <Text
                                                    className="text-sm"
                                                    style={{color: isSelected ? '#FFFFFF' : '#64748B'}}
                                                >
                                                    {getDifficultyDescription(diff)}
                                                </Text>
                                            </View>
                                            {isSelected && (
                                                <View
                                                    className="w-6 h-6 rounded-full items-center justify-center"
                                                    style={{backgroundColor: '#FFFFFF'}}
                                                >
                                                    <Ionicons name="checkmark" size={16} color={color}/>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    </View>
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

function getDifficultyDescription(difficulty: Difficulty): string {
    const descriptions: Record<Difficulty, string> = {
        easy: 'Perfect for beginners',
        medium: 'Balanced challenge',
        hard: 'For experienced players',
        expert: 'Master level difficulty',
        insane: 'Ultimate challenge',
    };
    return descriptions[difficulty];
}
