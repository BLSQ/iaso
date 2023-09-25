/* eslint-disable camelcase */
/* eslint-disable react/require-default-props */
import { Box, Grid, makeStyles, Typography } from '@material-ui/core';
import React, { FunctionComponent } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../../constants/messages';
import { findScopeIds } from '../../../utils';

type Props = {
    campaign?: string;
    data: Record<string, { hasScope: boolean; districtsNotFound: string[] }>;
    campaigns?: any;
    round?: number;
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
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const { districtsNotFound } = data[campaign] ?? {};
    const scopeIds = findScopeIds(campaign, campaigns, round);
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
