import { useMemo } from 'react';
import { getCampaignColor } from '../../../constants/campaignsColors';
import { MappedCampaign } from '../campaignCalendar/types';
import {
    filterCampaigns,
    mapCampaigns,
} from '../campaignCalendar/utils/campaigns';
import { useMergedCampaigns } from './useMergedCampaigns';

export const useGetFormattedCalendarData = ({
    params,
    isTypeSet,
    calendarData,
    isEmbedded,
    currentDate,
    campaignType,
    order,
}) => {
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
