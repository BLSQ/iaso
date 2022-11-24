import React, { useRef, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { LoadingSpinner } from 'bluesquare-components';
import { Box } from '@material-ui/core';
import { Map, TileLayer } from 'react-leaflet';
import { MapRoundSelector } from './MapRoundSelector.tsx';
import { VaccinesLegend } from './VaccinesLegend';
import { CampaignsLegend } from './CampaignsLegend';
import { useStyles } from '../Styles';
import { useMergedShapes, useShapes } from './hooks.ts';
import { makeSelections } from './utils.ts';
import 'leaflet/dist/leaflet.css';
import { CalendarMapPanesRegular } from './CalendarMapPanesRegular.tsx';
import { CalendarMapPanesMerged } from './CalendarMapPanesMerged.tsx';
import { defaultViewport, boundariesZoomLimit } from './constants.ts';

const CalendarMap = ({ campaigns, loadingCampaigns, isPdf }) => {
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
                    iconProps={{ selection }}
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
            <Map
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
            </Map>
        </Box>
    );
};

CalendarMap.defaultProps = {
    isPdf: false,
};

CalendarMap.propTypes = {
    campaigns: PropTypes.array.isRequired,
    loadingCampaigns: PropTypes.bool.isRequired,
    isPdf: PropTypes.bool,
};

export { CalendarMap };
