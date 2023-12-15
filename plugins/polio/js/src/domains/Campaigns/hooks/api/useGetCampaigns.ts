/* eslint-disable camelcase */
import { useMemo } from 'react';
import { QueryKey, UseQueryResult } from 'react-query';
import { getRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

const DEFAULT_PAGE_SIZE = 40;
const DEFAULT_PAGE = 1;
const DEFAULT_ORDER = '-cvdpv2_notified_at';
export const CAMPAIGNS_ENDPOINT = '/api/polio/campaigns/';

export type CampaignType = 'all' | 'preventive' | 'test' | 'regular';

type Options = {
    pageSize?: number;
    page?: number;
    order?: string;
    countries?: (number | string)[];
    search?: string;
    roundStartFrom?: string; // Date
    roundStartTo?: string; // Date
    showOnlyDeleted?: boolean;
    campaignType?: CampaignType;
    campaignGroups?: number[];
    orgUnitGroups?: number[];
    show_test?: boolean;
    enabled?: boolean;
    last_budget_event__status?: string;
    fieldset?: string;
};

export type GetCampaignsParams = {
    limit?: number;
    page?: number;
    order?: string;
    country__id__in?: (number | string)[];
    search?: string;
    rounds__started_at__gte?: string;
    rounds__started_at__lte?: string;
    deletion_status?: string;
    campaign_type?: CampaignType;
    campaign_groups?: number[];
    org_unit_groups?: number[];
    show_test?: boolean;
    // Ugly fix to prevent the full list of campaigns showing when waiting for the value of countries
    enabled?: boolean;
    last_budget_event__status?: string;
    fieldset?: string;
    format?: string;
};

const getURL = (urlParams: GetCampaignsParams, url: string): string => {
    const filteredParams: [string, any][] = Object.entries(urlParams).filter(
        // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
        ([_key, value]) => value !== undefined,
    );

    const queryString = new URLSearchParams(Object.fromEntries(filteredParams));

    return `${url}?${queryString.toString()}`;
};

export const useGetCampaignsOptions = (
    options: Options,
    asCsv = false,
): GetCampaignsParams => {
    return useMemo(
        () => ({
            limit: asCsv ? undefined : options.pageSize,
            page: asCsv ? undefined : options.page,
            order: options.order,
            country__id__in: options.countries,
            search: options.search,
            rounds__started_at__gte: options.roundStartFrom,
            rounds__started_at__lte: options.roundStartTo,
            deletion_status: options.showOnlyDeleted ? 'deleted' : undefined,
            campaign_type: options.campaignType ?? 'all',
            campaign_groups: options.campaignGroups,
            org_unit_groups: options.orgUnitGroups,
            show_test: options.show_test ?? false,
            // Ugly fix to prevent the full list of campaigns showing when waiting for the value of countries
            enabled: options.enabled ?? true,
            last_budget_event__status: options.last_budget_event__status,
            fieldset: asCsv ? undefined : options.fieldset ?? undefined,
        }),
        [
            asCsv,
            options.campaignGroups,
            options.campaignType,
            options.countries,
            options.enabled,
            options.fieldset,
            options.last_budget_event__status,
            options.order,
            options.orgUnitGroups,
            options.page,
            options.pageSize,
            options.roundStartFrom,
            options.roundStartTo,
            options.search,
            options.showOnlyDeleted,
            options.show_test,
        ],
    );
};

export const useGetCampaigns = (
    options: Options = {},
    url: string | undefined = CAMPAIGNS_ENDPOINT,
    queryKey?: string | unknown[],
    queryOptions?: Record<string, any>,
): UseQueryResult => {
    const params: GetCampaignsParams = useGetCampaignsOptions(options);
    // adding the params to the queryKey to make sure it fetches when the query changes
    const effectiveQueryKey: QueryKey = useMemo(() => {
        const key: any[] = ['polio', 'campaigns', params];
        if (queryKey) {
            key.push(queryKey);
        }
        if (queryOptions) {
            key.push(queryOptions);
        }
        return key;
    }, [params, queryKey, queryOptions]);
    return useSnackQuery({
        queryKey: effectiveQueryKey,
        queryFn: () => getRequest(getURL(params, url)),
        options: {
            cacheTime: Infinity,
            structuralSharing: false,
            refetchOnWindowFocus: false,
            enabled: !!params.enabled,
            ...queryOptions,
        },
    });
};

export const useGetCampaignsAsCsv = (
    options: Options = {},
    url = '/api/polio/campaigns/export_csv/',
): string => {
    const params = useGetCampaignsOptions(options, true);
    return `${getURL(params, url)}`;
};

// Add the defaults. put in a memo for comparison.
// Need a better way to handle default in the routing
export const useCampaignParams = (params: Options): Options => {
    return useMemo(() => {
        const showTest = !!(
            params.campaignType !== 'regular' &&
            params.campaignType !== 'preventive'
        );
        return {
            order: params?.order ?? DEFAULT_ORDER,
            pageSize: params?.pageSize ?? DEFAULT_PAGE_SIZE,
            page: params?.page ?? DEFAULT_PAGE,
            countries: params.countries,
            search: params.search,
            roundStartFrom: params.roundStartFrom,
            roundStartTo: params.roundStartTo,
            showOnlyDeleted: params.showOnlyDeleted,
            campaignType: params.campaignType,
            campaignGroups: params.campaignGroups,
            show_test: showTest,
            last_budget_event__status: params.last_budget_event__status,
            fieldset: 'list',
            orgUnitGroups: params.orgUnitGroups,
        };
    }, [params]);
};
