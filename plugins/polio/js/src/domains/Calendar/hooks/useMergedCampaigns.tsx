import { useMemo } from 'react';
import moment from 'moment';
import { UuidAsString } from '../../../constants/types';
import { useGetCampaigns } from './useGetCampaigns';
import { useGetIntegratedCampaigns } from './useGetIntegratedCampaigns';

export type CalendarOrdering =
    | '-first_round_started_at'
    | 'first_round_started_at'
    | 'country__name'
    | '-country__name'
    | 'obr_name'
    | '-obr_name';

type Args = {
    params: any;
    isTypeSet: any;
    isEmbedded: any;
    currentDate: any;
    order: CalendarOrdering;
    campaignType: string;
};

// TODO update TS type for additional fields
const addLayoutInfo = (list: any[]) => {
    // campaign +1 integrated = min length of 2
    if (list.length === 2) {
        return [
            { ...list[0], layout: 'top' },
            { ...list[1], layout: 'bottom' },
        ];
    }
    if (list.length > 2) {
        const copy = [...list];
        const first = copy.shift();
        const last = copy.pop();
        return [
            { ...first, layout: 'top' },
            ...copy.map(el => ({ ...el, layout: 'middle' })),
            { ...last, layout: 'bottom' },
        ];
    }
    // default fallback, to avoid errors
    return list;
};

const consolidateCampaigns = (integratedCampaigns, regularCampaigns: any[]) => {
    if (integratedCampaigns.length === 0) {
        return [...regularCampaigns];
    }
    const idsDict: Record<UuidAsString, any[]> = {};
    integratedCampaigns.forEach(ic => {
        if (idsDict[ic.integrated_to]) {
            idsDict[ic.integrated_to].push(ic);
        } else {
            idsDict[ic.integrated_to] = [ic];
        }
    });
    const result: any[] = [];
    regularCampaigns.forEach(cc => {
        if (idsDict[cc.id]) {
            const withIntegrated = [cc, ...idsDict[cc.id]];
            result.push(...addLayoutInfo(withIntegrated));
        } else {
            result.push(cc);
        }
    });
    return result;
};

const sortCampaigns = (campaigns, order) => {
    switch (order) {
        case '-first_round_started_at':
            return campaigns.sort((campA, campB) =>
                moment(campA.first_round_started_at).isAfter(
                    moment(campB.first_round_started_at),
                ),
            );
        case 'first_round_started_at':
            return campaigns.sort((campA, campB) =>
                moment(campA.first_round_started_at).isBefore(
                    moment(campB.first_round_started_at),
                ),
            );
        case '-country__name':
            return campaigns.sort((campA, campB) =>
                campA.top_level_org_unit_name.localeCompare(
                    campB.top_level_org_unit_name,
                    undefined,
                    {
                        sensitivity: 'accent',
                    },
                ),
            );
        case 'country__name':
            return campaigns.sort((campA, campB) =>
                campB.top_level_org_unit_name.localeCompare(
                    campA.top_level_org_unit_name,
                    undefined,
                    {
                        sensitivity: 'accent',
                    },
                ),
            );
        case '-obr_name':
            return campaigns.sort((campA, campB) =>
                campA.obr_name.localeCompare(campB.obr_name, undefined, {
                    sensitivity: 'accent',
                }),
            );
        case 'obr_name':
            return campaigns.sort((campA, campB) =>
                campB.obr_name.localeCompare(campA.obr_name, undefined, {
                    sensitivity: 'accent',
                }),
            );
        default:
            return campaigns;
    }
};

export const useMergedCampaigns = ({
    params,
    isTypeSet,
    order,
    isEmbedded,
    currentDate,
    campaignType,
}: Args) => {
    const currentDateString = currentDate.format('YYYY-MM-DD');
    const hasPolio =
        campaignType?.includes('polio') ||
        campaignType === null ||
        campaignType === undefined;

    const queryParams = useMemo(() => {
        const options = {
            country__id__in: params.countries,
            search: params.search,
            campaign_types: params.campaignType,
            campaign_category: params.campaignCategory,
            campaign_groups: params.campaignGroups
                ? params.campaignGroups.split(',').map(Number)
                : undefined,
            org_unit_groups: params.orgUnitGroups
                ? params.orgUnitGroups.split(',').map(Number)
                : undefined,
            show_test: false,
            on_hold: false,
            reference_date: currentDateString,
        };

        return isEmbedded ? { ...options, is_embedded: true } : options;
    }, [
        params.countries,
        params.search,
        params.campaignCategory,
        params.campaignGroups,
        params.orgUnitGroups,
        params.campaignType,
        isEmbedded,
        currentDateString,
    ]);
    const {
        data: regularCampaigns = [],
        isLoading: isLoadingCampaigns,
        isFetching: isFetchingCampaigns,
    } = useGetCampaigns({
        queryParams,
        queryOptions: { enabled: isTypeSet },
    });

    const obrNames: string[] = useMemo(() => {
        return regularCampaigns.map(campaign => campaign.obr_name);
    }, [regularCampaigns]);

    const {
        data: integratedCampaigns = [],
        isFetching: isFetchingIntegrated,
        isLoading: isLoadingIntegrated,
    } = useGetIntegratedCampaigns({
        obrNames,
        enabled: params?.showIntegrated == 'true',
    });

    const orderedRegularCampaigns = useMemo(() => {
        return sortCampaigns(regularCampaigns, order);
    }, [regularCampaigns, order]);

    const orderedIntegratedCampaigns = useMemo(() => {
        return sortCampaigns(integratedCampaigns, order);
    }, [integratedCampaigns, order]);

    // This is the mean one: we need to deduplicate when type is polio + other type
    // otherwise we need to merge with integrated campaigns if the boolean is True, return only regular if False
    const deduplicatedCampaigns = useMemo(() => {
        if (hasPolio) {
            const integratedObrNames = orderedIntegratedCampaigns.map(
                c => c.obr_name,
            );
            const uniqueRegularCampaigns = orderedRegularCampaigns.filter(
                campaign => !integratedObrNames.includes(campaign.obr_name),
            );
            return consolidateCampaigns(
                orderedIntegratedCampaigns,
                uniqueRegularCampaigns,
            );
        }
        return orderedRegularCampaigns;
        // Add order to the deps to force re-ordrering
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderedIntegratedCampaigns, orderedRegularCampaigns, hasPolio, order]);

    return useMemo(() => {
        return {
            campaigns: deduplicatedCampaigns,
            isLoading: isLoadingCampaigns || isLoadingIntegrated,
            isFetching: isFetchingCampaigns || isFetchingIntegrated,
        };
    }, [
        isFetchingCampaigns,
        isFetchingIntegrated,
        isLoadingCampaigns,
        isLoadingIntegrated,
        deduplicatedCampaigns,
    ]);
};
