/*
 * This component displays a modal ti assing As to team.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { geoScopeLegend } from './../constants/microplanningLegends';
import { MapLegend, GeoScopeMap, MapLayers } from './../components';
import { geoScopeMapActions } from './../redux/geoScope';

class GeoScope extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentWorkZone: null,
        };
    }

    componentDidMount() {
        this.props.getShapes(this.props.coordinationId, this.props.workzoneId);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.workzones.length > 0) {
            const currentWorkZone = nextProps.workzones.filter(w => w.id === parseInt(nextProps.workzoneId, 10))[0];
            this.setState({
                currentWorkZone,
            });
        }
    }

    render() {
        const {
            geoScope: {
                baseLayer,
                overlays,
                currentCoordination,
            },
            teamGeoScope,
        } = this.props;
        return (
            <section>
                <div className="widget__header">
                    {/* Map legend */}
                    <div className="map__header--legend">
                        <MapLegend
                            items={geoScopeLegend}
                        />
                    </div>
                    {/* Map layers */}
                    <div className="map__header--layers">
                        <MapLayers
                            base={baseLayer}
                            overlays={overlays}
                            change={(type, key) => this.props.changeLayer(type, key)}
                        />
                    </div>
                </div>

                <div className="map__panel__container">
                    <div className="map__panel--left">
                        truc
                    </div>
                    <div className="map geo-scope-map">
                        {
                            currentCoordination && this.state.currentWorkZone &&
                            <GeoScopeMap
                                coordinationId={this.props.coordinationId}
                                baseLayer={baseLayer}
                                overlays={{ labels: false }}
                                coordination={currentCoordination}
                                workzone={this.state.currentWorkZone}
                                selectAs={currentAs => this.selectAs(currentAs)}
                                teamGeoScope={teamGeoScope}
                            />
                        }
                    </div>
                </div>
            </section>
        );
    }
}
GeoScope.defaultProps = {
    workzones: [],
    teamGeoScope: {},
};

GeoScope.propTypes = {
    geoScope: PropTypes.object.isRequired,
    workzoneId: PropTypes.string.isRequired,
    coordinationId: PropTypes.string.isRequired,
    changeLayer: PropTypes.func.isRequired,
    workzones: PropTypes.array,
    getShapes: PropTypes.func.isRequired,
    teamGeoScope: PropTypes.object,
};

const MapStateToProps = state => ({
    geoScope: state.geoScope,
});

const MapDispatchToProps = dispatch => ({
    changeLayer: (type, key) => dispatch(geoScopeMapActions.changeLayer(type, key)),
    getShapes: (coordinationId, workzoneId) => dispatch(geoScopeMapActions.getShapes(dispatch, coordinationId, workzoneId)),
});

const GeoScopeIntl = injectIntl(GeoScope);
export default connect(MapStateToProps, MapDispatchToProps)(GeoScopeIntl);
