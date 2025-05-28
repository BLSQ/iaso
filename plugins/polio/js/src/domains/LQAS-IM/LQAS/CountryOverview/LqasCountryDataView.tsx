import { Campaign, MapShapes, Side } from '../../../../constants/types';
import React, { FunctionComponent, useMemo } from 'react';
import { ConvertedLqasImData, LqasImMapLayer } from '../../types';
import { baseUrls } from '../../../../constants/urls';
import { useLqasImTabState } from '../../shared/Tabs/useLqasImTabState';
import { useMapShapes } from '../../shared/hooks/api/useMapShapes';
import { getLqasMapLayer, useLqasMapHeaderData } from './utils';

import { Divider, Paper } from '@mui/material';
import { LIST, MAP, paperElevation } from '../../shared/constants';
import { LqasImMapHeader } from '../../shared/Map/LqasImMapHeader';
import { LqasSummary } from './LqasSummary';
import { LqasImTabs } from '../../shared/Tabs/LqasImTabs';
import { DropdownOptions } from 'Iaso/types/utils';
import { LqasCountryListView } from './LqasCountryListView';
import { LqasCountryMapView } from './LqasCountryMapView';

type Props = {
    roundNumber?: number;
    campaign?: Campaign;
    countryId?: number;
    data: Record<string, ConvertedLqasImData>;
    onRoundChange: (value: number) => void;
    side: Side;
    debugData?: Record<string, unknown> | null;
    params: Record<string, string | undefined>;
    isFetching: boolean;
    roundOptions?: DropdownOptions<string>[];
};

const baseUrl = baseUrls.lqasCountry;
export const LqasCountryDataView: FunctionComponent<Props> = ({
    params,
    side,
    countryId,
    campaign,
    data,
    roundNumber,
    isFetching,
    debugData,
    roundOptions,
    onRoundChange,
}) => {
    const campaignObrName = campaign?.obr_name;
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
        return getLqasMapLayer({ data, campaign, roundNumber, shapes });
    }, [data, campaign, roundNumber, shapes]);
    const { startDate, endDate, scopeCount } = useLqasMapHeaderData({
        campaign,
        roundNumber,
        withScopeCount: true,
    });

    return (
        <Paper elevation={paperElevation}>
            <LqasImMapHeader
                round={roundNumber}
                startDate={startDate}
                endDate={endDate}
                options={roundOptions ?? []}
                onRoundSelect={onRoundChange}
                campaignObrName={campaignObrName}
                isFetching={isFetching}
            />
            <Divider />
            <LqasSummary
                round={roundNumber}
                campaign={campaignObrName}
                data={data}
                scopeCount={scopeCount as number}
            />
            <Divider />
            <LqasImTabs tab={tab} handleChangeTab={handleChangeTab} />
            {tab === MAP && (
                <LqasCountryMapView
                    side={side}
                    roundNumber={roundNumber}
                    campaign={campaign}
                    countryId={countryId}
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
                <LqasCountryListView
                    side={side}
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
