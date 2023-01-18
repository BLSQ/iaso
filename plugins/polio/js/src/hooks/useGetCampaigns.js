import { useMemo } from 'react';
import { useSnackQuery } from 'Iaso/libs/apiHooks.ts';
import { getRequest } from 'Iaso/libs/Api';

const DEFAULT_PAGE_SIZE = 40;
const DEFAULT_PAGE = 1;
const DEFAULT_ORDER = '-cvdpv2_notified_at';

export const useGetCampaigns = (
    options = {},
    url = '/api/polio/campaigns/',
    queryKey,
) => {
    const params = useMemo(
        () => ({
            limit: options.pageSize,
            page: options.page,
            order: options.order,
            country__id__in: options.countries,
            search: options.search,
            rounds__started_at__gte: options.roundStartFrom,
            rounds__started_at__lte: options.roundStartTo,
            deletion_status: options.showOnlyDeleted ? 'deleted' : undefined,
            campaign_type: options.campaignType ?? 'all',
            campaign_groups: options.campaignGroups,
            show_test: options.show_test ?? false,
            // Ugly fix to prevent the full list of campaigns showing when waiting for the value of countries
            enabled: options.enabled ?? true,
            last_budget_event__status: options.last_budget_event__status,
            fieldset: options.fieldset ?? undefined,
        }),
        [
            options.campaignGroups,
            options.campaignType,
            options.countries,
            options.enabled,
            options.last_budget_event__status,
            options.order,
            options.page,
            options.pageSize,
            options.roundStartFrom,
            options.roundStartTo,
            options.search,
            options.showOnlyDeleted,
            options.show_test,
        ],
    );

    const getURL = urlParams => {
        const filteredParams = Object.entries(urlParams).filter(
            // eslint-disable-next-line no-unused-vars
            ([_key, value]) => value !== undefined,
        );

        const queryString = new URLSearchParams(
            Object.fromEntries(filteredParams),
        );

        return `${url}?${queryString.toString()}`;
    };
    const effectiveQueryKey = useMemo(() => {
        if (queryKey) {
            return ['polio', 'campaigns', queryKey, params];
        }
        return ['polio', 'campaigns', params];
    }, [params, queryKey]);

    // adding the params to the queryKey to make sure it fetches when the query changes
    return {
        // eslint-disable-next-line no-return-assign
        exportToCSV: () =>
            (window.location.href = `${getURL({
                ...params,
                limit: undefined,
                page: undefined,
                format: 'csv',
            })}`),
        query: useSnackQuery(
            effectiveQueryKey,
            () => getRequest(getURL(params)),
            undefined,
            {
                cacheTime: Infinity,
                structuralSharing: false,
                refetchOnWindowFocus: false,
                enabled: !!params.enabled,
            },
        ),
    };
};

// Add the defaults. put in a memo for comparison.
// Need a better way to handle default in the routing
export const useCampaignParams = params => {
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
        };
    }, [params]);
};
