import React, { Component } from 'react';
import { Map, TileLayer, Polygon } from 'react-leaflet';

import { withStyles } from '@material-ui/core';

import PropTypes from 'prop-types';

import { injectIntl } from 'bluesquare-components';
import { getLatLngBounds, customZoomBar } from '../../utils/mapUtils';

import tiles from '../../constants/mapTiles';

const boundsOptions = { padding: [10, 10] };

const styles = () => ({
    mapContainer: {
        height: 400,
        minWidth: 200,
        marginbottom: 0,
    },
});

class PolygonMap extends Component {
    componentDidMount() {
        const {
            intl: { formatMessage },
        } = this.props;
        const zoomBar = customZoomBar(formatMessage, () => this.fitToBounds());
        zoomBar.addTo(this.map.leafletElement);
    }

    fitToBounds() {
        const { polygonPositions } = this.props;
        const bounds = getLatLngBounds(polygonPositions);
        this.map.leafletElement.fitBounds(bounds, {
            maxZoom: tiles.osm.maxZoom,
            padding: boundsOptions.padding,
        });
    }

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
                    boundsOptions={boundsOptions}
                    ref={ref => {
                        this.map = ref;
                    }}
                    zoomControl={false}
                    keyboard={false}
                >
                    <TileLayer
                        attribution={
                            currentTile.attribution
                                ? currentTile.attribution
                                : ''
                        }
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
    intl: PropTypes.object.isRequired,
};

export default withStyles(styles)(injectIntl(PolygonMap));
