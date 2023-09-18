import React, { FunctionComponent } from 'react';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useSafeIntl, commonStyles } from 'bluesquare-components';

import TopBar from '../../components/nav/TopBarComponent';

import MESSAGES from './messages';
import { StocksParams } from './types/stocks';
import { useGetStocksMouvements } from './hooks/useGetStocksMouvements';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Props = {
    params: StocksParams;
};

export const Stocks: FunctionComponent<Props> = ({ params }) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { data, isFetching } = useGetStocksMouvements(params);
    console.log('data', data);
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
