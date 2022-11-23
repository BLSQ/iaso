import React, { useRef, useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { LoadingSpinner } from 'bluesquare-components';
import { Box } from '@material-ui/core';
import { Map, TileLayer } from 'react-leaflet';
import { useQueries } from 'react-query';

import moment from 'moment';
import { useGetMergedCampaignShapes } from '../../../hooks/useGetMergedCampaignShapes.ts';
import { MapRoundSelector } from './MapRoundSelector.tsx';
import { VaccinesLegend } from './VaccinesLegend';
import { CampaignsLegend } from './CampaignsLegend';
import { useStyles } from '../Styles';
import {
    useRoundSelection,
    useRoundsQueries,
    useMergedShapes,
} from './hooks.ts';
import { makeSelections } from './utils.ts';
import 'leaflet/dist/leaflet.css';
import { CalendarMapPanesRegular } from './CalendarMapPanesRegular.tsx';
import { CalendarMapPanesMerged } from './CalendarMapPanesMerged.tsx';
import { defaultViewport, boundariesZoomLimit } from './constants.ts';

const CalendarMap = ({ campaigns, loadingCampaigns, isPdf }) => {
    const classes = useStyles();
    const [viewport, setViewPort] = useState(defaultViewport);
    const map = useRef();
    const [selection, setSelection] = useState('latest');

    // storing the date in a ref to avoid an infinite loop.
    const today = useRef(moment());
    const { campaigns: campaignsForMap, roundsDict } = useRoundSelection(
        selection,
        campaigns,
        today.current,
    );

    const firstAndLastRounds = useMemo(() => {
        const result = {};
        campaigns.forEach(campaign => {
            const lastRound =
                campaign.rounds[campaign.rounds.length - 1].number;
            // Getting the first round in case there's a round 0
            const firstRound = campaign.rounds[0].number;
            result[campaign.id] = { firstRound, lastRound };
        });
        return result;
    }, [campaigns]);

    const queries = useRoundsQueries(campaignsForMap, loadingCampaigns);

    const shapesQueries = useQueries(queries);

    const campaignsShapes = shapesQueries
        .filter(sq => sq.data)
        .map(sq => sq.data);

    const options = useMemo(() => makeSelections(campaigns), [campaigns]);

    const { mergedShapes, isLoadingMergedShapes } = useMergedShapes({
        campaigns,
        roundsDict,
        selection,
        firstAndLastRounds,
    });

    const loadingShapes =
        viewport.zoom <= 6
            ? isLoadingMergedShapes
            : shapesQueries.some(q => q.isLoading);

    return (
        <Box position="relative">
            {(loadingCampaigns || loadingShapes) && <LoadingSpinner absolute />}
            <div className={classes.mapLegend}>
                <MapRoundSelector
                    selection={selection}
                    options={options}
                    onChange={(_, value) => {
                        setSelection(value);
                    }}
                    label="Show round"
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
