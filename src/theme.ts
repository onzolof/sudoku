import { vars } from "nativewind";
import {Difficulty} from "./types";

/** Theme name keys that match your CSS classes */
export type ThemeName = Difficulty;
export type ThemeMode = "light" | "dark";

type ThemeStyle = ReturnType<typeof vars>;
type ThemePair = { light: ThemeStyle; dark: ThemeStyle };

/** Optional: defaults from :root (light only) */
export const rootLight = vars({
    "--background": "0 0% 100%",
    "--foreground": "0 0% 3.9%",
    "--card": "0 0% 100%",
    "--card-foreground": "0 0% 3.9%",
    "--popover": "0 0% 100%",
    "--popover-foreground": "0 0% 3.9%",
    "--primary": "0 0% 9%",
    "--primary-foreground": "0 0% 98%",
    "--secondary": "0 0% 96.1%",
    "--secondary-foreground": "0 0% 9%",
    "--muted": "0 0% 96.1%",
    "--muted-foreground": "0 0% 45.1%",
    "--accent": "0 0% 96.1%",
    "--accent-foreground": "0 0% 9%",
    "--destructive": "0 84.2% 60.2%",
    "--destructive-foreground": "0 0% 98%",
    "--border": "0 0% 89.8%",
    "--input": "0 0% 89.8%",
    "--ring": "0 0% 3.9%",
    "--radius": "0.65rem",
    "--chart-1": "12 76% 61%",
    "--chart-2": "173 58% 39%",
    "--chart-3": "197 37% 24%",
    "--chart-4": "43 74% 66%",
    "--chart-5": "27 87% 67%",
});

/* ----------------------------- EASY ----------------------------- */

export const easyLight = vars({
    "--background": "0 0% 100%",
    "--foreground": "240 10% 3.9%",
    "--card": "0 0% 100%",
    "--card-foreground": "240 10% 3.9%",
    "--popover": "0 0% 100%",
    "--popover-foreground": "240 10% 3.9%",
    "--primary": "142.1 76.2% 36.3%",
    "--primary-foreground": "355.7 100% 97.3%",
    "--secondary": "240 4.8% 95.9%",
    "--secondary-foreground": "240 5.9% 10%",
    "--muted": "240 4.8% 95.9%",
    "--muted-foreground": "240 3.8% 46.1%",
    "--accent": "240 4.8% 95.9%",
    "--accent-foreground": "240 5.9% 10%",
    "--destructive": "0 84.2% 60.2%",
    "--destructive-foreground": "0 0% 98%",
    "--border": "240 5.9% 90%",
    "--input": "240 5.9% 90%",
    "--ring": "142.1 76.2% 36.3%",
    "--radius": "0.65rem",
    "--chart-1": "12 76% 61%",
    "--chart-2": "173 58% 39%",
    "--chart-3": "197 37% 24%",
    "--chart-4": "43 74% 66%",
    "--chart-5": "27 87% 67%",
});

export const easyDark = vars({
    "--background": "20 14.3% 4.1%",
    "--foreground": "0 0% 95%",
    "--card": "24 9.8% 10%",
    "--card-foreground": "0 0% 95%",
    "--popover": "0 0% 9%",
    "--popover-foreground": "0 0% 95%",
    "--primary": "142.1 70.6% 45.3%",
    "--primary-foreground": "144.9 80.4% 10%",
    "--secondary": "240 3.7% 15.9%",
    "--secondary-foreground": "0 0% 98%",
    "--muted": "0 0% 15%",
    "--muted-foreground": "240 5% 64.9%",
    "--accent": "12 6.5% 15.1%",
    "--accent-foreground": "0 0% 98%",
    "--destructive": "0 62.8% 30.6%",
    "--destructive-foreground": "0 85.7% 97.3%",
    "--border": "240 3.7% 15.9%",
    "--input": "240 3.7% 15.9%",
    "--ring": "142.4 71.8% 29.2%",
    "--chart-1": "220 70% 50%",
    "--chart-2": "160 60% 45%",
    "--chart-3": "30 80% 55%",
    "--chart-4": "280 65% 60%",
    "--chart-5": "340 75% 55%",
});

