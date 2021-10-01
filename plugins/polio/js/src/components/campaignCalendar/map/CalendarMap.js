import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { LoadingSpinner } from 'bluesquare-components';
import { FormattedMessage } from 'react-intl';
import { Box } from '@material-ui/core';
import { Map, TileLayer, GeoJSON, Tooltip, Pane } from 'react-leaflet';
import { polioVacines } from '../../../constants/virus';

import { sendRequest } from '../../../utils/networking';

import { VaccinesLegend } from './VaccinesLegend';
import { CampaignsLegend } from './CampaignsLegend';
import MESSAGES from '../../../constants/messages';
import { useStyles } from '../Styles';

import 'leaflet/dist/leaflet.css';

const CalendarMap = ({ campaigns, loadingCampaigns }) => {
    const classes = useStyles();
    const [loadingShapes, setLoadingShapes] = useState(true);
    const [campaignsShapes, setCampaignsShapes] = useState([]);
    const map = useRef();
    useEffect(() => {
        if (!loadingCampaigns) {
            const displayedCampaigns = [...campaigns].filter(c =>
                Boolean(c.original.group?.id),
            );
            setLoadingShapes(true);
            const promisesArray = [];
            displayedCampaigns.forEach(campaign => {
                const groupId = campaign.original.group?.id;
                const baseParams = {
                    defaultVersion: true,
                    validation_status: 'all',
                    asLocation: true,
                    limit: 3000,
                    order: 'id',
                    orgUnitParentId: campaign.country_id,
                    orgUnitTypeCategory: 'DISTRICT',
                    group: groupId,
                };

                const queryString = new URLSearchParams(baseParams);
                promisesArray.push(
                    sendRequest(
                        'GET',
                        `/api/orgunits/?${queryString.toString()}`,
                    ),
                );
            });
            Promise.all(promisesArray).then(newShapesArrays => {
                setLoadingShapes(false);
                const newCampaingsShapes = [];
                newShapesArrays.forEach((newShapes, index) => {
                    if (newShapes.length > 0) {
                        newCampaingsShapes.push({
                            campaign: {
                                ...displayedCampaigns[index],
                            },
                            shapes: newShapes,
                        });
                    }
                });
                setCampaignsShapes(newCampaingsShapes);
            });
        }
    }, [campaigns, loadingCampaigns]);
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
                    const vacine = polioVacines.find(
                        v => v.value === cs.campaign.original.vacine,
                    );
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
                                            fillColor: vacine?.color,
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
                                            {`: ${vacine?.label}`}
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
