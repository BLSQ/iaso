import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { LoadingSpinner } from 'bluesquare-components';
import { Box } from '@material-ui/core';
import { Map, TileLayer } from 'react-leaflet';
import { useQueries } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { polioVacines } from '../../../constants/virus';
import { useGetMergedCampaignShapes } from '../../../hooks/useGetMergedCampaignShapes.ts';

import { VaccinesLegend } from './VaccinesLegend';
import { CampaignsLegend } from './CampaignsLegend';
import { appId } from '../../../constants/app';
import { useStyles } from '../Styles';

import 'leaflet/dist/leaflet.css';
import { CalendarMapPanesRegular } from './CalendarMapPanesRegular.tsx';
import { CalendarMapPanesMerged } from './CalendarMapPanesMerged.tsx';
import { defaultViewport, boundariesZoomLimit } from './constants.ts';

const CalendarMap = ({ campaigns, loadingCampaigns }) => {
    const classes = useStyles();
    const [viewport, setViewPort] = useState(defaultViewport);
    const map = useRef();
    const shapesQueries = useQueries(
        campaigns
            .filter(c => Boolean(c.original.group?.id))
            .map(campaign => {
                const baseParams = {
                    asLocation: true,
                    limit: 3000,
                    group: campaign.original.group.id,
                    app_id: appId,
                };

                const queryString = new URLSearchParams(baseParams);
                return {
                    queryKey: ['campaignShape', baseParams],
                    queryFn: () =>
                        getRequest(`/api/orgunits/?${queryString.toString()}`),
                    select: data => ({
                        campaign,
                        vacine: polioVacines.find(
                            v => v.value === campaign.original.vacine,
                        ),
                        shapes: data,
                    }),
                    enabled: !loadingCampaigns,
                };
            }),
    );

    const regionsQueries = useQueries(
        campaigns
            .filter(c => Boolean(c.original.group?.id))
            .map(campaign => {
                const baseParams = {
                    order: 'id',
                    page: 1,
                    limit: 1000,
                    // eslint-disable-next-line max-len
                    searches: `[{"validation_status":"all","color":"f4511e","source":2,"levels":${campaign.country_id.toString()},"orgUnitTypeId":"6","orgUnitParentId":${campaign.country_id.toString()},"dateFrom":null,"dateTo":null}]`,
                };
                const queryString = new URLSearchParams(baseParams);
                return {
                    queryKey: ['campaignRegion', baseParams],
                    queryFn: () =>
                        getRequest(`/api/orgunits/?${queryString.toString()}`),
                    select: data => {
                        return data.orgunits.map(orgUnit => ({
                            id: orgUnit.id,
                            name: orgUnit.name,
                        }));
                    },
                    enabled: !loadingCampaigns,
                };
            }),
    );
    const { data: mergedShapes } = useGetMergedCampaignShapes({}).query;

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
        shapesQueries.some(q => q.isLoading) ||
        regionsQueries.some(q => q.isLoading);

    const campaignsShapes = shapesQueries
        .filter(sq => sq.data)
        .map(sq => sq.data);

    const regions = regionsQueries
        .filter(sq => sq.data)
        .map(sq => sq.data)
        .flat();
    return (
        <Box position="relative">
            {(loadingCampaigns || loadingShapes) && <LoadingSpinner absolute />}
            <div className={classes.mapLegend}>
                {viewport.zoom > boundariesZoomLimit && (
                    <CampaignsLegend campaigns={campaignsShapes} />
                )}
                <Box display="flex" justifyContent="flex-end">
                    <VaccinesLegend />
                </Box>
            </div>
            <Map
                zoomSnap={0.25}
                ref={map}
                style={{ height: '72vh' }}
                center={defaultViewport.center}
                zoom={defaultViewport.zoom}
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
                        regions={regions}
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

CalendarMap.propTypes = {
    campaigns: PropTypes.array.isRequired,
    loadingCampaigns: PropTypes.bool.isRequired,
};

export { CalendarMap };
