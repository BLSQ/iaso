import { ElementType, useContext, useMemo } from 'react';
import { last } from 'lodash';

import { HomeOnline } from '../../domains/home/HomeOnline';
import { RouteCustom } from '../../routing/types';
import {
    SHOW_HOME_ONLINE,
    useCurrentUserHasFeatureFlag,
} from '../../utils/featureFlags';
import { PluginsContext } from '../context';
import { Plugins } from '../types';

export const useHomeOnlineComponent = (): ElementType | undefined => {
    const { plugins }: Plugins = useContext(PluginsContext);
    const canShowHome = useCurrentUserHasFeatureFlag(SHOW_HOME_ONLINE);
    const PluginHome = last(
        plugins
            .filter(plugin => plugin.homeOnline)
            .map(plugin => plugin.homeOnline),
    );
    // using the last plugin override (arbitrary choice)
    return useMemo(
        () => (canShowHome ? PluginHome || HomeOnline : undefined),
        [PluginHome, canShowHome],
    );
};

export const useHomeOfflineComponent = (): ElementType | undefined => {
    const { plugins }: Plugins = useContext(PluginsContext);
    // using the last plugin override (arbitrary choice)
    return useMemo(
        () =>
            last(
                plugins
                    .filter(plugin => plugin.homeOffline)
                    .map(plugin => plugin.homeOffline),
            ),
        [plugins],
    );
};

export const usePluginsRouteConfigs = (): {
    pluginRoutes: RouteCustom[];
    pluginRedirections: any[];
} => {
    const { plugins }: Plugins = useContext(PluginsContext);
    const pluginRoutes = plugins.map(plugin => plugin.routes).flat();
    const pluginRedirections = plugins
        .map(plugin => plugin.redirections)
        .flat();
    return useMemo(
        () => ({ pluginRoutes, pluginRedirections }),
        [pluginRedirections, pluginRoutes],
    );
};
