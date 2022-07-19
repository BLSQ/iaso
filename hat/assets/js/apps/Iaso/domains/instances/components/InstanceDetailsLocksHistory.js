import React from 'react';
import { Divider, Grid, Typography } from '@material-ui/core';
import PropTypes from 'prop-types';
import moment from 'moment';
import { textPlaceholder, injectIntl } from 'bluesquare-components';
import LockIcon from '@material-ui/icons/Lock';
import LockOpenIcon from '@material-ui/icons/LockOpen';
import MESSAGES from '../messages';
import WidgetPaper from '../../../components/papers/WidgetPaperComponent';
import InstanceDetailsField from './InstanceDetailsField';
import InputComponent from '../../../components/forms/InputComponent';

const formatUnixTimestamp = unix =>
    unix ? moment.unix(unix).format('LTS') : textPlaceholder;

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
            <Grid
                xs={4}
                item
                container
                justifyContent="flex-start"
                alignItems="center"
            >
                <Typography variant="body1" color="inherit">
                    User
                </Typography>
            </Grid>

            <Grid
                xs={4}
                item
                container
                justifyContent="flex-start"
                alignItems="center"
            >
                <Typography variant="body1" color="inherit">
                    Top org unit
                </Typography>
            </Grid>
            <Grid
                xs={4}
                item
                container
                justifyContent="flex-start"
                alignItems="center"
            >
                <Typography variant="body1" color="inherit">
                    Status
                </Typography>
            </Grid>
        </Grid>
        <Divider />
        {currentInstance.instance_locks_history.map((instanceLock, index) => (
            <>
                <Grid container key={instanceLock.id} spacing={1}>
                    <Grid
                        xs={4}
                        item
                        container
                        justifyContent="flex-start"
                        alignItems="center"
                        title="Author"
                    >
                        <Typography variant="body1" color="inherit">
                            {instanceLock.user}
                        </Typography>
                    </Grid>

                    <Grid
                        xs={4}
                        item
                        container
                        justifyContent="flex-start"
                        alignItems="center"
                    >
                        <Typography
                            variant="body1"
                            color="inherit"
                            title="Org unit"
                        >
                            {instanceLock.top_org_unit}
                        </Typography>
                    </Grid>
                    <Grid
                        xs={4}
                        item
                        container
                        justifyContent="flex-start"
                        alignItems="right"
                    >
                        <Typography
                            variant="body1"
                            color="inherit"
                            title={instanceLock.status ? 'Locked' : 'Unlocked'}
                        >
                            {instanceLock.status ? (
                                <LockIcon />
                            ) : (
                                <LockOpenIcon />
                            )}
                        </Typography>
                    </Grid>
                </Grid>
                <Divider />
            </>
        ))}
    </WidgetPaper>
);

InstanceDetailsLocksHistory.propTypes = {
    currentInstance: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
};

export default injectIntl(InstanceDetailsLocksHistory);
