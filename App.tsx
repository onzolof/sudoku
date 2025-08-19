import './global.css'
import {StyleSheet, View} from 'react-native';
import {PuzzlesDbProvider, UserDbProvider} from "./src/db/dbProviders";
import Sudoku from "./src/components/Sudoku";

export default function App() {
    return (
        <View style={styles.container}>
            <PuzzlesDbProvider>
                <UserDbProvider>
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
        alignItems: 'center',
        justifyContent: 'center',
    },
});
