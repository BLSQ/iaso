import React, { useRef, useState, useMemo, FunctionComponent } from 'react';
// @ts-ignore
import { LoadingSpinner } from 'bluesquare-components';
import { Box } from '@material-ui/core';
import { MapContainer, TileLayer } from 'react-leaflet';
import { MapRoundSelector } from './MapRoundSelector';
import { VaccinesLegend } from './VaccinesLegend';
import { CampaignsLegend } from './CampaignsLegend';
import { useStyles } from '../Styles';
import { useMergedShapes, useShapes } from './hooks';
import { makeSelections } from './utils';
import 'leaflet/dist/leaflet.css';
import { CalendarMapPanesRegular } from './CalendarMapPanesRegular';
import { CalendarMapPanesMerged } from './CalendarMapPanesMerged';
import { defaultViewport, boundariesZoomLimit } from './constants';
import { MappedCampaign } from '../types';

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
    const classes = useStyles();
    const map = useRef();
    const [viewport, setViewPort] = useState(defaultViewport);
    const [selection, setSelection] = useState('latest');
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

    const loadingShapes =
        viewport.zoom <= 6 ? isLoadingMergedShapes : isLoadingShapes;
    return null;
    return (
        <Box position="relative">
            {(loadingCampaigns || loadingShapes) && <LoadingSpinner absolute />}
            <div className={classes.mapLegend}>
                <MapRoundSelector
                    selection={selection}
                    options={options}
                    onChange={value => {
                        setSelection(value);
                    }}
                    iconProps={{ selection, viewport }}
                />
                {viewport.zoom > boundariesZoomLimit && (
                    <Box mt={2}>
                        <CampaignsLegend campaigns={campaigns} />
                    </Box>
                )}
                <Box display="flex" justifyContent="flex-end">
                    <VaccinesLegend />
                </Box>
            </div>
            <MapContainer
                zoomSnap={0.25}
                ref={map}
                style={{
                    height: !isPdf ? '72vh' : '800px',
                }}
                center={viewport.center}
                zoom={viewport.zoom}
                scrollWheelZoom={false}
                onViewportChanged={v => setViewPort(v)}
            >
                <TileLayer
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    position="bottomleft"
                />
                {viewport.zoom > 6 && (
                    <CalendarMapPanesRegular
                        campaignsShapes={campaignsShapes}
                        viewport={viewport}
                    />
                )}
                {viewport.zoom <= 6 && (
                    <CalendarMapPanesMerged
                        mergedShapes={mergedShapes}
                        viewport={viewport}
                    />
                )}
            </MapContainer>
        </Box>
    );
};
