import { ElementType, useContext, useMemo } from 'react';
import { PluginsContext } from '../context';
import { Plugins } from '../types';

type CustomComponent = {
    key: string;
    component: ElementType;
};

export const useGetCustomComponents = () => {
    const { plugins }: Plugins = useContext(PluginsContext);

    return useMemo(
        () =>
            plugins
                .flatMap(plugin => plugin.customComponents)
                .filter(
                    (component): component is CustomComponent =>
                        component !== undefined,
                ),
        [plugins],
    );
};

// Every plugin that registers this key is rendered. Used when several plugins
// can add a control to the same host slot.
export const useCustomComponentsByKey = (key: string): ElementType[] => {
    const components = useGetCustomComponents();

    return useMemo(
        () =>
            components
                .filter(component => component.key === key)
                .map(component => component.component),
        [components, key],
    );
};

// We will use the last custom component found with the key
export const useFindCustomComponent = (
    key: string,
): ElementType | undefined => {
    const components = useGetCustomComponents();

    return useMemo(
        () =>
            components.filter(component => component.key === key).slice(-1)[0]
                ?.component,
        [components, key],
    );
};
