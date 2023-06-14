import { createContext } from 'react';
import pluginsConfigs from '../../../../../../plugins';

export const capitalize = (text, keepEndCase = false) =>
    text
        .split(' ')
        .map(
            word =>
                word.slice(0, 1).toUpperCase() +
                (keepEndCase ? word.slice(1) : word.slice(1).toLowerCase()),
        )
        .join(' ');

export const formatThousand = number => {
    if (number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    return '0';
};

export const getYears = (yearsCount, offset = 0, reverse = false) => {
    const currentYear = new Date().getFullYear() + offset;
    const years = Array(yearsCount)
        .fill(null)
        .map((y, i) => currentYear - i);
    if (reverse) {
        return years.reverse();
    }
    return years;
};

export const userHasPermission = (
    permissions,
    currentUser,
    permissionKey,
    allowSuperUser = true,
) => {
    let hasPermission = false;
    if (
        currentUser &&
        permissions &&
        Object.getOwnPropertyNames(currentUser).length !== 0 &&
        permissions.length > 0
    ) {
        const currentPermission = permissions.find(
            p => p.codename === permissionKey,
        );
        // TODO: the API is now filtering the user permissions list so the second .find below is unnecessary
        if (
            (currentUser.is_superuser && allowSuperUser) ||
            (currentPermission &&
                currentUser.permissions.find(p => p === currentPermission.id))
        ) {
            hasPermission = true;
        }
    }
    return hasPermission;
};

export const getPlugins = pluginsKeys => {
    const plugins = [];
    pluginsKeys.forEach(plugin => {
        const pluginConfig = pluginsConfigs[plugin];
        if (pluginConfig) {
            plugins.push({
                ...pluginConfig,
                key: plugin,
            });
        }
    });
    return plugins;
};

export const PluginsContext = createContext({ plugins: [] });

// create timeout to simulate async call
// credit https://stackoverflow.com/questions/51200626/using-a-settimeout-in-a-async-function
// Added it here because using the one from test/utils would cause compilation errors
export const waitFor = delay =>
    new Promise(resolve => setTimeout(resolve, delay));

export const fakeResponse =
    response =>
    async (isError = false) => {
        if (isError) throw new Error('mock request failed');
        await waitFor(200);
        return response;
    };

export const noOp = () => undefined;

export const findDescriptorInChildren = (field, descriptor) => {
    const fieldName = typeof field === 'string' ? field : field.name;
    return descriptor?.children?.reduce((a, child) => {
        if (a) return a;
        if (child.name === fieldName) return child;
        if (child.children) return findDescriptorInChildren(field, child);
        return undefined;
    }, null);
};
