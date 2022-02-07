/* eslint-disable react/require-default-props */
import { Box, Grid, makeStyles, Paper, Typography } from '@material-ui/core';
import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../constants/messages';

type Props = {
    campaign?: string;
    data: Record<string, { hasScope: boolean; districtsNotFound: string[] }>;
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

const useStyles = makeStyles(style);

export const ScopeAndDNFDisclaimer: FunctionComponent<Props> = ({
    campaign = '',
    data,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const { hasScope, districtsNotFound } = data[campaign] ?? {};
    const allDistrictsFound = !districtsNotFound?.length;
    return (
        <>
            <Box>
                <Paper elevation={1} className={classes.paper}>
                    <Box>
                        <Grid
                            container
                            direction="column"
                            className={classes.centerText}
                        >
                            {!hasScope && (
                                <Grid container item direction="column">
                                    <Grid item>
                                        <Box mt={2}>
                                            <Typography
                                                variant="h6"
                                                className={classes.boldText}
                                            >
                                                {formatMessage(
                                                    MESSAGES.noScope,
                                                )}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item>
                                        <Box mb={allDistrictsFound ? 4 : 0}>
                                            <Typography variant="body1">
                                                {formatMessage(
                                                    MESSAGES.noScopeFound,
                                                )}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            )}
                            {!allDistrictsFound && (
                                <Grid
                                    container
                                    item
                                    className={classes.justifyCenter}
                                >
                                    {' '}
                                    <Grid item>
                                        <Box mt={2}>
                                            <Typography
                                                variant="h6"
                                                className={classes.boldText}
                                            >
                                                {formatMessage(
                                                    MESSAGES.districtsNotFound,
                                                )}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item>
                                        <Box mb={2} ml={2} mr={2}>
                                            <Typography
                                                variant="body1"
                                                className={
                                                    classes.alignTextLeft
                                                }
                                            >
                                                {formatMessage(
                                                    MESSAGES.districtsNeedMatching,
                                                )}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            )}
                        </Grid>
                    </Box>
                </Paper>
            </Box>
        </>
    );
};
