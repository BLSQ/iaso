import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@material-ui/core/styles';
import { LoadingSpinner } from 'bluesquare-components';
import { Box } from '@material-ui/core';
import green from '@material-ui/core/colors/green';
import pink from '@material-ui/core/colors/pink';

import { sendRequest } from '../../utils/networking';
import { MapComponent } from './MapComponent';

const CalendarMap = ({ campaigns, loadingCampaigns }) => {
    const [loadingShapes, setLoadingShapes] = useState(true);
    const theme = useTheme();
    const [shapes, setShapes] = useState([]);

    useEffect(() => {
        if (!loadingCampaigns) {
            setLoadingShapes(true);
            const promisesArray = [];
            campaigns.forEach(campaign => {
                const groupId = campaign.original.group?.id;
                if (groupId) {
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
                }
            });
            Promise.all(promisesArray).then(newShapesArrays => {
                setLoadingShapes(false);
                let allShapes = [];
                newShapesArrays.forEach(newShapes => {
                    allShapes = allShapes.concat(newShapes);
                });
                setShapes(allShapes);
            });
        }
    }, [campaigns, loadingCampaigns]);
    return (
        <Box position="relative">
            {(loadingCampaigns || loadingShapes) && <LoadingSpinner absolute />}
            <MapComponent
                name="calendarMap"
                mainLayer={shapes}
                height={900}
                fitToBounds={false}
                getMainLayerStyle={() => ({
                    color: green['500'],
                    opacity: 0.8,
                    fillOpacity: 0.8,
                    fillColor: green['500'],
                    weight: '2',
                })}
                tooltipLabels={{ main: 'District' }}
            />
        </Box>
    );
};

CalendarMap.propTypes = {
    campaigns: PropTypes.array.isRequired,
    loadingCampaigns: PropTypes.bool.isRequired,
};

export { CalendarMap };
