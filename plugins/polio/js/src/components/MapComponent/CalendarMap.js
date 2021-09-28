import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@material-ui/core/styles';
import { LoadingSpinner } from 'bluesquare-components';
import { Box } from '@material-ui/core';

import { MapComponent } from './MapComponent';
import { getRequest } from '../../../../../../hat/assets/js/apps/Iaso/libs/Api';

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
                        getRequest(`/api/orgunits/?${queryString.toString()}`),
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
                getMainLayerStyle={() => ({
                    color: theme.palette.secondary.main,
                    weight: '1',
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
