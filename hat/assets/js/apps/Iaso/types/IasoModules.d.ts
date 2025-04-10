declare module 'IasoModules/plugins/configs' {
    import { Plugin } from '../plugins/types';

    const config: { [key: string]: { default: Plugin } };
    export default config;
}
declare module 'IasoModules/plugins/keys' {
    const keys: string[];
    export default keys;
}

declare module 'IasoModules/translations/configs' {
    const translations: { [key: string]: { default: Record<string, string> } };
    export default translations;
}

declare module 'IasoModules/translations/keys' {
    const languages: string[];
    export default languages;
}

declare module 'IasoModules/language/configs' {
    interface DateFormats {
        LT: string;
        LTS: string;
        L: string;
        LL: string;
        LLL: string;
        LLLL: string;
    }

    interface LanguageConfig {
        label: string;
        dateFormats: DateFormats;
        thousandGroupStyle: 'thousand' | 'lakh' | 'wan';
    }

    const configs: { [key: string]: LanguageConfig };
    export default configs;
}
