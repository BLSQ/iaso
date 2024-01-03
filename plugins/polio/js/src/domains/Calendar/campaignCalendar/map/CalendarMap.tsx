import React, { useState, useMemo, FunctionComponent } from 'react';
import { Box } from '@mui/material';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useMergedShapes, useShapes } from './hooks';
import { makeSelections } from './utils';
import 'leaflet/dist/leaflet.css';
import { MappedCampaign } from '../types';
import { CalendarMapContainer } from './CalendarMapContainer';
import { defaultViewport } from './constants';

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

    const { mergedShapes, isLoadingMergedShapes } = useMergedShapes({
        campaigns,
        roundsDict,
        selection,
    });

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
                    // @ts-ignore TODO: fix this type problem
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
