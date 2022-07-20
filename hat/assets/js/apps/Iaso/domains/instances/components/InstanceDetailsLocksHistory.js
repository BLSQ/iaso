import React from 'react';
import { Divider, Grid, Typography } from '@material-ui/core';
import PropTypes from 'prop-types';
import { injectIntl } from 'bluesquare-components';
import LockIcon from '@material-ui/icons/Lock';
import LockOpenIcon from '@material-ui/icons/LockOpen';
import MESSAGES from '../messages';
import WidgetPaper from '../../../components/papers/WidgetPaperComponent';

const InstanceDetailsLocksHistory = ({
    currentInstance,
    intl: { formatMessage },
}) => (
    <WidgetPaper
        id="export-requests"
        padded
        title={formatMessage(MESSAGES.instanceLocksHistory)}
    >
        <Grid container spacing={1}>
            <Grid xs={5} container item justifyContent="center">
                <Typography variant="body2" color="inherit">
                    <b>
                        {formatMessage(MESSAGES.lockAuthorLabel)}
                        {currentInstance.instance_locks_history.length === 0 &&
                            ': --'}
                    </b>
                </Typography>
            </Grid>

            <Grid xs={5} item container justifyContent="center">
                <Typography variant="body2" color="inherit">
                    <b>
                        {formatMessage(MESSAGES.lockTopOrgUnitLabel)}
                        {currentInstance.instance_locks_history.length === 0 &&
                            ' : --'}
                    </b>
                </Typography>
            </Grid>
            <Grid xs={2} item container justifyContent="center">
                <Typography variant="body2" color="inherit">
                    <b>
                        {formatMessage(MESSAGES.lockStatusLabel)}
                        {currentInstance.instance_locks_history.length === 0 &&
                            ' : --'}
                    </b>
                </Typography>
            </Grid>
        </Grid>
        {currentInstance.instance_locks_history &&
            currentInstance.instance_locks_history.length > 0 && <Divider />}
        {currentInstance.instance_locks_history.map((instanceLock, index) => (
            <>
                <Grid container spacing={1}>
                    <Grid
                        xs={5}
                        container
                        item
                        justifyContent="center"
                        alignItems="center"
                    >
                        <Typography
                            variant="body2"
                            color="inherit"
                            title={formatMessage(MESSAGES.lockAuthorLabel)}
                        >
                            {instanceLock.user}
                        </Typography>
                    </Grid>
                    <Grid
                        xs={5}
                        container
                        item
                        justifyContent="center"
                        alignItems="center"
                    >
                        <Typography
                            variant="body2"
                            color="inherit"
                            title={formatMessage(MESSAGES.lockTopOrgUnitLabel)}
                        >
                            {instanceLock.top_org_unit}
                        </Typography>
                    </Grid>

                    <Grid
                        xs={2}
                        container
                        item
                        justifyContent="center"
                        alignItems="center"
                    >
                        <Typography
                            variant="body2"
                            color="inherit"
                            title={
                                instanceLock.status
                                    ? formatMessage(MESSAGES.lockedTitle)
                                    : formatMessage(MESSAGES.unlockedTitle)
                            }
                        >
                            {instanceLock.status ? (
                                <LockIcon />
                            ) : (
                                <LockOpenIcon />
                            )}
                        </Typography>
                    </Grid>
                </Grid>
                {index !==
                    currentInstance.instance_locks_history.length - 1 && (
                    <Divider />
                )}
            </>
        ))}
    </WidgetPaper>
);

InstanceDetailsLocksHistory.propTypes = {
    currentInstance: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
};

export default injectIntl(InstanceDetailsLocksHistory);
