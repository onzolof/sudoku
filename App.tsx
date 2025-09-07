import './global.css'
import {SafeAreaView} from 'react-native';
import {PuzzlesDbProvider, UserDbProvider} from "./src/db/dbProviders";
import Header from "./src/components/Header";
import Content from "./src/components/Content";
import {StrictMode, useRef} from "react";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Difficulty } from './src/types';

export default function App() {
    const reinitializeContentRef = useRef<((newDifficulty: Difficulty) => Promise<void>) | null>(null);

    const handleDifficultyChange = (reinitializeFn: (newDifficulty: Difficulty) => Promise<void>) => {
        reinitializeContentRef.current = reinitializeFn;
    };

    const handleDifficultyChanged = async (newDifficulty: Difficulty) => {
        if (reinitializeContentRef.current) {
            await reinitializeContentRef.current(newDifficulty);
        }
    };

    return (
        <StrictMode>
            <GestureHandlerRootView>
                <PuzzlesDbProvider>
                    <UserDbProvider>
                        <SafeAreaView>
                            <Header onDifficultyChange={handleDifficultyChanged}/>
                            <Content onDifficultyChange={handleDifficultyChange}/>
                        </SafeAreaView>
                    </UserDbProvider>
                </PuzzlesDbProvider>
            </GestureHandlerRootView>
        </StrictMode>
    );
}

