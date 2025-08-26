import { Campaign, MapShapes, Side } from '../../../../constants/types';
import React, { FunctionComponent, useMemo } from 'react';
import { ConvertedLqasImData, LqasImMapLayer } from '../../types';
import { baseUrls } from '../../../../constants/urls';
import { useLqasImTabState } from '../../shared/Tabs/useLqasImTabState';
import { useMapShapes } from '../../shared/hooks/api/useMapShapes';
import { Divider, Paper } from '@mui/material';
import { LIST, MAP, paperElevation } from '../../shared/constants';
import { LqasImTabs } from '../../shared/Tabs/LqasImTabs';
import { DropdownOptions } from 'Iaso/types/utils';

type Props = {
    countryBlockId?: number;
    data: Record<string, ConvertedLqasImData>;
    side: Side;
    params: Record<string, string | undefined>;
    isFetching: boolean;
};

const baseUrl = baseUrls.lqasCountry;
export const LqasCountryDataView: FunctionComponent<Props> = ({
    params,
    side,
    countryBlockId,
    data,
    isFetching,
}) => {
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
        return getLqasCountryBlockMapLayer({
            data,
            campaign,
            roundNumber,
            shapes,
        });
    }, [data, campaign, roundNumber, shapes]);

    return (
        <Paper elevation={paperElevation}>
            {/* <LqasImMapHeader
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
            /> */}
            <Divider />
            <LqasImTabs tab={tab} handleChangeTab={handleChangeTab} />
            {tab === MAP && (
                <LqasCountryBlockMapView
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
                <LqasCountryBlockListView
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
