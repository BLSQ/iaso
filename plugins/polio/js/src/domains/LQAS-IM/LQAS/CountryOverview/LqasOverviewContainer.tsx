import React, { FunctionComponent, useMemo } from 'react';

import { Divider, Paper } from '@mui/material';
import { DropdownOptions } from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import {
    Campaign,
    ConvertedLqasImData,
    Side,
} from '../../../../constants/types';
import { baseUrls } from '../../../../constants/urls';
import { getLqasImMapLayer, LqasImMapLayer } from '../../IM/utils';
import { LIST, LqasIMView, MAP } from '../../shared/constants';
import { MapShapes, useMapShapes } from '../../shared/hooks/api/useMapShapes';
import { useLqasImMapHeaderData } from '../../shared/hooks/useLqasImMapHeaderData';
import { LqasImMapHeader } from '../../shared/Map/LqasImMapHeader';
import { LqasImTabs } from '../../shared/Tabs/LqasImTabs';
import { useLqasImTabState } from '../../shared/Tabs/useLqasImTabState';
import { LqasCountryListOverview } from './LqasCountryListOverview';
import { LqasCountryMap } from './LqasCountryMap';
import { LqasSummary } from './LqasSummary';

type Props = {
    round: number | undefined | string;
    campaign?: string;
    campaigns: Array<Campaign>;
    countryId?: number;
    data: Record<string, ConvertedLqasImData>;
    isFetching: boolean;
    debugData: Record<string, unknown> | null | undefined;
    paperElevation: number;
    options: DropdownOptions<number>[];
    onRoundChange: (value: number) => void;
    side: Side;
    params: Record<string, string | undefined>;
};

const baseUrl = baseUrls.lqasCountry;

export const LqasOverviewContainer: FunctionComponent<Props> = ({
    round: roundProp,
    campaign,
    campaigns,
    countryId,
    data,
    isFetching,
    debugData,
    paperElevation,
    options,
    onRoundChange,
    side,
    params,
}) => {
    const round =
        typeof roundProp === 'string' ? parseInt(roundProp, 10) : roundProp;
    const { tab, handleChangeTab } = useLqasImTabState({
        baseUrl,
        params,
        side,
    });
    const {
        shapes,
        isFetchingGeoJson,
        regionShapes,
        isFetchingRegions,
    }: MapShapes = useMapShapes(countryId);

    const mainLayer: LqasImMapLayer[] = useMemo(() => {
        return getLqasImMapLayer({
            data,
            selectedCampaign: campaign,
            type: LqasIMView.lqas,
            campaigns,
            round,
            shapes,
        });
    }, [data, campaign, campaigns, round, shapes]);

    const { startDate, endDate, scopeCount } = useLqasImMapHeaderData({
        campaign,
        campaigns,
        round,
        type: LqasIMView.lqas,
        withScopeCount: true,
    });
    return (
        <Paper elevation={paperElevation}>
            <LqasImMapHeader
                round={round}
                startDate={startDate}
                endDate={endDate}
                options={options ?? []}
                onRoundSelect={onRoundChange}
                campaignObrName={campaign}
                isFetching={isFetching}
            />
            <Divider />
            <LqasSummary
                round={round}
                campaign={campaign}
                data={data}
                scopeCount={scopeCount as number}
            />
            <Divider />
            <LqasImTabs tab={tab} handleChangeTab={handleChangeTab} />
            {tab === MAP && (
                <LqasCountryMap
                    side={side}
                    round={round}
                    selectedCampaign={campaign}
                    countryId={countryId}
                    campaigns={campaigns}
                    data={data}
                    isFetching={isFetching}
                    isFetchingGeoJson={isFetchingGeoJson}
                    disclaimerData={debugData}
                    mainLayer={mainLayer}
                    regionShapes={regionShapes}
                    isFetchingRegions={isFetchingRegions}
                />
            )}
            {tab === LIST && (
                <LqasCountryListOverview
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
