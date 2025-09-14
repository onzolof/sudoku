import './global.css'
import {SafeAreaView, Text} from 'react-native';
import Header from "./src/components/Header";
import Content from "./src/components/Content";
import {StrictMode} from "react";
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {DifficultyProvider, PuzzlesDbProvider, useDifficulty, UserDbProvider} from './src/provider';
import {Theme} from "./src/Theme";
import {Difficulty} from "./src/types";

export default function App() {
    return (
        <StrictMode>
            <GestureHandlerRootView>
                <PuzzlesDbProvider>
                    <UserDbProvider>
                        <DifficultyProvider>
                            <SafeAreaView>
                                <MainApp/>
                            </SafeAreaView>
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
        <Header/>
        <Content/>
    </Theme>)
}