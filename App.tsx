import './global.css'
import {StyleSheet, View, Text} from 'react-native';
import {useEffect} from "react";
import {PuzzlesDbProvider, usePuzzlesDb, UserDbProvider} from "./src/db/dbProviders";

function ExampleScreen() {
    const puzzlesDb = usePuzzlesDb();

    useEffect(() => {
        (async () => {
        try {
            console.log('this is executed');
            console.log('puzzlesDb object:', puzzlesDb);

            // Check if table exists first
            const tables = await puzzlesDb.getAllAsync("SELECT name FROM sqlite_master WHERE type='table';");
            console.log('Available tables:', tables);

            const result = await puzzlesDb.getAllAsync("SELECT * FROM puzzle;");
            console.log(result ?? 'yolo');
        } catch (error) {
            console.error('Database query failed:', error);
        }
            // console.log('this is executed', puzzlesDb)
            // const result = await puzzlesDb.getAllAsync("SELECT * FROM puzzle;");
            // console.log(result ?? 'yolo');
        })();
    }, [puzzlesDb]);

    return <Text>testibus</Text>;
}

export default function App() {
    return (
        <View style={styles.container}>
            <PuzzlesDbProvider>
                <UserDbProvider>
                    <ExampleScreen/>
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
