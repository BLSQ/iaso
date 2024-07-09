import {
    RouteConfig,
    extractParams,
    extractParamsConfig,
    extractUrls,
    paginationPathParamsWithPrefix,
} from '../../../../../hat/assets/js/apps/Iaso/constants/urls';
import { paginationPathParams } from '../../../../../hat/assets/js/apps/Iaso/routing/common';

export const HOME_BASE_URL = 'registry/home';
export const REGISTRY_BASE_URL = 'registry/data';

export const RouteConfigs: Record<string, RouteConfig> = {
    home: {
        url: HOME_BASE_URL,
        params: [],
    },
    registry: {
        url: REGISTRY_BASE_URL,
        params: [
            'accountId',
            'orgUnitId',
            'orgUnitChildrenId',
            'fullScreen',
            'formIds',
            'columns',
            'tab',
            'orgUnitListTab',
            'submissionId',
            'missingSubmissionVisible',
            'showTooltip',
            'clusterEnabled',
            ...paginationPathParams,
            ...paginationPathParamsWithPrefix('orgUnitList'),
            ...paginationPathParamsWithPrefix('missingSubmissions'),
        ],
    },
};

export type BaseUrls = {
    home: string;
    registry: string;
};
export const baseUrls = extractUrls(RouteConfigs) as BaseUrls;
export const baseParams = extractParams(RouteConfigs);
export const paramsConfig = extractParamsConfig(RouteConfigs);
