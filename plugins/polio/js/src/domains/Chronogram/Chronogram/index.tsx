import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';

import { useSafeIntl } from 'bluesquare-components';

import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { useParamsObject } from '../../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject';
import { baseUrls } from '../../../constants/urls';

import { useStyles } from '../../../styles/theme';
import { defaultParams } from '../constants';
import { ChronogramFilters } from './Filters/ChronogramFilters';
import MESSAGES from './messages';
import { ChronogramTable } from './Table/ChronogramTable';
import { ChronogramParams } from './types';

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
