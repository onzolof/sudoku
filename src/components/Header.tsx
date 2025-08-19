import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';

export default function Header() {
  return (
    <SafeAreaView className="bg-white border-b border-gray-200">
      <View className="px-4 py-3">
        <Text className="text-2xl font-bold text-left">N1NE</Text>
      </View>
    </SafeAreaView>
  );
}
