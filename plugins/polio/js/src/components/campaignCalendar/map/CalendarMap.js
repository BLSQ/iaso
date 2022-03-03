import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { LoadingSpinner } from 'bluesquare-components';
import { FormattedMessage } from 'react-intl';
import { Box } from '@material-ui/core';
import { GeoJSON, Map, Pane, TileLayer, Tooltip } from 'react-leaflet';
import { useQueries } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { polioVacines } from '../../../constants/virus';

import { VaccinesLegend } from './VaccinesLegend';
import { CampaignsLegend } from './CampaignsLegend';
import MESSAGES from '../../../constants/messages';
import { appId } from '../../../constants/app';
import { useStyles, vaccineOpacity } from '../Styles';
import { findRegion } from '../../../utils';

import 'leaflet/dist/leaflet.css';

const defaultViewport = {
    center: [1, 20],
    zoom: 3.25,
};
const boundariesZoomLimit = 6;

const getGeoJsonStyle = (cs, viewport) => {
    return {
        color: cs.campaign.color,
        fillOpacity: vaccineOpacity,
        fillColor: cs.vacine?.color,
        weight: viewport.zoom > boundariesZoomLimit ? 2 : 0,
    };
};

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
                {campaignsShapes.map(cs => {
                    return (
                        <Pane
                            name={`campaign-${cs.campaign.id}`}
                            key={cs.campaign.id}
                        >
                            {cs.shapes.map(shape => (
                                <GeoJSON
                                    key={shape.id}
                                    data={shape.geo_json}
                                    style={() => getGeoJsonStyle(cs, viewport)}
                                >
                                    <Tooltip>
                                        <div>
                                            <FormattedMessage
                                                {...MESSAGES.campaign}
                                            />
                                            {`: ${cs.campaign.name}`}
                                        </div>
                                        <div>
                                            <FormattedMessage
                                                {...MESSAGES.country}
                                            />
                                            {`: ${cs.campaign.country}`}
                                        </div>
                                        <div>
                                            <FormattedMessage
                                                {...MESSAGES.region}
                                            />
                                            {`: ${findRegion(shape, regions)}`}
                                        </div>
                                        <div>
                                            <FormattedMessage
                                                {...MESSAGES.district}
                                            />
                                            {`: ${shape.name}`}
                                        </div>
                                        <div>
                                            <FormattedMessage
                                                {...MESSAGES.vaccine}
                                            />
                                            {`: ${cs.vacine?.label}`}
                                        </div>
                                    </Tooltip>
                                </GeoJSON>
                            ))}
                        </Pane>
                    );
                })}
            </Map>
        </Box>
    );
};

CalendarMap.propTypes = {
    campaigns: PropTypes.array.isRequired,
    loadingCampaigns: PropTypes.bool.isRequired,
};

export { CalendarMap };
