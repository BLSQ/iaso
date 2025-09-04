import { Plugin } from 'Iaso/plugins/types';
import { menu } from './src/constants/menu';
import { routes } from './src/constants/routes';
import { theme } from './src/constants/theme';
import { baseUrls, paramsConfig } from './src/constants/urls';
import en from './src/constants/translations/en.json';
import fr from './src/constants/translations/fr.json';

const translations = {
    fr,
    en,
};

const config: Plugin = {
    routes,
    menu,
    translations,
    baseUrls,
    paramsConfig,
    redirections: [],
    homeUrl: '/***/',
    theme,
};

export default config;
