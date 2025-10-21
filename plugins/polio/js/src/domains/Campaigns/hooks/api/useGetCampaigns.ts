import { useMemo } from 'react';
import { QueryKey, UseQueryResult } from 'react-query';
import { PaginatedResponse } from 'Iaso/domains/app/types';
import { getRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { Campaign } from '../../../../constants/types';

const DEFAULT_PAGE_SIZE = 40;
const DEFAULT_PAGE = 1;
const DEFAULT_ORDER = '-cvdpv2_notified_at';
export const CAMPAIGNS_ENDPOINT = '/api/polio/campaigns/';

export type CampaignCategory = 'all' | 'preventive' | 'on_hold' | 'regular';

export type Options = {
    pageSize?: number;
    page?: number;
    order?: string;
    countries?: string;
    search?: string;
    roundStartFrom?: string; // Date
    roundStartTo?: string; // Date
    showOnlyDeleted?: boolean;
    campaignType?: string;
    campaignCategory?: CampaignCategory;
    campaignGroups?: number[];
    orgUnitGroups?: number[];
    show_test?: boolean;
    on_hold?: boolean;
    is_embedded?: boolean;
    enabled?: boolean;
    fieldset?: string;
    filterLaunched?: boolean;
};

export type GetCampaignsParams = {
    limit?: number;
    page?: number;
    order?: string;
    country__id__in?: string;
    search?: string;
    rounds__started_at__gte?: string;
    rounds__started_at__lte?: string;
    deletion_status?: string;
    campaign_types?: string;
    campaign_category?: CampaignCategory;
    campaign_groups?: number[];
    org_unit_groups?: number[];
    show_test?: boolean;
    on_hold?: boolean;
    is_embedded?: boolean;
    // Ugly fix to prevent the full list of campaigns showing when waiting for the value of countries
    enabled?: boolean;
    fieldset?: string;
    format?: string;
};

export type CampaignAPIResponse = {
    hasPrevious?: boolean;
    hasNext?: boolean;
    count?: number;
    page?: number;
    pages?: number;
    limit?: number;
    campaigns?: Campaign[];
};

const getURL = (urlParams: GetCampaignsParams, url: string): string => {
    const filteredParams: [string, any][] = Object.entries(urlParams).filter(
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
            campaign_types: options.campaignType,
            campaign_category: options.campaignCategory ?? 'all',
            campaign_groups: options.campaignGroups,
            org_unit_groups: options.orgUnitGroups,
            show_test: options.show_test ?? false,
            on_hold: options.on_hold ?? false,
            is_embedded: options.is_embedded ?? false,
            // Ugly fix to prevent the full list of campaigns showing when waiting for the value of countries
            enabled: options.enabled ?? true,
            fieldset: asCsv ? undefined : (options.fieldset ?? undefined),
        }),
        [
            asCsv,
            options.pageSize,
            options.page,
            options.order,
            options.countries,
            options.search,
            options.roundStartFrom,
            options.roundStartTo,
            options.showOnlyDeleted,
            options.campaignType,
            options.campaignCategory,
            options.campaignGroups,
            options.orgUnitGroups,
            options.show_test,
            options.enabled,
            options.fieldset,
            options.on_hold,
            options.is_embedded,
        ],
    );
};

export const useGetCampaigns = (
    // eslint-disable-next-line default-param-last
    options: Options = {},
    // eslint-disable-next-line default-param-last
    url: string | undefined = CAMPAIGNS_ENDPOINT,
    queryKey?: string | unknown[],
    queryOptions?: Record<string, any>,
): UseQueryResult<CampaignAPIResponse | Campaign[], Error> => {
    const params: GetCampaignsParams = useGetCampaignsOptions(options);
    // adding the params to the queryKey to make sure it fetches when the query changes
    const effectiveQueryKey: QueryKey = useMemo(() => {
        const key: any[] = ['campaigns', params];
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
        queryFn: (): Promise<Campaign[] | PaginatedResponse<Campaign>> =>
            getRequest(getURL(params, url)),
        options: {
            cacheTime: Infinity,
            staleTime: 1000 * 60 * 15,
            structuralSharing: false,
            refetchOnWindowFocus: false,
            enabled: !!params.enabled,
            ...queryOptions,
        },
    });
};

export const useGetCampaignsAsCsv = (
    options: Options = {},
    url = '/api/polio/campaigns/csv_campaigns_export',
): string => {
    const params = useGetCampaignsOptions(options, true);
    return `${getURL(params, url)}`;
};

// Add the defaults. put in a memo for comparison.
// Need a better way to handle default in the routing
export const useCampaignParams = (params: Options): Options => {
    return useMemo(() => {
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
            campaignCategory: params.campaignCategory,
            campaignGroups: params.campaignGroups,
            show_test: params.show_test ?? true,
            on_hold:
                params.campaignCategory === 'on_hold' ||
                params.campaignCategory === 'all',
            fieldset: 'list',
            orgUnitGroups: params.orgUnitGroups,
        };
    }, [params]);
};
