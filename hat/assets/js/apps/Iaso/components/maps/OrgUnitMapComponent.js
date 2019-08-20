import React, { Component } from 'react';
import {
    Map, TileLayer, Marker, Popup, FeatureGroup, Circle,
} from 'react-leaflet';
import L from 'leaflet';
import { EditControl } from 'react-leaflet-draw';
import { FormattedMessage } from 'react-intl';

import { withStyles } from '@material-ui/core';

import PropTypes from 'prop-types';

import commonStyles from '../../styles/common';
import { getLatLngBounds, isValidCoordinate } from '../../utils/mapUtils';
import 'leaflet-draw/dist/leaflet.draw.css';

const styles = theme => ({
    ...commonStyles(theme),
    link: {
        wordBreak: 'break-all',
    },
});

let editableFG;

class OrgUnitMapComponent extends Component {
    onEdited(e) {
        let numEdited = 0;
        e.layers.eachLayer((layer) => {
            numEdited += 1;
        });
        console.log(`onEdited: edited ${numEdited} layers`, e);

        this.onChange();
    }

    onCreated(e) {
        const type = e.layerType;
        const layer = e.layer;
        if (type === 'marker') {
            // Do marker specific actions
            console.log('onCreated: marker created', e);
        } else {
            console.log('onCreated: something else created:', type, e);
        }
        // Do whatever else you need to. (save to db; etc)

        this.onChange();
    }

    onFeatureGroupReady(reactFGref) {
        if (reactFGref) {
            const leafletGeoJSON = new L.GeoJSON(this.props.orgUnit.geo_json, {
                stroke: false,
            });

            const leafletFG = reactFGref.leafletElement;

            leafletGeoJSON.eachLayer((layer) => {
                layer.editing.enable();
                leafletFG.addLayer(layer);
            });

            editableFG = reactFGref;
        }
    }

    onChange() {
        const { onChange } = this.props;

        if (!editableFG || !onChange) {
            return;
        }

        const geojsonData = editableFG.leafletElement.toGeoJSON();
        onChange(geojsonData);
    }

    render() {
        return (
            <Map
                center={[28.5205, -7.6019]}
                boundsOptions={{ padding: [50, 50] }}
                zoom={13}
            >
                <TileLayer
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    url="http://{s}.tile.osm.org/{z}/{x}/{y}.png"
                />
                <FeatureGroup ref={(reactFGref) => { this.onFeatureGroupReady(reactFGref); }}>
                    <EditControl
                        position="topright"
                        onEdited={this.onEdited}
                        onCreated={this.onCreated}
                        draw={{
                            polyline: false,
                            polygon: false,
                            circle: false,
                            marker: false,
                            circlemarker: false,
                            rectangle: false,
                        }}
                        edit={{
                            remove: false,
                            edit: false,
                        }
                        }
                    />
                </FeatureGroup>
            </Map>
        );
    }
}

OrgUnitMapComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    orgUnit: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
};


export default withStyles(styles)(OrgUnitMapComponent);
