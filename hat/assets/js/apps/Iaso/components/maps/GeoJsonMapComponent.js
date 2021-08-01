import React, { Component } from 'react';
import L from 'leaflet';
import { Map, TileLayer, GeoJSON, ScaleControl } from 'react-leaflet';

import { withStyles } from '@material-ui/core';

import PropTypes from 'prop-types';

import { injectIntl, commonStyles } from 'bluesquare-components';
import { ZoomControl } from '../../utils/mapUtils';

import tiles from '../../constants/mapTiles';

const boundsOptions = { padding: [20, 20] };

const styles = theme => ({
    mapContainer: {
        ...commonStyles(theme).mapContainer,
        height: 400,
        minWidth: 200,
        marginbottom: 0,
    },
    button: {
        width: '100%',
        marginBottom: theme.spacing(2),
    },
});

class GeoJsonMap extends Component {
    constructor(props) {
        super(props);
        const shape = L.geoJSON(props.geoJson);
        const bounds = shape.getBounds();
        this.state = {
            bounds,
        };
    }

    fitToBounds() {
        const { bounds } = this.state;
        this.map.leafletElement.fitBounds(bounds, {
            maxZoom: tiles.osm.maxZoom,
            padding: boundsOptions.padding,
        });
    }

    render() {
        const { classes, geoJson } = this.props;
        const { bounds } = this.state;
        const currentTile = tiles.osm;
        return (
            <div className={classes.mapContainer}>
                <Map
                    scrollWheelZoom={false}
                    maxZoom={currentTile.maxZoom}
                    style={{ height: '100%' }}
                    center={[0, 0]}
                    bounds={bounds}
                    boundsOptions={boundsOptions}
                    ref={ref => {
                        this.map = ref;
                    }}
                    zoomControl={false}
                    zoomSnap={0.1}
                >
                    <ZoomControl fitToBounds={() => this.fitToBounds()} />
                    <ScaleControl imperial={false} />
                    <TileLayer
                        attribution={
                            currentTile.attribution
                                ? currentTile.attribution
                                : ''
                        }
                        url={currentTile.url}
                    />

                    <GeoJSON className="secondary" data={geoJson} />
                </Map>
            </div>
        );
    }
}

GeoJsonMap.propTypes = {
    classes: PropTypes.object.isRequired,
    geoJson: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
};

export default withStyles(styles)(injectIntl(GeoJsonMap));
