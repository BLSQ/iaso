/*
 * This component displays a leaflet map with all the layers, markers
 * and options indicated in the rest of components.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { injectIntl, intlShape } from 'react-intl';
import PrintControl from 'react-leaflet-easyprint';
import ReactResizeDetector from 'react-resize-detector';
import L from 'leaflet';

import * as zoomBar from '../../../components/leaflet/zoom-bar';

import {
    updateBaseLayer,
    MESSAGES,
    onResizeMap,
    defaultFitToBound,
    includeControlsInMap,
    genericMap,
    includeDefaultLayersInMap,
    renderTestIcon,
    renderVillageIcon,
    mapCasesToVillages,
    mapCasesToTests,
} from '../../../utils/map/mapUtils';

let exportControl;

class TestsMap extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoadingShape: {
                province: false,
                zone: false,
                area: false,
            },
            containers: {},
            firstLoad: true,
        };
    }

    componentDidMount() {
        this.createMap();
        includeControlsInMap(this, this.map, true);
        this.TestsGroup = new L.FeatureGroup();
        this.map.addLayer(this.TestsGroup);
        this.VillagesGroup = new L.FeatureGroup();
        this.map.addLayer(this.VillagesGroup);
        includeDefaultLayersInMap(this);
        updateBaseLayer(this.map, this.props.baseLayer);
    }

    componentDidUpdate(prevProps) {
        const { map } = this;
        const hasChanged = (prev, curr, key) => (prev[key] !== curr[key]);

        map.whenReady(() => {
            if (hasChanged(prevProps, this.props, 'baseLayer')) {
                updateBaseLayer(this.map, this.props.baseLayer);
            }
            if (this.props.cases && this.props.cases.length > 0) {
                this.updateTests();
                this.updateVillages();
                if (this.state.firstLoad) {
                    this.setState({
                        firstLoad: false,
                    });
                    this.fitToBounds();
                }
            }
        });
    }

    componentWillUnmount() {
        if (this.map) {
            this.map.remove();
        }
    }

    onResize(width, height) {
        const { map } = this;
        exportControl = onResizeMap(width, height, exportControl, map, 'Liste Villages');
    }

    /*
***************************************************************************
* CREATE MAP
*************************************************************************** */

    createMap() {
        const map = genericMap(this.mapNode);
        // create panes to preserve z-index order
        map.createPane('custom-pane-shapes');
        map.createPane('custom-pane-markers');
        map.createPane('custom-pane-tests');
        map.createPane('custom-pane-villages');
        map.createPane('custom-pane-selected');
        this.map = map;
    }

    /*
***************************************************************************
* UPDATE STATE
*************************************************************************** */
    updateTests() {
        const {
            cases,
            testsMapping,
        } = this.props;
        const tests = mapCasesToTests(cases);
        this.TestsGroup.clearLayers();
        if (tests.length > 0) {
            tests.forEach((test) => {
                if (test.latitude && test.longitude && test.displayed) {
                    const marker = L.marker(
                        [test.latitude, test.longitude],
                        { icon: renderTestIcon(test, this.props.intl.formatMessage, testsMapping) },
                    );
                    marker.addTo(this.TestsGroup);
                }
            });
        }
    }
    updateVillages() {
        const { cases } = this.props;
        const villages = mapCasesToVillages(cases);
        this.VillagesGroup.clearLayers();
        if (villages.length > 0) {
            villages.forEach((village) => {
                if (village.latitude && village.longitude && village.displayed) {
                    const marker = L.marker(
                        [village.latitude, village.longitude],
                        { icon: renderVillageIcon(village) },
                    );
                    marker.addTo(this.VillagesGroup)
                        .on('mouseover', () => {
                            this.updateTooltipSmall(village);
                        })
                        .on('mouseout', () => {
                            this.updateTooltipSmall();
                        });
                }
            });
        }
    }

    updateTooltipSmall(item) {
        if (item) {
            this.state.containers.tooltipSmall.innerHTML = item.label ? item.label : item.name;
        } else {
            this.state.containers.tooltipSmall.innerHTML = '';
        }
    }


    /*
***************************************************************************
* ACTIONS
*************************************************************************** */

    fitToBounds() {
        const { map } = this;
        const group = new L.FeatureGroup([this.TestsGroup, this.VillagesGroup]);
        defaultFitToBound(map, group.getBounds(), 15);
    }

    /*
***************************************************************************
* HELPERS
*************************************************************************** */

    addLayerEvents(layer, item) {
        // layer.bindTooltip(item.label, {sticky: true})
        layer.on({
            click: (event) => {
                L.DomEvent.stop(event);
            },
            contextmenu: (event) => {
                L.DomEvent.stop(event);
            },
            mouseover: (event) => {
                L.DomEvent.stop(event);
                this.updateTooltipSmall(item);
            },
            mouseout: (event) => {
                L.DomEvent.stop(event);
                this.updateTooltipSmall();
            },
        });
    }

    render() {
        const { formatMessage } = this.props.intl;
        return (
            <ReactResizeDetector handleWidth handleHeight onResize={(width, height) => this.onResize(width, height)}>
                <section className="map-parent-container">
                    <div ref={(node) => { this.mapNode = node; }} className="map-container" />
                    {
                        (this.state.isLoadingShape.province || this.state.isLoadingShape.zone || this.state.isLoadingShape.area) &&
                        <span className="loading-small" title={formatMessage(MESSAGES['shape-loader'])} />
                    }
                </section>
            </ReactResizeDetector>
        );
    }
}
TestsMap.defaultProps = {
    cases: [],
};

TestsMap.propTypes = {
    baseLayer: PropTypes.string.isRequired,
    cases: PropTypes.array,
    intl: intlShape.isRequired,
    getShape: PropTypes.func.isRequired,
    testsMapping: PropTypes.object.isRequired,
};

export default injectIntl(TestsMap);
