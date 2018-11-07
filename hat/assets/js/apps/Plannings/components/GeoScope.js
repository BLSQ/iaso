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
    render() {
        const {
            geosScope: {
                baseLayer,
                overlays,
            },
        } = this.props;
        console.log(baseLayer);
        return (
            <section>
                <div className="widget__content">
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

                    <div className="map geo-scope-map">
                        <GeoScopeMap
                            coordinationId={this.props.coordinationId}
                            baseLayer={baseLayer}
                            overlays={{ labels: false }}
                            coordination={{}}
                            workzones={[]}
                            selectAs={currentAs => this.selectAs(currentAs)}
                        />
                    </div>
                </div>
            </section>
        );
    }
}
GeoScope.propTypes = {
    geosScope: PropTypes.object.isRequired,
    workzoneId: PropTypes.string.isRequired,
    coordinationId: PropTypes.string.isRequired,
    changeLayer: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    geosScope: state.geosScope,
});

const MapDispatchToProps = dispatch => ({
    changeLayer: (type, key) => dispatch(geoScopeMapActions.changeLayer(type, key)),
});

const GeoScopeIntl = injectIntl(GeoScope);
export default connect(MapStateToProps, MapDispatchToProps)(GeoScopeIntl);
