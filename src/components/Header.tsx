import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Settings from './Settings';

export default function Header() {
  const [settingsVisible, setSettingsVisible] = useState(false);

  return (
    <>
      <View className="px-4 py-3 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-left text-foreground">N1NE</Text>
        <TouchableOpacity
          onPress={() => setSettingsVisible(true)}
          className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
        >
          <Ionicons name="settings-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      <Settings 
        visible={settingsVisible} 
        onClose={() => setSettingsVisible(false)}
      />
    </>
  );
}
