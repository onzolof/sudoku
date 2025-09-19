import './global.css'
import Header from "./src/components/Header";
import Content from "./src/components/Content";
import {StrictMode} from "react";
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {DifficultyProvider, PuzzlesDbProvider, useDifficulty, UserDbProvider} from './src/provider';
import {Theme} from "./src/Theme";
import {Difficulty} from "./src/types";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";
import {StatusBar} from "react-native";

export default function App() {
    return (
        <StrictMode>
            <GestureHandlerRootView>
                <PuzzlesDbProvider>
                    <UserDbProvider>
                        <DifficultyProvider>
                            <SafeAreaProvider>
                                <SafeAreaView className="flex-1">
                                    <MainApp/>
                                </SafeAreaView>
                            </SafeAreaProvider>
                        </DifficultyProvider>
                    </UserDbProvider>
                </PuzzlesDbProvider>
            </GestureHandlerRootView>
        </StrictMode>
    );
}

function MainApp() {
    const {difficulty} = useDifficulty()

    return (<Theme name={difficulty as Difficulty}>
        <StatusBar/>
        <Header/>
        <Content/>
    </Theme>)
}