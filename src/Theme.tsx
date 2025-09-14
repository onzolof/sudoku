import React from "react";
import {View, ViewProps} from "react-native";
import {vars, useColorScheme} from "nativewind";
import {Difficulty} from "./types";

type Scheme = "light" | "dark";
type ThemeName = Difficulty


// Define your color tokens per theme + per scheme
const THEMES: Record<ThemeName, Record<Scheme, ReturnType<typeof vars>>> = {
    easy: {
        light: vars({"--color-primary": "99 102 241"}),    // indigo-500
        dark: vars({"--color-primary": "165 180 252"}),   // indigo-300
    },
    medium: {
        light: vars({"--color-primary": "34 197 94"}),     // green-500
        dark: vars({"--color-primary": "134 239 172"}),   // green-300
    },
    hard: {
        light: vars({"--color-primary": "59 130 246"}),    // blue-500
        dark: vars({"--color-primary": "147 197 253"}),   // blue-300
    },
};

export function Theme({name, ...props}: { name?: ThemeName } & ViewProps) {
    const {colorScheme} = useColorScheme(); // "light" | "dark" (follows system)
    // noinspection TypeScriptValidateTypes
    return <View style={THEMES[name][colorScheme]} {...props} />;
}
