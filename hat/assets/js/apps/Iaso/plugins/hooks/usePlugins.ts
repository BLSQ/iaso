import { useMemo } from 'react';
import { Theme } from '@mui/material';
import configs from 'iaso_plugins/configs';

import { last } from 'lodash';
import { Plugin } from '../types';

export const usePlugins = (
    pluginsKeys: string[],
): {
    plugins: Plugin[];
    pluginHomePage: string | undefined;
    pluginTheme: Theme | undefined;
} => {
    return useMemo(() => {
        const plugins: Plugin[] = pluginsKeys
            .map(pluginsKey => {
                const pluginConfig: Plugin = configs[pluginsKey]?.default;
                console.log('pluginConfig', pluginConfig);
                return pluginConfig
                    ? { ...pluginConfig, key: pluginsKey }
                    : null;
            })
            .filter(Boolean) as Plugin[];

        const pluginHomePage = last(plugins.map(plugin => plugin.homeUrl));
        const pluginTheme = last(plugins.map(plugin => plugin.theme));

        return { plugins, pluginHomePage, pluginTheme };
    }, [pluginsKeys]);
};
