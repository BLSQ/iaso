import React, { useRef, useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { LoadingSpinner } from 'bluesquare-components';
import { Box } from '@material-ui/core';
import { Map, TileLayer } from 'react-leaflet';
import { useQueries } from 'react-query';

import { useGetMergedCampaignShapes } from '../../../hooks/useGetMergedCampaignShapes.ts';
import { MapRoundSelector } from './MapRoundSelector.tsx';
import { VaccinesLegend } from './VaccinesLegend';
import { CampaignsLegend } from './CampaignsLegend';

import { useStyles } from '../Styles';
import { useRoundSelection, useRoundsQueries } from './hooks.ts';
import { makeSelections } from './utils.ts';
import 'leaflet/dist/leaflet.css';
import { CalendarMapPanesRegular } from './CalendarMapPanesRegular.tsx';
import { CalendarMapPanesMerged } from './CalendarMapPanesMerged.tsx';
import { defaultViewport, boundariesZoomLimit } from './constants.ts';

// CurrentDate should be today, for map purposes
const CalendarMap = ({ campaigns, loadingCampaigns, isPdf, currentDate }) => {
    const classes = useStyles();
    const [viewport, setViewPort] = useState(defaultViewport);
    const map = useRef();
    const [selection, setSelection] = useState('latest');
    const { campaigns: campaignsForMap, roundsDict } = useRoundSelection(
        selection,
        campaigns,
        currentDate,
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

    const options = useMemo(() => makeSelections(campaigns), [campaigns]);

    const shapesQueries = useQueries(queries);

    const { data: mergedShapes, isLoading: isLoadingMergedShapes } =
        useGetMergedCampaignShapes().query;

    const campaignColors = useMemo(() => {
        const color = {};
        campaigns.forEach(campaign => {
            color[campaign.id] = campaign.color;
        });
        return color;
    }, [campaigns]);

    const campaignIds = useMemo(
        () => campaigns.map(campaign => campaign.id),
        [campaigns],
    );

    const addShapeColor = useCallback(
        shape => {
            return { ...shape, color: campaignColors[shape.properties.id] };
        },
        [campaignColors],
    );

    const mergedShapesToDisplay = useMemo(() => {
        const shapesForSelectedCampaign = mergedShapes?.features.filter(shape =>
            campaignIds.includes(shape.properties.id),
        );
        if (selection === 'all') {
            return shapesForSelectedCampaign?.map(addShapeColor);
        }

        // This will only work if there are separate scopes per round
        if (selection === 'latest') {
            return shapesForSelectedCampaign
                ?.filter(shape => {
                    return (
                        `${shape.properties.round_number}` ===
                            roundsDict[shape.properties.id] ||
                        !shape.properties.round_number
                    );
                })
                .map(addShapeColor);
        }
        // This will only work if there are separate scopes per round
        return shapesForSelectedCampaign
            ?.filter(shape => {
                if (shape.properties.round_number) {
                    return `${shape.properties.round_number}` === selection;
                }
                if (firstAndLastRounds[shape.properties.id]) {
                    return (
                        firstAndLastRounds[shape.properties.id].firstRound <=
                            parseInt(selection, 10) &&
                        parseInt(selection, 10) <=
                            firstAndLastRounds[shape.properties.id].lastRound
                    );
                }
                return false;
            })
            .map(addShapeColor);
    }, [
        addShapeColor,
        campaignIds,
        firstAndLastRounds,
        mergedShapes?.features,
        roundsDict,
        selection,
    ]);

    const loadingShapes =
        viewport.zoom <= 6
            ? isLoadingMergedShapes
            : shapesQueries.some(q => q.isLoading);

    const campaignsShapes = shapesQueries
        .filter(sq => sq.data)
        .map(sq => sq.data);

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
                        mergedShapes={mergedShapesToDisplay}
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
