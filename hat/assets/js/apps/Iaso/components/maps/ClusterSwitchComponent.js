import React from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';

import {
    withStyles,
    Grid,
    Card,
    Switch,
    Typography,
} from '@material-ui/core';

import PropTypes from 'prop-types';
import { toggleCluster } from '../../redux/mapReducer';


const styles = theme => ({
    card: {
        marginBottom: theme.spacing(2),
    },
    title: {
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
        textAlign: 'center',
        fontSize: 15,
    },
});

const MESSAGES = {
    title: {
        id: 'iaso.map.title.markerClustering',
        defaultMessage: 'Clustering',
    },
};

function ClusterSwitchComponent(props) {
    const {
        isClusterActive,
        classes,
        intl: {
            formatMessage,
        },
    } = props;
    return (
        <Card className={classes.card}>
            <Grid component="label" container alignItems="center" justify="center" spacing={1}>
                <Grid item>
                    <Typography variant="span" component="span" color={isClusterActive ? 'primary' : ''}>
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
        </Card>
    );
}

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
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(ClusterSwitchComponent)),
);
