import { Plugin } from '../../../hat/assets/js/apps/Iaso/domains/app/types';
import { routes } from './src/constants/routes';
import en from './src/constants/translations/en.json';
import fr from './src/constants/translations/fr.json';
import { baseUrls, paramsConfig } from './src/constants/urls';

const translations = {
    fr,
    en,
};

const config: Plugin = {
    baseUrls,
    paramsConfig,
    routes,
    redirections: [],
    menu: [],
    translations,
};

export default config;
