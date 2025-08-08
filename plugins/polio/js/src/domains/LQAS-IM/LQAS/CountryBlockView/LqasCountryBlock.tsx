import React, { FunctionComponent } from 'react';
import { LqasTabValue } from '../../types';
import { NumberAsString } from '../../../../constants/types';
import { baseUrls } from '../../../../constants/urls';
import { useParamsObject } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject';
import { useSafeIntl } from 'bluesquare-components';
import { useStyles } from '../../shared/hooks/useStyles';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { Box, Grid } from '@mui/material';
import MESSAGES from '../../../../constants/messages';
import { LqasCountryBlockView } from './lqasCountryBlockView';

export type LqasCountryBlockParams = {
    leftCountryBlock?: NumberAsString;
    leftMonth?: NumberAsString;
    leftYear?: NumberAsString;
    leftTab?: LqasTabValue;
    rightCountryBlock?: NumberAsString;
    rightMonth?: NumberAsString;
    rightYear?: NumberAsString;
    rightTab?: LqasTabValue;
    accountId?: string;
};

const baseUrl = baseUrls.lqasCountryBlock;

export const LqasCountryBlock: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const params = useParamsObject(baseUrl) as LqasCountryBlockParams;
    const {
        leftCountryBlock,
        leftMonth,
        leftYear,
        rightCountryBlock,
        rightMonth,
        rightYear,
        leftTab,
        rightTab,
    } = params;

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.lqas)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Grid container spacing={2} direction="row">
                    <Grid item xs={6} key={`left-$-${leftMonth}-${leftTab}`}>
                        <LqasCountryBlockView side="left" params={params} />
                    </Grid>
                    <Grid item xs={6} key={`right-$-${rightMonth}-${rightTab}`}>
                        <LqasCountryBlockView side="right" params={params} />
                    </Grid>
                </Grid>
            </Box>
        </>
    );
};
