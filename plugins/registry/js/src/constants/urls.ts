import {
    RouteConfig,
    extractParams,
    extractParamsConfig,
    extractUrls,
} from '../../../../../hat/assets/js/apps/Iaso/constants/urls';

export const HOME_BASE_URL = 'registry/home';
export const REGISTRY_BASE_URL = 'registry';

export const RouteConfigs: Record<string, RouteConfig> = {
    home: {
        url: HOME_BASE_URL,
        params: [],
    },
    registry: {
        url: REGISTRY_BASE_URL,
        params: ['orgUnitId'],
    },
};

export type BaseUrls = {
    home: string;
    registry: string;
};
export const baseUrls = extractUrls(RouteConfigs) as BaseUrls;
export const baseParams = extractParams(RouteConfigs);
export const paramsConfig = extractParamsConfig(RouteConfigs);