/* ---------------------------- MEDIUM ---------------------------- */

export const mediumLight = vars({
    "--background": "0 0% 100%",
    "--foreground": "20 14.3% 4.1%",
    "--card": "0 0% 100%",
    "--card-foreground": "20 14.3% 4.1%",
    "--popover": "0 0% 100%",
    "--popover-foreground": "20 14.3% 4.1%",
    "--primary": "24.6 95% 53.1%",
    "--primary-foreground": "60 9.1% 97.8%",
    "--secondary": "60 4.8% 95.9%",
    "--secondary-foreground": "24 9.8% 10%",
    "--muted": "60 4.8% 95.9%",
    "--muted-foreground": "25 5.3% 44.7%",
    "--accent": "60 4.8% 95.9%",
    "--accent-foreground": "24 9.8% 10%",
    "--destructive": "0 84.2% 60.2%",
    "--destructive-foreground": "60 9.1% 97.8%",
    "--border": "20 5.9% 90%",
    "--input": "20 5.9% 90%",
    "--ring": "24.6 95% 53.1%",
    "--radius": "0.65rem",
    "--chart-1": "12 76% 61%",
    "--chart-2": "173 58% 39%",
    "--chart-3": "197 37% 24%",
    "--chart-4": "43 74% 66%",
    "--chart-5": "27 87% 67%",
});

export const mediumDark = vars({
    "--background": "20 14.3% 4.1%",
    "--foreground": "60 9.1% 97.8%",
    "--card": "20 14.3% 4.1%",
    "--card-foreground": "60 9.1% 97.8%",
    "--popover": "20 14.3% 4.1%",
    "--popover-foreground": "60 9.1% 97.8%",
    "--primary": "20.5 90.2% 48.2%",
    "--primary-foreground": "60 9.1% 97.8%",
    "--secondary": "12 6.5% 15.1%",
    "--secondary-foreground": "60 9.1% 97.8%",
    "--muted": "12 6.5% 15.1%",
    "--muted-foreground": "24 5.4% 63.9%",
    "--accent": "12 6.5% 15.1%",
    "--accent-foreground": "60 9.1% 97.8%",
    "--destructive": "0 72.2% 50.6%",
    "--destructive-foreground": "60 9.1% 97.8%",
    "--border": "12 6.5% 15.1%",
    "--input": "12 6.5% 15.1%",
    "--ring": "20.5 90.2% 48.2%",
    "--chart-1": "220 70% 50%",
    "--chart-2": "160 60% 45%",
    "--chart-3": "30 80% 55%",
    "--chart-4": "280 65% 60%",
    "--chart-5": "340 75% 55%",
});

/* ----------------------------- HARD ----------------------------- */

export const hardLight = vars({
    "--background": "0 0% 100%",
    "--foreground": "240 10% 3.9%",
    "--card": "0 0% 100%",
    "--card-foreground": "240 10% 3.9%",
    "--popover": "0 0% 100%",
    "--popover-foreground": "240 10% 3.9%",
    "--primary": "346.8 77.2% 49.8%",
    "--primary-foreground": "355.7 100% 97.3%",
    "--secondary": "240 4.8% 95.9%",
    "--secondary-foreground": "240 5.9% 10%",
    "--muted": "240 4.8% 95.9%",
    "--muted-foreground": "240 3.8% 46.1%",
    "--accent": "240 4.8% 95.9%",
    "--accent-foreground": "240 5.9% 10%",
    "--destructive": "0 84.2% 60.2%",
    "--destructive-foreground": "0 0% 98%",
    "--border": "240 5.9% 90%",
    "--input": "240 5.9% 90%",
    "--ring": "346.8 77.2% 49.8%",
    "--radius": "0.65rem",
    "--chart-1": "12 76% 61%",
    "--chart-2": "173 58% 39%",
    "--chart-3": "197 37% 24%",
    "--chart-4": "43 74% 66%",
    "--chart-5": "27 87% 67%",
});

