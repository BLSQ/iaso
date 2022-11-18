import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { LoadingSpinner } from 'bluesquare-components';
import { Box } from '@material-ui/core';
import { Map, TileLayer } from 'react-leaflet';
import { useQueries } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useGetMergedCampaignShapes } from '../../../hooks/useGetMergedCampaignShapes.ts';

import { VaccinesLegend } from './VaccinesLegend';
import { CampaignsLegend } from './CampaignsLegend';
import { appId } from '../../../constants/app';
import { useStyles } from '../Styles';

import 'leaflet/dist/leaflet.css';
import { CalendarMapPanesRegular } from './CalendarMapPanesRegular.tsx';
import { CalendarMapPanesMerged } from './CalendarMapPanesMerged.tsx';
import { defaultViewport, boundariesZoomLimit } from './constants.ts';
import { polioVaccines } from '../../../constants/virus.ts';

const getShapeQuery = (loadingCampaigns, groupId, campaign, vaccine, round) => {
    const baseParams = {
        asLocation: true,
        limit: 3000,
        group: groupId,
        app_id: appId,
    };
    const queryString = new URLSearchParams(baseParams);
    return {
        queryKey: ['campaignShape', baseParams],
        queryFn: () => getRequest(`/api/orgunits/?${queryString.toString()}`),
        select: data => ({
            campaign,
            shapes: data,
            vaccine,
            color: polioVaccines.find(v => v.value === vaccine)?.color,
            round,
        }),
        enabled: !loadingCampaigns,
    };
};

const makeSelections = campaigns => {
    let maxRound = null;
    let showRoundZero = false;
    campaigns.forEach(campaign => {
        const lastRound = campaign.rounds[campaign.rounds.length - 1];
        const { number } = lastRound ?? {};
        if (
            Number.isInteger(number) &&
            (!maxRound || (maxRound && number > maxRound))
        ) {
            maxRound = number;
        }

        if (number === 0) {
            showRoundZero = true;
        }
    });
    // TODO translate
    const selections = [
        { value: 'all', label: 'All' },
        { value: 'latest', label: 'Latest' },
    ];
    if (showRoundZero) {
        selections.push({ value: 0, label: `Round 0}` });
    }
    for (let i = 1; i <= maxRound; i += 1) {
        selections.push({ value: i, label: `Round ${i}` });
    }
    return selections;
};

const makeQueriesForCampaigns = (campaigns, loadingCampaigns) => {
    const queries = [];
    if (!campaigns) return queries;
    campaigns.forEach(campaign => {
        if (campaign.separateScopesPerRound) {
            campaign.rounds.forEach(round => {
                round.scopes.forEach(scope => {
                    queries.push(
                        getShapeQuery(
                            loadingCampaigns,
                            scope.group.id,
                            campaign,
                            scope.vaccine,
                            round,
                        ),
                    );
                });
            });
        } else {
            campaign.scopes.forEach(scope => {
                queries.push(
                    getShapeQuery(
                        loadingCampaigns,
                        scope.group.id,
                        campaign,
                        scope.vaccine,
                    ),
                );
            });
        }
    });
    return queries;
};

const useRoundsQueries = (selection, campaigns, loadingCampaigns) => {
    const [queries, setQueries] = useState([]);

    useEffect(() => {
        if (selection === 'all') {
            setQueries(makeQueriesForCampaigns(campaigns, loadingCampaigns));
        } else if (selection === 'latest') {
            // This is where the hard computation takes place
        } else if (selection.includes('Round')) {
            const campaignsCopy = [...campaigns];
            const roundNumber = parseInt(selection.split('Round')[1], 10);
            campaigns.forEach((c, i) => {
                campaignsCopy[i].rounds = campaignsCopy[i].rounds.filter(
                    r => r.number === roundNumber,
                );
            });
            setQueries(
                makeQueriesForCampaigns(campaignsCopy, loadingCampaigns),
            );
        }
    }, [selection, campaigns, loadingCampaigns]);

    return queries;
};

const CalendarMap = ({ campaigns, loadingCampaigns, isPdf, currentDate }) => {
    const classes = useStyles();
    const [viewport, setViewPort] = useState(defaultViewport);
    const map = useRef();
    const [selection, setSelection] = useState('Round 1');
    const queries = useRoundsQueries(selection, campaigns, loadingCampaigns);
    // const queries = [];
    // campaigns.forEach(campaign => {
    //     if (campaign.separateScopesPerRound) {
    //         campaign.rounds.forEach(round => {
    //             round.scopes.forEach(scope => {
    //                 queries.push(
    //                     getShapeQuery(
    //                         loadingCampaigns,
    //                         scope.group.id,
    //                         campaign,
    //                         scope.vaccine,
    //                         round,
    //                     ),
    //                 );
    //             });
    //         });
    //     } else {
    //         campaign.scopes.forEach(scope => {
    //             queries.push(
    //                 getShapeQuery(
    //                     loadingCampaigns,
    //                     scope.group.id,
    //                     campaign,
    //                     scope.vaccine,
    //                 ),
    //             );
    //         });
    //     }
    // });
    const shapesQueries = useQueries(queries);

    const { data: mergedShapes, isLoading: isLoadingMergedShapes } =
        useGetMergedCampaignShapes().query;

    const campaignColors = {};

    campaigns.forEach(campaign => {
        campaignColors[campaign.id] = campaign.color;
    });
    const campaignIds = campaigns.map(campaign => campaign.id);

    const mergedShapesToDisplay = mergedShapes?.features
        .filter(shape => campaignIds.includes(shape.properties.id))
        .map(shape => {
            return { ...shape, color: campaignColors[shape.properties.id] };
        });

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
                {viewport.zoom > boundariesZoomLimit && (
                    <CampaignsLegend campaigns={campaigns} />
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
