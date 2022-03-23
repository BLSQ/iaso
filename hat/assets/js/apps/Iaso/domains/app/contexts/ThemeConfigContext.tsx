import { createContext } from 'react';

type ThemeConfig = {
    APP_TITLE: string;
    THEME_PRIMARY_COLOR: string;
    THEME_SECONDARY_COLOR: string;
    THEME_PRIMARY_BACKGROUND_COLOR: string;
    LOGO_PATH: string;
};

const defaultContextValue: ThemeConfig = {
    APP_TITLE: '',
    THEME_PRIMARY_COLOR: '',
    THEME_SECONDARY_COLOR: '',
    THEME_PRIMARY_BACKGROUND_COLOR: '',
    LOGO_PATH: '',
};

export const ThemeConfigContext =
    createContext<ThemeConfig>(defaultContextValue);
