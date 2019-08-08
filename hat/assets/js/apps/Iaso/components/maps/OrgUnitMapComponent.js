import React, { Component } from 'react';
import {
    Map, TileLayer, Marker, Popup,
} from 'react-leaflet';
import { FormattedMessage } from 'react-intl';

import { withStyles } from '@material-ui/core';

import PropTypes from 'prop-types';

import commonStyles from '../../styles/common';

const styles = theme => ({
    ...commonStyles(theme),
    link: {
        wordBreak: 'break-all',
    },
});

class OrgUnitMapComponent extends Component {
    render() {
        const { classes } = this.props;
        return (
            <Map
                className={classes.marginBottom}
                center={[-4.2491, 15.4635]}
                zoom={7}
            >
                <TileLayer attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors' url="http://{s}.tile.osm.org/{z}/{x}/{y}.png" />
            </Map>
        );
    }
}

OrgUnitMapComponent.propTypes = {
    classes: PropTypes.object.isRequired,
};


export default withStyles(styles)(OrgUnitMapComponent);
