import React, { FunctionComponent } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../../../constants/messages';
import { findScopeIds } from '../../../../utils';
import { LqasImDebugData } from '../../types';

type Props = {
    campaign?: string;
    data: LqasImDebugData;
    campaigns?: any;
    round?: number;
    scopeIds?: number[];
};

const style = theme => ({
    paper: {
        marginBottom: theme.spacing(1),
        marginTop: theme.spacing(1),
        paddingTop: '5px',
        paddingBottom: '5px',
    },
    centerText: { textAlign: 'center' },
    justifyCenter: { justifyContent: 'center' },
    boldText: { fontWeight: 'bold' },
    alignTextLeft: { textAlign: 'left' },
});
// @ts-ignore
const useStyles = makeStyles(style);

export const ScopeAndDNFDisclaimer: FunctionComponent<Props> = ({
    campaign = '',
    data,
    campaigns,
    round,
    scopeIds: scopeIdsProp,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const { districtsNotFound } = data[campaign] ?? {};
    const scopeIds = scopeIdsProp ?? findScopeIds(campaign, campaigns, round);
    const hasScope = scopeIds.length > 0;
    const allDistrictsFound = districtsNotFound?.length === 0;
    return (
        <Grid container direction="column" className={classes.centerText}>
            {hasScope === false && (
                <Grid container item direction="column">
                    <Grid item>
                        <Box mt={2}>
                            <Typography
                                variant="h6"
                                className={classes.boldText}
                            >
                                {formatMessage(MESSAGES.noScope)}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item>
                        <Box mb={allDistrictsFound ? 4 : 0}>
                            <Typography variant="body1">
                                {formatMessage(MESSAGES.noScopeFound)}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            )}
            {districtsNotFound !== undefined && !allDistrictsFound && (
                <Grid container item className={classes.justifyCenter}>
                    {' '}
                    <Grid item>
                        <Box mt={2}>
                            <Typography
                                variant="h6"
                                className={classes.boldText}
                            >
                                {formatMessage(MESSAGES.districtsNotFound)}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item>
                        <Box mb={2} ml={2} mr={2}>
                            <Typography
                                variant="body1"
                                className={classes.alignTextLeft}
                            >
                                {formatMessage(MESSAGES.districtsNeedMatching)}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            )}
        </Grid>
    );
};
