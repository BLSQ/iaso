import { useMemo } from 'react';
import { Moment } from 'moment';
import { CalendarCampaign } from '../../../../constants/types';
import {
    CalendarOrdering,
    IntegratedCampaignAPIResponse,
} from '../../campaignCalendar/types';
import { useGetCampaigns } from '../useGetCampaigns';
import { useGetIntegratedCampaigns } from '../useGetIntegratedCampaigns';
import { consolidateCampaigns, sortCampaigns } from './utils';

type Args = {
    params: Record<string, string>;
    isTypeSet: boolean;
    isEmbedded: boolean;
    currentDate: Moment;
    order: CalendarOrdering;
    campaignType?: string;
};

export type UseMergedCampaignsValue = {
    campaigns: CalendarCampaign[];
    isLoading: boolean;
    isFetching: boolean;
};

export const useMergedCampaigns = ({
    params,
    isTypeSet,
    order,
    isEmbedded,
    currentDate,
    campaignType,
}: Args): UseMergedCampaignsValue => {
    const currentDateString = currentDate.format('YYYY-MM-DD');
    const showIntegrated = params?.showIntegrated == 'true';
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
        enabled: showIntegrated,
    });

    const orderedRegularCampaigns: CalendarCampaign[] = useMemo(() => {
        return sortCampaigns(regularCampaigns, order);
    }, [regularCampaigns, order]);

    const orderedIntegratedCampaigns: IntegratedCampaignAPIResponse[] =
        useMemo(() => {
            return sortCampaigns(integratedCampaigns, order);
        }, [integratedCampaigns, order]);

    // This is the mean one: we need to deduplicate when type is polio + other type
    // otherwise we need to merge with integrated campaigns if the boolean is True, return only regular if False
    const deduplicatedCampaigns: CalendarCampaign[] = useMemo(() => {
        if (hasPolio && showIntegrated) {
            const integratedObrNames: string[] = orderedIntegratedCampaigns.map(
                c => c.obr_name,
            );
            const uniqueRegularCampaigns: CalendarCampaign[] =
                orderedRegularCampaigns.filter(
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
    }, [
        orderedIntegratedCampaigns,
        orderedRegularCampaigns,
        hasPolio,
        order,
        showIntegrated,
    ]);

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
