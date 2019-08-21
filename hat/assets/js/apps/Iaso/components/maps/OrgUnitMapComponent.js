import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import {
    Map, FeatureGroup, TileLayer,
} from 'react-leaflet';
import 'react-leaflet-draw';
import { FormattedMessage, injectIntl } from 'react-intl';

import { withStyles } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Edit from '@material-ui/icons/Edit';
import Check from '@material-ui/icons/Check';

import L from 'leaflet';
import PropTypes from 'prop-types';

import commonStyles from '../../styles/common';
import setDrawMessages from '../../../../utils/map/drawMapMessages';
import { MESSAGES } from '../../../../utils/map/mapUtils';

import ErrorPaper from '../papers/ErrorPaperComponent';
import TileSwitch from './TileSwitchComponent';

import 'leaflet-draw/dist/leaflet.draw.css';

const zoom = 5;
const padding = [10, 10];

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
            stroke: false,
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
            leafletGeoJSON: new L.GeoJSON(newProps.orgUnit.geo_json, {
                stroke: false,
            }),
        });
    }

    onFeatureGroupReady(reactFGref, leafletGeoJSON = this.state.leafletGeoJSON) {
        if (reactFGref) {
            const leafletFG = reactFGref.leafletElement;
            leafletFG.clearLayers();
            leafletGeoJSON.eachLayer((layer) => {
                leafletFG.addLayer(layer);
            });
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
        editableFeatureGroup.leafletElement.eachLayer((layer) => {
            if (!editEnabled) {
                layer.editing.enable();
            } else {
                layer.editing.disable();
            }
        });
        this.setState({
            editEnabled: !editEnabled,
        });
    }

    render() {
        const {
            classes, orgUnit, intl: { formatMessage }, currentTile,
        } = this.props;
        const { leafletGeoJSON, editEnabled } = this.state;
        return (
            <Grid container spacing={4}>
                {
                    !orgUnit.geo_json
                    && (
                        <Fragment>
                            <Grid item xs={4} />
                            <Grid item xs={4}>
                                <ErrorPaper message={formatMessage({
                                    id: 'iaso.orgunit.shapeMissing',
                                    defaultMessage: 'No shape found for this org unit',
                                })}
                                />
                            </Grid>
                            <Grid item xs={4} />
                        </Fragment>
                    )
                }
                {
                    orgUnit.geo_json
                    && (
                        <Fragment>
                            <Grid item xs={10} className={classes.mapContainer}>
                                <Map
                                    maxZoom={currentTile.maxZoom}
                                    style={{ height: '100%' }}
                                    ref={(ref) => {
                                        this.map = ref;
                                    }}
                                    bounds={leafletGeoJSON.getBounds()}
                                    boundsOptions={{ padding }}
                                    zoom={zoom}
                                    zoomControl={false}
                                >
                                    <TileLayer
                                        attribution={currentTile.attribution ? currentTile.attribution : ''}
                                        url={currentTile.url}
                                    />
                                    <FeatureGroup ref={(reactFGref) => { this.onFeatureGroupReady(reactFGref); }} />
                                </Map>
                            </Grid>
                            <Grid item xs={2}>
                                <TileSwitch />
                                {
                                    !editEnabled
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
                            </Grid>
                        </Fragment>
                    )
                }
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
