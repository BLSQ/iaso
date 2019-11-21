import React, { Component } from 'react';
import {
    Map, TileLayer,
} from 'react-leaflet';
import { injectIntl, intlShape } from 'react-intl';
import L from 'leaflet';

import { withStyles } from '@material-ui/core';

import PropTypes from 'prop-types';

import { customZoomBar } from '../../utils/mapUtils';

import tiles from '../../constants/mapTiles';
import MarkerComponent from './markers/MarkerComponent';

import commonStyles from '../../styles/common';

const boundsOptions = { padding: [500, 500] };

const styles = theme => ({
    mapContainer: {
        ...commonStyles(theme).mapContainer,
        height: 400,
        minWidth: 200,
        marginBottom: 0,
    },
});

class MarkerMap extends Component {
    componentDidMount() {
        const {
            intl: {
                formatMessage,
            },
        } = this.props;
        const zoomBar = customZoomBar(formatMessage, () => this.fitToBounds());
        zoomBar.addTo(this.map.leafletElement);
        this.fitToBounds();
    }

    fitToBounds() {
        const {
            latitude,
            longitude,
        } = this.props;
        const latlng = [L.latLng(latitude, longitude)];
        const markerBounds = L.latLngBounds(latlng);
        this.map.leafletElement.fitBounds(markerBounds, {
            maxZoom: 9, padding: boundsOptions.padding,
        });
    }

    render() {
        const {
            classes,
            latitude,
            longitude,
        } = this.props;
        const currentTile = tiles.osm;
        return (
            <div className={classes.mapContainer}>
                <Map
                    scrollWheelZoom={false}
                    maxZoom={currentTile.maxZoom}
                    style={{ height: '100%' }}
                    center={[0, 0]}
                    ref={(ref) => {
                        this.map = ref;
                    }}
                    zoomControl={false}
                    keyboard={false}
                    zoomSnap={0.1}
                >
                    <TileLayer
                        attribution={currentTile.attribution ? currentTile.attribution : ''}
                        url={currentTile.url}
                    />
                    <MarkerComponent
                        item={{
                            latitude,
                            longitude,
                        }}
                    />
                </Map>
            </div>
        );
    }
}

MarkerMap.propTypes = {
    classes: PropTypes.object.isRequired,
    latitude: PropTypes.any.isRequired,
    longitude: PropTypes.any.isRequired,
    intl: intlShape.isRequired,
};

export default withStyles(styles)(injectIntl(MarkerMap));
