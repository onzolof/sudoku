import './global.css'
import {SafeAreaView} from 'react-native';
import {PuzzlesDbProvider, UserDbProvider} from "./src/db/dbProviders";
import Header from "./src/components/Header";
import Content from "./src/components/Content";
import {StrictMode} from "react";
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {DifficultyProvider} from './src/provider';

export default function App() {
    return (
        <StrictMode>
            <GestureHandlerRootView>
                <PuzzlesDbProvider>
                    <UserDbProvider>
                        <DifficultyProvider>
                            <SafeAreaView>
                                <Header/>
                                <Content/>
                            </SafeAreaView>
                        </DifficultyProvider>
                    </UserDbProvider>
                </PuzzlesDbProvider>
            </GestureHandlerRootView>
        </StrictMode>
    );
}

