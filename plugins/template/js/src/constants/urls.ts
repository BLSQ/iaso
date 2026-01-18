import {
    RouteConfig,
    extractParams,
    extractParamsConfig,
    extractUrls,
} from 'Iaso/constants/urls';

export const RouteConfigs: Record<string, RouteConfig> = {
    // Example of a route config
    // pokemon: {
    //     url: 'games/pokemon/list',
    //     params: ['accountId'],
    // },
};

export type BaseUrls = {
    // pokemon: string;  // uncomment and add routes as needed
};
export const baseUrls = extractUrls(RouteConfigs) as BaseUrls;
export const baseParams = extractParams(RouteConfigs);
export const paramsConfig = extractParamsConfig(RouteConfigs);
