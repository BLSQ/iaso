import { Plugin } from 'Iaso/plugins/types';
import { menu } from './src/constants/menu';
import { permissionsMessages } from './src/constants/permissions';
import { routes } from './src/constants/routes';
import en from './src/constants/translations/en.json';
import fr from './src/constants/translations/fr.json';
import { baseUrls, paramsConfig } from './src/constants/urls';

const translations = {
    fr,
    en,
};

const config: Plugin = {
    routes,
    menu,
    translations,
    permissionsMessages,
    baseUrls,
    paramsConfig,
    redirections: [],
};

export default config;
