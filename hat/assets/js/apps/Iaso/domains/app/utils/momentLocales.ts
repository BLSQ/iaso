import {
    LANGUAGE_CONFIGS,
    MOMENT_LOCALE_LOADERS,
} from 'IasoModules/language/configs';

export const loadMomentLocale = async (lang: string): Promise<void> => {
    if (lang === 'en' || !(lang in LANGUAGE_CONFIGS)) {
        return;
    }
    const loader =
        MOMENT_LOCALE_LOADERS[lang as keyof typeof MOMENT_LOCALE_LOADERS];
    if (!loader) {
        return;
    }
    await loader();
};

/** Preload moment locales for every language the app is built with. */
export const preloadMomentLocales = (
    languages: string[] = Object.keys(LANGUAGE_CONFIGS),
): void => {
    languages.forEach(lang => {
        void loadMomentLocale(lang);
    });
};