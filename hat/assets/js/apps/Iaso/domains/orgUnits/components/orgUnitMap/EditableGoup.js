import L from 'leaflet';
import 'leaflet-draw';

import { customMarker, polygonDrawOption } from '../../../../utils/mapUtils';
import { getGeoJson } from './utils';

class EditableGroup {
    constructor() {
        this.group = new L.FeatureGroup();
        this.editHandler = null;
        this.deleteHandler = null;
        this.drawControl = null;
        this.groupKey = '';
        this.paneString = '';
    }

    initialize({
        map,
        groupKey,
        onChangeShape,
        onChangeLocation,
        geoJson,
        classNames,
        tooltipMessage,
    }) {
        this.createPane(map, groupKey);
        this.addEvents(map, onChangeShape, onChangeLocation);
        this.addDrawControl(map);
        if (geoJson) {
            this.updateShape(geoJson, classNames, tooltipMessage);
        }
    }

    createPane(map, groupKey) {
        this.groupKey = groupKey;
        this.paneString = `custom-shape-${groupKey}`;
        map.createPane(this.paneString);
    }

    addShape(map, className) {
        new L.Draw.Polygon(
            map,
            polygonDrawOption(className, this.groupKey),
        ).enable();
    }

    addEvents(map, onChangeShape, onChangeLocation) {
        map.on('draw:created', e => {
            if (e.layerType === 'marker') {
                onChangeLocation(e.layer.getLatLng());
                this.toggleDrawMarker(false);
                map.removeLayer(e.layer);
            } else if (
                e.layerType === 'polygon' &&
                e.layer.options.className.includes(this.groupKey)
            ) {
                e.layer.addTo(this.group);
                onChangeShape(getGeoJson(this.group));
            }
        });
    }

    addDrawControl(map) {
        const options = {
            position: 'topright',
            draw: {
                polyline: false,
                polygon: false,
                circle: false,
                marker: {
                    icon: customMarker,
                },
                circlemarker: false,
                featureGroup: this.group,
                rectangle: false,
            },
            edit: {
                edit: true,
                featureGroup: this.group,
                remove: true,
            },
        };

        const drawControl = new L.Control.Draw(options);
        map.addControl(drawControl);
        map.addLayer(this.group);
        const editToolbar = new L.EditToolbar({
            featureGroup: this.group,
        });
        const editHandler = editToolbar.getModeHandlers()[0].handler;
        const deleteHandler = editToolbar.getModeHandlers()[1].handler;
        editHandler._map = map;
        deleteHandler._map = map;
        this.editHandler = editHandler;
        this.deleteHandler = deleteHandler;
        this.drawControl = drawControl;
    }

    toggleDrawMarker(isEnabled) {
        if (isEnabled) {
            this.drawControl._toolbars.draw._modes.marker.handler.enable();
        } else {
            this.drawControl._toolbars.draw._modes.marker.handler.disable();
        }
    }

    toggleEditShape(editEnabled) {
        if (editEnabled) {
            this.editHandler.enable();
        } else {
            this.editHandler.disable();
        }
    }

    toggleDeleteShape(deleteEnabled) {
        if (deleteEnabled) {
            this.deleteHandler.enable();
        } else {
            this.deleteHandler.disable();
        }
    }

    clearLayers() {
        this.group.clearLayers();
    }

    reset() {
        this.clearLayers();
        this.editHandler = null;
        this.deleteHandler = null;
        this.drawControl = null;
    }

    updateShape(geoJson, classNames, tooltipMessage) {
        this.clearLayers();
        const { group } = this;
        if (geoJson) {
            geoJson.eachLayer(layer => {
                const tempLayer = layer;
                const options = {
                    className: `editable-pane ${this.groupKey} ${classNames}`,
                    pane: this.paneString,
                };
                if (tempLayer.feature.geometry.type === 'MultiPolygon') {
                    tempLayer.feature.geometry.coordinates.forEach(
                        shapeCoords => {
                            const polygon = {
                                type: 'Polygon',
                                coordinates: shapeCoords,
                            };
                            L.geoJson(polygon, {
                                onEachFeature(feature, newLayer) {
                                    L.setOptions(newLayer, options);
                                    if (tooltipMessage) {
                                        newLayer.bindTooltip(tooltipMessage, {
                                            sticky: true,
                                        });
                                    }
                                    newLayer.addTo(group);
                                },
                            });
                        },
                    );
                } else {
                    L.setOptions(tempLayer, options);
                    tempLayer.addTo(group);
                }
            });
        }
    }
}
export default EditableGroup;
