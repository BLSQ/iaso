import React, { Fragment } from 'react';
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
        {currentInstance.instance_locks_history.length > 0 && (
            <>
                <Grid container spacing={1}>
                    <Grid xs={5} container item justifyContent="center">
                        <Typography variant="body2" color="inherit">
                            <b>{formatMessage(MESSAGES.lockAuthorLabel)}</b>
                        </Typography>
                    </Grid>

                    <Grid xs={5} item container justifyContent="center">
                        <Typography variant="body2" color="inherit">
                            <b>{formatMessage(MESSAGES.lockTopOrgUnitLabel)}</b>
                        </Typography>
                    </Grid>
                    <Grid xs={2} item container justifyContent="center">
                        <Typography variant="body2" color="inherit">
                            <b>{formatMessage(MESSAGES.lockStatusLabel)}</b>
                        </Typography>
                    </Grid>
                </Grid>
                <Divider />
            </>
        )}

        {currentInstance.instance_locks_history.length === 0 && (
            <Grid xs={5} container item justifyContent="center">
                <Typography
                    variant="body2"
                    color="inherit"
                    title={formatMessage(MESSAGES.lockAuthorLabel)}
                >
                    {`${formatMessage(MESSAGES.NoLocksHistory)}: --`}
                </Typography>
            </Grid>
        )}

        {currentInstance.instance_locks_history.map((instanceLock, index) => (
            <Fragment key={index}>
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
                            {instanceLock.author.username}
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
                            {instanceLock.top_org_unit.name}
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
                                instanceLock.is_locked
                                    ? formatMessage(MESSAGES.lockedTitle)
                                    : formatMessage(MESSAGES.unlockedTitle)
                            }
                        >
                            {instanceLock.is_locked ? (
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
            </Fragment>
        ))}
    </WidgetPaper>
);

InstanceDetailsLocksHistory.propTypes = {
    currentInstance: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
};

export default injectIntl(InstanceDetailsLocksHistory);
