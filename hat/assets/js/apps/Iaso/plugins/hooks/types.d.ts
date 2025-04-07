declare module 'iaso_plugins/configs' {
    import { Plugin } from '../types';

    const config: Plugin;
    export default config;
}

declare module 'iaso_plugins/keys' {
    const keys: string[];
    export default keys;
}
