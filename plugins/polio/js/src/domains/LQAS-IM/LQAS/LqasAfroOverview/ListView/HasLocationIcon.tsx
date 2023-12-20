import React, { FunctionComponent } from 'react';
import { defineMessages } from 'react-intl';
import { Tooltip, Box } from '@mui/material';
import LocationDisabledIcon from '@mui/icons-material/LocationDisabled';

import { useSafeIntl } from 'bluesquare-components';
import ShapeSvg from '../../../../../../../../../hat/assets/js/apps/Iaso/components/svg/ShapeSvgComponent';
import { Shape } from '../../../../../constants/types';

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
type Props = { shape: Shape };

export const HasLocationIcon: FunctionComponent<Props> = ({ shape }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <>
            {(shape?.geo_json || shape?.has_geo_json) && (
                <Tooltip arrow title={formatMessage(MESSAGES.withShape)}>
                    <Box mt="4px">
                        <ShapeSvg fontSize="small" />
                    </Box>
                </Tooltip>
            )}
            {!shape?.geo_json && !shape?.has_geo_json && (
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
