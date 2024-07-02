import {
    RouteConfig,
    extractParams,
    extractParamsConfig,
    extractUrls,
} from '../../../../../hat/assets/js/apps/Iaso/constants/urls';

export const HOME_BASE_URL = 'public_registry/registry';

export const RouteConfigs: Record<string, RouteConfig> = {
    home: {
        url: HOME_BASE_URL,
        params: [],
    },
};

export type BaseUrls = {
    home: string;
};
export const baseUrls = extractUrls(RouteConfigs) as BaseUrls;
export const baseParams = extractParams(RouteConfigs);
export const paramsConfig = extractParamsConfig(RouteConfigs);
