import React, { FunctionComponent } from 'react';
import { useSafeIntl, commonStyles } from 'bluesquare-components';
import { Box, Grid, makeStyles } from '@material-ui/core';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';

import { useGoBack } from '../../routing/useGoBack';
import { baseUrls } from '../../constants/urls';

import WidgetPaper from '../../components/papers/WidgetPaperComponent';

type Params = {
    accountId: string;
    registryId: string;
};

type Router = {
    goBack: () => void;
    params: Params;
};
type Props = {
    router: Router;
};

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

export const Details: FunctionComponent<Props> = ({ router }) => {
    const { params } = router;
    const classes: Record<string, string> = useStyles();
    const { registryId, accountId } = params;
    const { formatMessage } = useSafeIntl();
    const goBack = useGoBack(router, baseUrls.registry, { accountId });

    return (
        <>
            <TopBar title="TITLE" displayBackButton goBack={() => goBack()} />
            <Box className={`${classes.containerFullHeightNoTabPadded}`}>
                <Grid container spacing={2}>
                    <Grid container item xs={4}>
                        <WidgetPaper
                            className={classes.infoPaper}
                            title={formatMessage(MESSAGES.selectedOrgUnit)}
                        >
                            BLABLA
                            {registryId}
                        </WidgetPaper>
                    </Grid>
                </Grid>
            </Box>
        </>
    );
};
