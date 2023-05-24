import React, { FunctionComponent } from 'react';
import { defineMessages } from 'react-intl';
import { Tooltip, Box } from '@material-ui/core';
import LocationOnIcon from '@material-ui/icons/LocationOn';
import LocationDisabledIcon from '@material-ui/icons/LocationDisabled';

import { useSafeIntl } from 'bluesquare-components';

import ShapeSvg from '../../../components/svg/ShapeSvgComponent';

import { OrgUnit } from '../types/orgUnit';

const MESSAGES = defineMessages({
    withShape: {
        defaultMessage: 'With territory',
        id: 'iaso.registry.withShape',
    },
    withLocation: {
        defaultMessage: 'With point',
        id: 'iaso.registry.withLocation',
    },
    noGeographicalData: {
        defaultMessage: 'Without geography',
        id: 'iaso.label.noGeographicalData',
    },
});
type Props = { orgUnit: OrgUnit };

export const OrgUnitLocationIcon: FunctionComponent<Props> = ({ orgUnit }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <>
            {orgUnit.has_geo_json && (
                <Tooltip arrow title={formatMessage(MESSAGES.withShape)}>
                    <Box mt="4px">
                        <ShapeSvg fontSize="small" />
                    </Box>
                </Tooltip>
            )}
            {orgUnit.latitude && orgUnit.longitude && (
                <Tooltip arrow title={formatMessage(MESSAGES.withLocation)}>
                    <Box mt="4px">
                        <LocationOnIcon fontSize="small" />
                    </Box>
                </Tooltip>
            )}
            {!orgUnit.latitude && !orgUnit.longitude && !orgUnit.has_geo_json && (
                <Tooltip
                    arrow
                    title={formatMessage(MESSAGES.noGeographicalData)}
                >
                    <Box mt="4px">
                        <LocationDisabledIcon fontSize="small" />
                    </Box>
                </Tooltip>
            )}
        </>
    );
};
