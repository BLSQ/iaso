import React, { Component } from 'react';
import {
    Map, TileLayer, Polygon,
} from 'react-leaflet';
import { withStyles } from '@material-ui/core';

import PropTypes from 'prop-types';

import { getLatLngBounds } from '../../utils/mapUtils';

import tiles from '../../constants/mapTiles';

const styles = () => ({
    mapContainer: {
        height: 400,
    },
});

class PolygonMap extends Component {
    render() {
        const { classes, polygonPositions } = this.props;
        const currentTile = tiles.osm;
        return (
            <div className={classes.mapContainer}>
                <Map
                    scrollWheelZoom={false}
                    maxZoom={currentTile.maxZoom}
                    style={{ height: '100%' }}
                    center={[0, 0]}
                    bounds={getLatLngBounds(polygonPositions)}
                    boundsOptions={{ padding: [50, 50] }}
                >
                    <TileLayer
                        attribution={currentTile.attribution ? currentTile.attribution : ''}
                        url={currentTile.url}
                    />
                    <Polygon positions={polygonPositions} color="blue" />
                </Map>
            </div>
        );
    }
}

PolygonMap.propTypes = {
    classes: PropTypes.object.isRequired,
    polygonPositions: PropTypes.array.isRequired,
};

export default withStyles(styles)(PolygonMap);
