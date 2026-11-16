import {
    RouteConfig,
    extractParams,
    extractParamsConfig,
    extractUrls,
} from 'Iaso/constants/urls';
import { paginationPathParams } from 'Iaso/routing/common';

export const RouteConfigs: Record<string, RouteConfig> = {
    wfpBeneficiaries: {
        url: 'entities/wfp-beneficiaries',
        params: [
            'accountId',
            'entity_type',
            'programme',
            'org_unit_group',
            'facility',
            'q',
            'visit_date_after',
            'visit_date_before',
            ...paginationPathParams,
        ],
    },
};

export type BaseUrls = {
    wfpBeneficiaries: string;
};
export const baseUrls = extractUrls(RouteConfigs) as BaseUrls;
export const baseParams = extractParams(RouteConfigs);
export const paramsConfig = extractParamsConfig(RouteConfigs);
