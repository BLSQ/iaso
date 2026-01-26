import { useMemo } from 'react';
import { Moment } from 'moment';
import { getCampaignColor } from '../../../constants/campaignsColors';
import {
    CalendarData,
    CalendarOrdering,
    FormattedCalendarData,
    MappedCampaign,
} from '../campaignCalendar/types';
import {
    filterCampaigns,
    mapCampaigns,
} from '../campaignCalendar/utils/campaigns';
import { useMergedCampaigns } from './useMergedCampaigns/useMergedCampaigns';

type Args = {
    params: Record<string, string>;
    isTypeSet: boolean;
    calendarData: CalendarData;
    isEmbedded: boolean;
    currentDate: Moment;
    campaignType?: string;
    order: CalendarOrdering;
};

export const useGetFormattedCalendarData = ({
    params,
    isTypeSet,
    calendarData,
    isEmbedded,
    currentDate,
    campaignType,
    order,
}: Args): FormattedCalendarData => {
    const { campaigns, isLoading, isFetching } = useMergedCampaigns({
        params,
        isTypeSet,
        order,
        isEmbedded,
        currentDate,
        campaignType,
    });

    const filteredCampaigns: MappedCampaign[] = useMemo(() => {
        const mappedCampaigns: MappedCampaign[] = mapCampaigns(
            campaigns,
            calendarData.firstMonday,
            calendarData.lastSunday,
        );
        return filterCampaigns(
            mappedCampaigns,
            calendarData.firstMonday,
            calendarData.lastSunday,
        ).map((c, index) => ({ ...c, color: getCampaignColor(index) }));
    }, [campaigns, calendarData.firstMonday, calendarData.lastSunday]);

    return useMemo(() => {
        return {
            filteredCampaigns,
            isLoading,
            isFetching,
        };
    }, [filteredCampaigns, isFetching, isLoading]);
};
