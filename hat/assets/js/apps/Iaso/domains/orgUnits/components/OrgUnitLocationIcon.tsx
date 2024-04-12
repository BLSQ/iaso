import LocationDisabledIcon from '@mui/icons-material/LocationDisabled';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Box, Tooltip } from '@mui/material';
import React, { FunctionComponent } from 'react';
import { defineMessages } from 'react-intl';

import { useSafeIntl } from 'bluesquare-components';

import ShapeSvg from '../../../components/svg/ShapeSvgComponent';

import { SxStyles } from '../../../types/general';
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
const styles: SxStyles = {
    locationIcon: {
        display: 'flex',
        justifyContent: 'center',
        mt: '4px',
        ml: '-6px',
    },
};
export const OrgUnitLocationIcon: FunctionComponent<Props> = ({ orgUnit }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <>
            {orgUnit.has_geo_json && (
                <Tooltip arrow title={formatMessage(MESSAGES.withShape)}>
                    <Box sx={styles.locationIcon}>
                        <ShapeSvg fontSize="small" />
                    </Box>
                </Tooltip>
            )}
            {orgUnit.latitude && orgUnit.longitude && (
                <Tooltip arrow title={formatMessage(MESSAGES.withLocation)}>
                    <Box sx={styles.locationIcon}>
                        <LocationOnIcon fontSize="small" />
                    </Box>
                </Tooltip>
            )}
            {!orgUnit.latitude && !orgUnit.longitude && !orgUnit.has_geo_json && (
                <Tooltip
                    arrow
                    title={formatMessage(MESSAGES.noGeographicalData)}
                >
                    <Box sx={styles.locationIcon}>
                        <LocationDisabledIcon fontSize="small" />
                    </Box>
                </Tooltip>
            )}
        </>
    );
};
