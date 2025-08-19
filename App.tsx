import './global.css'
import {StyleSheet, View} from 'react-native';
import {PuzzlesDbProvider, UserDbProvider} from "./src/db/dbProviders";
import Header from "./src/components/Header";
import Sudoku from "./src/components/Sudoku";

export default function App() {
    return (
        <View style={styles.container}>
            <PuzzlesDbProvider>
                <UserDbProvider>
                    <Header/>
                    <Sudoku/>
                </UserDbProvider>
            </PuzzlesDbProvider>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
