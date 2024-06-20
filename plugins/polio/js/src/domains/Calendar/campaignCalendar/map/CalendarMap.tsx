import { Box } from '@mui/material';
import 'leaflet/dist/leaflet.css';
import React, { FunctionComponent, useMemo, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { MappedCampaign } from '../types';
import { CalendarMapContainer } from './CalendarMapContainer';
import { defaultViewport } from './constants';
import { useMergedShapes, useShapes } from './hooks';
import { makeSelections } from './utils';

type Props = {
    isPdf?: boolean;
    loadingCampaigns: boolean;
    campaigns: MappedCampaign[];
};

export const CalendarMap: FunctionComponent<Props> = ({
    campaigns,
    loadingCampaigns,
    isPdf = false,
}) => {
    const [selection, setSelection] = useState<'all' | 'latest' | string>(
        'latest',
    );
    const options = useMemo(() => makeSelections(campaigns), [campaigns]);
    const {
        shapes: campaignsShapes,
        isLoadingShapes,
        roundsDict,
    } = useShapes(selection, campaigns, loadingCampaigns);
    console.log('campaignsShapes', campaignsShapes);
    const { mergedShapes, isLoadingMergedShapes } = useMergedShapes({
        campaigns,
        roundsDict,
        selection,
    });
    console.log('mergedShapes', mergedShapes);

    return (
        <Box position="relative">
            <MapContainer
                style={{
                    height: !isPdf ? '72vh' : '800px',
                }}
                center={defaultViewport.center}
                zoom={defaultViewport.zoom}
                scrollWheelZoom={false}
            >
                <TileLayer
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    position="bottomleft"
                />
                <CalendarMapContainer
                    campaignsShapes={campaignsShapes}
                    mergedShapes={mergedShapes}
                    loadingCampaigns={loadingCampaigns}
                    isLoadingShapes={isLoadingShapes}
                    isLoadingMergedShapes={isLoadingMergedShapes}
                    setSelection={setSelection}
                    selection={selection}
                    options={options}
                    campaigns={campaigns}
                />
            </MapContainer>
        </Box>
    );
};
