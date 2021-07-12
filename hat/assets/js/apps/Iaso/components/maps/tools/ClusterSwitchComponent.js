import React from 'react';
import { connect } from 'react-redux';

import { withStyles, Grid, Box, Switch, Typography } from '@material-ui/core';

import PropTypes from 'prop-types';
import { injectIntl } from 'bluesquare-components';
import MESSAGES from '../messages';
import { toggleCluster } from '../../../redux/mapReducer';

const styles = theme => ({
    title: {
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
        textAlign: 'center',
        fontSize: 15,
    },
});

const ClusterSwitchComponent = props => {
    const {
        isClusterActive,
        classes,
        intl: { formatMessage },
    } = props;
    return (
        <Box
            px={3}
            py={2}
            className={classes.innerDrawerContent}
            component="div"
        >
            <Grid
                component="label"
                container
                alignItems="center"
                justifyContent="flex-start"
                spacing={1}
            >
                <Grid item>
                    <Typography
                        variant="inherit"
                        component="span"
                        color={isClusterActive ? 'primary' : 'inherit'}
                    >
                        {formatMessage(MESSAGES.title)}
                    </Typography>
                </Grid>
                <Grid item>
                    <Switch
                        checked={isClusterActive}
                        onChange={() => props.toggleCluster()}
                        color="primary"
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

ClusterSwitchComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    isClusterActive: PropTypes.bool.isRequired,
    toggleCluster: PropTypes.func.isRequired,
    classes: PropTypes.object.isRequired,
};

const MapStateToProps = state => ({
    isClusterActive: state.map.isClusterActive,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    toggleCluster: () => dispatch(toggleCluster()),
});

export default withStyles(styles)(
    connect(
        MapStateToProps,
        MapDispatchToProps,
    )(injectIntl(ClusterSwitchComponent)),
);
