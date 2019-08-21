import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
    Map, FeatureGroup, TileLayer,
} from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import { FormattedMessage, injectIntl } from 'react-intl';

import { withStyles } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Edit from '@material-ui/icons/Edit';
import Add from '@material-ui/icons/Add';
import Check from '@material-ui/icons/Check';
import DeleteIcon from '@material-ui/icons/Delete';

import L from 'leaflet';
import PropTypes from 'prop-types';

import commonStyles from '../../styles/common';
import setDrawMessages from '../../../../utils/map/drawMapMessages';
import { MESSAGES } from '../../../../utils/map/mapUtils';

import TileSwitch from './TileSwitchComponent';

import 'leaflet-draw/dist/leaflet.draw.css';

const zoom = 5;
const padding = [10, 10];

const polygonDrawOpiton = {
    shapeOptions: { color: 'blue' },
};

const styles = theme => ({
    ...commonStyles(theme),
    mapContainer: {
        height: '70vh',
        marginBottom: theme.spacing(2),
    },
    button: {
        width: '100%',
        marginBottom: theme.spacing(2),
    },
});

let editableFeatureGroup;

class OrgUnitMapComponent extends Component {
    constructor(props) {
        super(props);
        const leafletGeoJSON = new L.GeoJSON(props.orgUnit.geo_json, {
            style: {
                weight: 3,
            },
        });
        this.state = {
            leafletGeoJSON,
            editEnabled: false,
        };
    }

    componentDidMount() {
        const {
            intl: {
                formatMessage,
            },
        } = this.props;
        setDrawMessages(formatMessage);

        const zoomBar = L.control.zoombar({
            zoomBoxTitle: formatMessage(MESSAGES['box-zoom-title']),
            zoomInfoTitle: formatMessage(MESSAGES['info-zoom-title']),
            fitToBoundsTitle: formatMessage(MESSAGES['fit-to-bounds']),
            fitToBounds: () => this.fitToBounds(),
            position: 'topleft',
        });
        zoomBar.addTo(this.map.leafletElement);
    }


    componentWillReceiveProps(newProps) {
        this.setState({
            leafletGeoJSON: newProps.orgUnit.geo_json ? new L.GeoJSON(newProps.orgUnit.geo_json, {
                style: {
                    weight: 3,
                },
            }) : null,
        });
    }

    onFeatureGroupReady(reactFGref, leafletGeoJSON = this.state.leafletGeoJSON) {
        if (reactFGref) {
            const leafletFG = reactFGref.leafletElement;
            leafletFG.clearLayers();
            if (leafletGeoJSON) {
                leafletGeoJSON.eachLayer((layer) => {
                    layer.addTo(leafletFG);
                });
            }
            editableFeatureGroup = reactFGref;
        }
    }

    onChange() {
        const { onChange } = this.props;

        if (!editableFeatureGroup || !onChange) {
            return;
        }
        const geojsonData = editableFeatureGroup.leafletElement.toGeoJSON();
        onChange(geojsonData);
    }

    fitToBounds() {
        const { currentTile } = this.props;
        const { leafletGeoJSON } = this.state;
        this.map.leafletElement.fitBounds(leafletGeoJSON.getBounds(), { maxZoom: currentTile.maxZoom, padding });
    }

    toggleEdit() {
        const { editEnabled } = this.state;
        const layer = editableFeatureGroup.leafletElement.getLayers()[0];
        console.log('ICI');
        
        if (!editEnabled) {
            layer.editing.enable();
        } else {
            layer.editing.disable();
        }
        // editableFeatureGroup.leafletElement.eachLayer((layer) => {
        //     // if (!editEnabled) {
        //     //     layer.editing.enable();
        //     // } else {
        //     //     layer.editing.disable();
        //     // }
        // });
        this.setState({
            editEnabled: !editEnabled,
        });
    }

    deleteShape() {
        const { onChange } = this.props;
        editableFeatureGroup = null;
        onChange(null);
    }

    addShape() {
        new L.Draw.Polygon(this.map.leafletElement, polygonDrawOpiton).enable();
    }

    render() {
        const {
            classes, orgUnit, currentTile,
        } = this.props;
        const { leafletGeoJSON, editEnabled } = this.state;
        const drawnItems = new L.FeatureGroup();
        return (
            <Grid container spacing={4}>
                <Grid item xs={10} className={classes.mapContainer}>
                    <Map
                        maxZoom={currentTile.maxZoom}
                        style={{ height: '100%' }}
                        ref={(ref) => {
                            this.map = ref;
                        }}
                        center={[0, 0]}
                        bounds={leafletGeoJSON ? leafletGeoJSON.getBounds() : null}
                        boundsOptions={{ padding }}
                        zoom={zoom}
                        zoomControl={false}
                    >
                        <TileLayer
                            attribution={currentTile.attribution ? currentTile.attribution : ''}
                            url={currentTile.url}
                        />
                        <FeatureGroup ref={(reactFGref) => { this.onFeatureGroupReady(reactFGref); }}>
                            <EditControl
                                position="topright"
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
                                    edit: {
                                        featureGroup: drawnItems,
                                    },
                                }
                                }
                            />
                        </FeatureGroup>
                    </Map>
                </Grid>
                <Grid item xs={2}>
                    <TileSwitch />
                    {
                        !editEnabled
                        && orgUnit.geo_json
                        && (
                            <Button
                                variant="contained"
                                onClick={() => this.toggleEdit()}
                                className={classes.button}
                                color="primary"
                            >
                                <Edit className={classes.buttonIcon} />
                                <FormattedMessage id="iaso.label.edit" defaultMessage="Edit" />
                            </Button>
                        )
                    }
                    {
                        editEnabled
                        && orgUnit.geo_json
                        && (
                            <Button
                                variant="contained"
                                onClick={() => {
                                    this.toggleEdit();
                                    this.onChange();
                                }}
                                className={classes.button}
                                color="secondary"
                            >
                                <Check className={classes.buttonIcon} />
                                <FormattedMessage id="iaso.label.validate" defaultMessage="Validate" />
                            </Button>
                        )
                    }
                    {
                        orgUnit.geo_json
                        && (
                            <Button
                                variant="contained"
                                color="secondary"
                                className={classes.button}
                                onClick={() => this.deleteShape()}
                            >
                                <DeleteIcon className={classes.buttonIcon} />
                                <FormattedMessage id="iaso.label.delete" defaultMessage="Delete" />
                            </Button>
                        )
                    }
                    {
                        !orgUnit.geo_json
                        && (
                            <Button
                                variant="contained"
                                onClick={() => this.addShape()}
                                className={classes.button}
                                color="primary"
                            >
                                <Add className={classes.buttonIcon} />
                                <FormattedMessage id="iaso.map.shape.add" defaultMessage="Add shape" />
                            </Button>
                        )
                    }
                </Grid>
            </Grid>
        );
    }
}

OrgUnitMapComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    orgUnit: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    currentTile: PropTypes.object.isRequired,
};

const MapStateToProps = state => ({
    currentTile: state.map.currentTile,
});


export default withStyles(styles)(connect(MapStateToProps)(injectIntl(OrgUnitMapComponent)));
