import React, { FunctionComponent } from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useSafeIntl, commonStyles } from 'bluesquare-components';

import TopBar from '../../components/nav/TopBarComponent';

import MESSAGES from './messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Params = {
    accountId: 'string';
    orgUnitId: 'string';
    item: 'string';
};

type Props = {
    params: Params;
};

export const Stocks: FunctionComponent<Props> = ({ params }) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                STOCKS PAGE
            </Box>
        </>
    );
};
