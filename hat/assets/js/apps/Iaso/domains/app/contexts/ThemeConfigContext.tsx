import { createContext } from 'react';

type ThemeConfig = {
    APP_TITLE: string;
    THEME_PRIMARY_COLOR: string;
    THEME_SECONDARY_COLOR: string;
    THEME_PRIMARY_BACKGROUND_COLOR: string;
    LOGO_PATH: string;
    FAVICON_PATH: string;
    SHOW_LOGO_WITH_NAME: 'yes' | 'no';
};

const defaultContextValue: ThemeConfig = {
    APP_TITLE: '',
    THEME_PRIMARY_COLOR: '',
    THEME_SECONDARY_COLOR: '',
    THEME_PRIMARY_BACKGROUND_COLOR: '',
    LOGO_PATH: '',
    FAVICON_PATH: '',
    SHOW_LOGO_WITH_NAME: 'yes',
};

export const ThemeConfigContext =
    createContext<ThemeConfig>(defaultContextValue);
