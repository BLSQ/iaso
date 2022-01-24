import { Box, Grid, makeStyles, Paper, Typography } from '@material-ui/core';
import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../constants/messages';
import { useScopeAndDistrictsNotFound } from '../../pages/IM/requests';

type Props = {
    type: 'lqas' | 'imGlobal' | 'imIHH' | 'imOHH';
    // eslint-disable-next-line react/require-default-props
    campaign?: string;
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
});

const useStyles = makeStyles(style);

export const ScopeAndDNFDisclaimer: FunctionComponent<Props> = ({
    campaign,
    type,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const { data } = useScopeAndDistrictsNotFound(type, campaign);
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
                            {/* TODO have anothe no data found component */}
                            {/* {hasScope && (
                                <Grid item>
                                    <Box
                                        mt={4}
                                        mb={
                                            hasScope && allDistrictsFound
                                                ? 4
                                                : 0
                                        }
                                    >
                                        <Typography
                                            variant="h6"
                                            className={classes.boldText}
                                        >
                                            {formatMessage(
                                                MESSAGES.noDataFound,
                                            )}
                                        </Typography>
                                    </Box>
                                </Grid>
                            )} */}
                            {!hasScope && (
                                <Grid container item direction="column">
                                    <Grid item>
                                        <Box mt={4}>
                                            <Typography
                                                variant="h6"
                                                className={classes.boldText}
                                            >
                                                {formatMessage(
                                                    MESSAGES.noScopeFound,
                                                )}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item>
                                        <Box mb={allDistrictsFound ? 4 : 0}>
                                            <Typography variant="body1">
                                                {formatMessage(
                                                    MESSAGES.noScope,
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
                                    <Grid item>
                                        <Box mb={4}>
                                            <Typography variant="body1">
                                                {formatMessage(
                                                    MESSAGES.districtsNeedMatching,
                                                )}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    {/* <Grid item>
                                        <Box mt={2} mb={4}>
                                            <Typography variant="body1">
                                                {`Unidentified districts: ${districtsNotFound.join(
                                                    ', ',
                                                )}`}
                                            </Typography>
                                        </Box>
                                    </Grid> */}
                                </Grid>
                            )}
                        </Grid>
                    </Box>
                </Paper>
            </Box>
        </>
    );
};
