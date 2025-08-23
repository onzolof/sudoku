import './global.css'
import {SafeAreaView} from 'react-native';
import {PuzzlesDbProvider, UserDbProvider} from "./src/db/dbProviders";
import Header from "./src/components/Header";
import Content from "./src/components/Content";
import {StrictMode} from "react";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
    return (
        <StrictMode>
            <GestureHandlerRootView>
                <PuzzlesDbProvider>
                    <UserDbProvider>
                        <SafeAreaView>
                            <Header/>
                            <Content/>
                        </SafeAreaView>
                    </UserDbProvider>
                </PuzzlesDbProvider>
            </GestureHandlerRootView>
        </StrictMode>
    );
}

