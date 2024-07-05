import React, { FunctionComponent, useMemo } from 'react';
import { Paper, Divider, Box } from '@mui/material';
import { baseUrls } from '../../../../constants/urls';
import { ImCountryMap } from './ImCountryMap';
import { LqasImMapHeader } from '../../shared/Map/LqasImMapHeader';
import { ConvertedLqasImData, IMType, Side } from '../../../../constants/types';
import { DropdownOptions } from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { LIST, MAP } from '../../shared/constants';
import { ImSummary } from './ImSummary';
import { getLqasImMapLayer } from '../utils';
import { ImCountryListOverview } from './ImCountryListOverview';
import { useLqasImTabState } from '../../shared/Tabs/useLqasImTabState';
import { LqasImTabs } from '../../shared/Tabs/LqasImTabs';
import { useLqasImMapHeaderData } from '../../shared/hooks/useLqasImMapHeaderData';
import { useMapShapes } from '../../shared/hooks/api/useMapShapes';

type Props = {
    round: number;
    campaign: string;
    campaigns: Array<unknown>;
    country: string;
    data: Record<string, ConvertedLqasImData>;
    isFetching: boolean;
    debugData: Record<string, unknown> | null | undefined;
    paperElevation: number;
    type: IMType;
    options: DropdownOptions<number>[];
    // eslint-disable-next-line no-unused-vars
    onRoundChange: (value: number) => void;
    side: Side;
    params: Record<string, string | undefined>;
};

export const ImOverviewContainer: FunctionComponent<Props> = ({
    round,
    campaign,
    campaigns,
    country,
    data,
    isFetching,
    debugData,
    paperElevation,
    type,
    options,
    onRoundChange,
    side,
    params,
}) => {
    console.log('type', type);
    const baseUrl = baseUrls[type];
    console.log('baseUrl', baseUrl);
    const { tab, handleChangeTab } = useLqasImTabState({
        baseUrl,
        params,
        side,
    });
    const countryId = parseInt(country, 10);
    const { shapes, isFetchingGeoJson, regionShapes, isFetchingRegions } =
        useMapShapes(countryId);

    const mainLayer = useMemo(() => {
        return getLqasImMapLayer({
            data,
            selectedCampaign: campaign,
            type,
            campaigns,
            round,
            shapes,
        });
    }, [shapes, data, campaign, type, round, campaigns]);

    const { startDate, endDate } = useLqasImMapHeaderData({
        campaign,
        campaigns,
        round,
        type,
    });

    return (
        <Paper elevation={paperElevation}>
            <Box mb={2}>
                <LqasImMapHeader
                    round={round}
                    startDate={startDate}
                    endDate={endDate}
                    options={options}
                    onRoundSelect={onRoundChange}
                    campaignObrName={campaign}
                    isFetching={isFetching}
                />
            </Box>
            <Divider />
            <ImSummary
                round={round}
                campaign={campaign}
                data={data}
                type={type}
            />
            <Divider />
            <LqasImTabs tab={tab} handleChangeTab={handleChangeTab} />
            {tab === MAP && (
                <ImCountryMap
                    round={round}
                    selectedCampaign={campaign}
                    type={type}
                    countryId={countryId}
                    campaigns={campaigns}
                    data={data}
                    isFetching={isFetching}
                    disclaimerData={debugData}
                    mainLayer={mainLayer}
                    isFetchingGeoJson={isFetchingGeoJson}
                    regionShapes={regionShapes}
                    isFetchingRegions={isFetchingRegions}
                />
            )}
            {tab === LIST && (
                <ImCountryListOverview
                    shapes={mainLayer}
                    regionShapes={regionShapes}
                    isFetching={
                        isFetching || isFetchingGeoJson || isFetchingRegions
                    }
                />
            )}
        </Paper>
    );
};