export const hardDark = vars({
    "--background": "20 14.3% 4.1%",
    "--foreground": "0 0% 95%",
    "--card": "24 9.8% 10%",
    "--card-foreground": "0 0% 95%",
    "--popover": "0 0% 9%",
    "--popover-foreground": "0 0% 95%",
    "--primary": "346.8 77.2% 49.8%",
    "--primary-foreground": "355.7 100% 97.3%",
    "--secondary": "240 3.7% 15.9%",
    "--secondary-foreground": "0 0% 98%",
    "--muted": "0 0% 15%",
    "--muted-foreground": "240 5% 64.9%",
    "--accent": "12 6.5% 15.1%",
    "--accent-foreground": "0 0% 98%",
    "--destructive": "0 62.8% 30.6%",
    "--destructive-foreground": "0 85.7% 97.3%",
    "--border": "240 3.7% 15.9%",
    "--input": "240 3.7% 15.9%",
    "--ring": "346.8 77.2% 49.8%",
    "--chart-1": "220 70% 50%",
    "--chart-2": "160 60% 45%",
    "--chart-3": "30 80% 55%",
    "--chart-4": "280 65% 60%",
    "--chart-5": "340 75% 55%",
});

/* ---------------------------- EXPERT ---------------------------- */

export const expertLight = vars({
    "--background": "0 0% 100%",
    "--foreground": "224 71.4% 4.1%",
    "--card": "0 0% 100%",
    "--card-foreground": "224 71.4% 4.1%",
    "--popover": "0 0% 100%",
    "--popover-foreground": "224 71.4% 4.1%",
    "--primary": "262.1 83.3% 57.8%",
    "--primary-foreground": "210 20% 98%",
    "--secondary": "220 14.3% 95.9%",
    "--secondary-foreground": "220.9 39.3% 11%",
    "--muted": "220 14.3% 95.9%",
    "--muted-foreground": "220 8.9% 46.1%",
    "--accent": "220 14.3% 95.9%",
    "--accent-foreground": "220.9 39.3% 11%",
    "--destructive": "0 84.2% 60.2%",
    "--destructive-foreground": "210 20% 98%",
    "--border": "220 13% 91%",
    "--input": "220 13% 91%",
    "--ring": "262.1 83.3% 57.8%",
    "--radius": "0.65rem",
    "--chart-1": "12 76% 61%",
    "--chart-2": "173 58% 39%",
    "--chart-3": "197 37% 24%",
    "--chart-4": "43 74% 66%",
    "--chart-5": "27 87% 67%",
});

export const expertDark = vars({
    "--background": "224 71.4% 4.1%",
    "--foreground": "210 20% 98%",
    "--card": "224 71.4% 4.1%",
    "--card-foreground": "210 20% 98%",
    "--popover": "224 71.4% 4.1%",
    "--popover-foreground": "210 20% 98%",
    "--primary": "263.4 70% 50.4%",
    "--primary-foreground": "210 20% 98%",
    "--secondary": "215 27.9% 16.9%",
    "--secondary-foreground": "210 20% 98%",
    "--muted": "215 27.9% 16.9%",
    "--muted-foreground": "217.9 10.6% 64.9%",
    "--accent": "215 27.9% 16.9%",
    "--accent-foreground": "210 20% 98%",
    "--destructive": "0 62.8% 30.6%",
    "--destructive-foreground": "210 20% 98%",
    "--border": "215 27.9% 16.9%",
    "--input": "215 27.9% 16.9%",
    "--ring": "263.4 70% 50.4%",
    "--chart-1": "220 70% 50%",
    "--chart-2": "160 60% 45%",
    "--chart-3": "30 80% 55%",
    "--chart-4": "280 65% 60%",
    "--chart-5": "340 75% 55%",
});

/* ---------------------------- INSANE ---------------------------- */

