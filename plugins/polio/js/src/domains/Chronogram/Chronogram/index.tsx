import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';

import { useSafeIntl } from 'bluesquare-components';

import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { baseUrls } from '../../../constants/urls';
import { useParamsObject } from '../../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject';

import MESSAGES from './messages';
import { ChronogramFilters } from './Filters/ChronogramFilters';
import { ChronogramParams } from './types';
import { ChronogramTable } from './Table/ChronogramTable';
import { defaultParams } from '../constants';
import { useStyles } from '../../../styles/theme';

export const Chronogram: FunctionComponent = () => {
    const params = useParamsObject(baseUrls.chronogram) as ChronogramParams;

    const paramsNew: ChronogramParams = { ...defaultParams, ...params };

    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.chronogramTitle)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <ChronogramFilters params={paramsNew} />
                <ChronogramTable params={paramsNew} />
            </Box>
        </>
    );
};
