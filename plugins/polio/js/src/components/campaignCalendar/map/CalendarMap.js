import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { LoadingSpinner } from 'bluesquare-components';
import { FormattedMessage } from 'react-intl';
import { Box } from '@material-ui/core';
import { GeoJSON, Map, Pane, TileLayer, Tooltip } from 'react-leaflet';
import { useQueries } from 'react-query';
import { polioVacines } from '../../../constants/virus';

import { VaccinesLegend } from './VaccinesLegend';
import { CampaignsLegend } from './CampaignsLegend';
import MESSAGES from '../../../constants/messages';
import { useStyles } from '../Styles';

import 'leaflet/dist/leaflet.css';
import { getRequest } from '../../../../../../../hat/assets/js/apps/Iaso/libs/Api';

const CalendarMap = ({ campaigns, loadingCampaigns }) => {
    const classes = useStyles();
    const map = useRef();
    const shapesQueries = useQueries(
        campaigns
            .filter(c => Boolean(c.original.group?.id))
            .map(campaign => {
                const baseParams = {
                    asLocation: true,
                    limit: 3000,
                    group: campaign.original.group.id,
                    app_id: 'com.poliooutbreaks.app',
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
    const loadingShapes = shapesQueries.some(q => q.isLoading);
    const campaignsShapes = shapesQueries
        .filter(sq => sq.data)
        .map(sq => sq.data);

    return (
        <Box position="relative">
            {(loadingCampaigns || loadingShapes) && <LoadingSpinner absolute />}
            <div className={classes.mapLegend}>
                <CampaignsLegend campaigns={campaignsShapes} />
                <Box display="flex" justifyContent="flex-end">
                    <VaccinesLegend />
                </Box>
            </div>
            <Map
                ref={map}
                style={{ height: 900 }}
                center={[1, 20]}
                zoom={4}
                scrollWheelZoom={false}
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
                                    style={() => {
                                        return {
                                            color: cs.campaign.color,
                                            opacity: 0.6,
                                            fillOpacity: 0.6,
                                            fillColor: cs.vacine?.color,
                                            weight: '2',
                                        };
                                    }}
                                >
                                    <Tooltip>
                                        <div>
                                            <FormattedMessage
                                                {...MESSAGES.country}
                                            />
                                            {`: ${cs.campaign.country}`}
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