export const insaneLight = vars({
    "--background": "0 0% 100%",
    "--foreground": "0 0% 3.9%",
    "--card": "0 0% 100%",
    "--card-foreground": "0 0% 3.9%",
    "--popover": "0 0% 100%",
    "--popover-foreground": "0 0% 3.9%",
    "--primary": "0 0% 9%",
    "--primary-foreground": "0 0% 98%",
    "--secondary": "0 0% 96.1%",
    "--secondary-foreground": "0 0% 9%",
    "--muted": "0 0% 96.1%",
    "--muted-foreground": "0 0% 45.1%",
    "--accent": "0 0% 96.1%",
    "--accent-foreground": "0 0% 9%",
    "--destructive": "0 84.2% 60.2%",
    "--destructive-foreground": "0 0% 98%",
    "--border": "0 0% 89.8%",
    "--input": "0 0% 89.8%",
    "--ring": "0 0% 3.9%",
    "--radius": "0.65rem",
    "--chart-1": "12 76% 61%",
    "--chart-2": "173 58% 39%",
    "--chart-3": "197 37% 24%",
    "--chart-4": "43 74% 66%",
    "--chart-5": "27 87% 67%",
});

export const insaneDark = vars({
    "--background": "0 0% 3.9%",
    "--foreground": "0 0% 98%",
    "--card": "0 0% 3.9%",
    "--card-foreground": "0 0% 98%",
    "--popover": "0 0% 3.9%",
    "--popover-foreground": "0 0% 98%",
    "--primary": "0 0% 98%",
    "--primary-foreground": "0 0% 9%",
    "--secondary": "0 0% 14.9%",
    "--secondary-foreground": "0 0% 98%",
    "--muted": "0 0% 14.9%",
    "--muted-foreground": "0 0% 63.9%",
    "--accent": "0 0% 14.9%",
    "--accent-foreground": "0 0% 98%",
    "--destructive": "0 62.8% 30.6%",
    "--destructive-foreground": "0 0% 98%",
    "--border": "0 0% 14.9%",
    "--input": "0 0% 14.9%",
    "--ring": "0 0% 83.1%",
    "--chart-1": "220 70% 50%",
    "--chart-2": "160 60% 45%",
    "--chart-3": "30 80% 55%",
    "--chart-4": "280 65% 60%",
    "--chart-5": "340 75% 55%",
});

/* -------------------------- Registry & API -------------------------- */

export const themes: Record<ThemeName, ThemePair> = {
    easy: { light: easyLight, dark: easyDark },
    medium: { light: mediumLight, dark: mediumDark },
    hard: { light: hardLight, dark: hardDark },
    expert: { light: expertLight, dark: expertDark },
    insane: { light: insaneLight, dark: insaneDark },
};

export const themeNames = Object.keys(themes) as ThemeName[];

/** Convenience getter with validation */
export function getTheme(name: ThemeName, mode: ThemeMode): ThemeStyle {
    // Validate theme name
    if (!themes[name]) {
        console.warn(`Invalid theme name: ${name}. Falling back to 'easy' theme.`);
        return themes.easy[mode];
    }
    
    // Validate theme mode
    if (!themes[name][mode]) {
        console.warn(`Invalid theme mode: ${mode} for theme: ${name}. Falling back to 'light' mode.`);
        return themes[name].light;
    }
    
    return themes[name][mode];
}

/** Validate if a theme name exists */
export function isValidThemeName(name: string): name is ThemeName {
    return name in themes;
}

/** Validate if a theme mode exists */
export function isValidThemeMode(mode: string): mode is ThemeMode {
    return mode === 'light' || mode === 'dark';
}

/** Get theme with fallback to safe defaults */
export function getThemeSafe(name: string, mode: string): ThemeStyle {
    const safeName: ThemeName = isValidThemeName(name) ? name : 'easy';
    const safeMode: ThemeMode = isValidThemeMode(mode) ? mode : 'light';
    
    return getTheme(safeName, safeMode);
}
