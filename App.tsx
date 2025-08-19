import './global.css'
import {SafeAreaView} from 'react-native';
import {PuzzlesDbProvider, UserDbProvider} from "./src/db/dbProviders";
import Header from "./src/components/Header";
import Content from "./src/components/Content";
import {StrictMode} from "react";

export default function App() {
    return (
        <StrictMode>
            <PuzzlesDbProvider>
                <UserDbProvider>
                    <SafeAreaView>
                        <Header/>
                        <Content/>
                    </SafeAreaView>
                </UserDbProvider>
            </PuzzlesDbProvider>
        </StrictMode>
    );
}

