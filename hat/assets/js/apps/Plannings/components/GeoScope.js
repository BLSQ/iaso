/*
 * This component displays a modal ti assing As to team.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Select from 'react-select';
import { FormattedMessage, injectIntl } from 'react-intl';
import { geoScopeLegend } from './../constants/microplanningLegends';
import { MapLegend, GeoScopeMap, MapLayers } from './../components';
import { geoScopeMapActions } from './../redux/geoScope';
import { selectionActions } from './../redux/selection';
import { loadActions } from '../../../redux/load';
import { getRequest } from '../../../utils/fetchData';

const getActiveGeoList = (geosScope) => {
    const list = {
        areas: [],
        zones: [],
    };
    Object.keys(geosScope).forEach((key) => {
        const value = geosScope[key];
        list.areas.push(value.id);
        if (list.zones.indexOf(value.zs_id) === -1) {
            list.zones.push(value.zs_id);
        }
    });
    return list;
};

class GeoScope extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentWorkZone: null,
            activeGeoList: getActiveGeoList(props.teamGeoScope),
        };
    }

    componentDidMount() {
        this.props.getShapes(this.props.coordinationId, this.props.workzoneId);
    }

    componentWillReceiveProps(nextProps) {
        const newState = {};
        if (nextProps.workzones.length > 0) {
            [newState.currentWorkZone] = nextProps.workzones.filter(w => w.id === parseInt(nextProps.workzoneId, 10));
        }
        newState.activeGeoList = getActiveGeoList(nextProps.teamGeoScope);
        this.setState(newState);
    }

    selectAsMap(newAs) {
        this.props.startLoading();
        let tempTeam = { team_id: this.props.team.id, planning_id: this.props.planningId };
        if (newAs.isInGeoScope) {
            tempTeam = { ...tempTeam, delete: true };
        }
        this.props.saveAreaInGeoloc(newAs.pk, tempTeam, this.props.planningId, true);
    }

    selectAs(asList) {
        this.props.startLoading();
        let tempTeam = { team_id: this.props.team.id, planning_id: this.props.planningId };
        let newAs;
        if (asList.length > this.state.activeGeoList.areas.length) {
            asList.map((a) => {
                if (this.state.activeGeoList.areas.indexOf(parseInt(a.value, 10)) === -1) {
                    newAs = a.value;
                }
                return null;
            });
        } else {
            tempTeam = { ...tempTeam, delete: true };
            this.state.activeGeoList.areas.map((a) => {
                if (!asList.filter(as => parseInt(as.value, 10) === a)[0]) {
                    newAs = a;
                }
                return null;
            });
        }
        if (newAs) {
            this.props.saveAreaInGeoloc(newAs, tempTeam, this.props.planningId, true);
        }
    }


    selectZs(zsList) {
        this.props.startLoading();
        let tempTeam = { team_id: this.props.team.id, planning_id: this.props.planningId };
        let asIds;
        if (zsList.length > this.state.activeGeoList.zones.length) { // ADD
            zsList.map((z) => {
                if (this.state.activeGeoList.zones.indexOf(parseInt(z.value, 10)) === -1) { // NEW ENTRY
                    this.props.geoScope.currentCoordination.areas.features.map((a) => { // FINND ALL AS FROM ZS
                        if (a.properties.ZS === parseInt(z.value, 10)) {
                            asIds = (!asIds ? a.properties.pk : `${asIds},${a.properties.pk}`);
                        }
                        return null;
                    });
                }
                return null;
            });
        } else { // DELETE
            tempTeam = { ...tempTeam, delete: true };
            this.state.activeGeoList.zones.map((z) => {
                if (!zsList.filter(zs => parseInt(zs.value, 10) === z)[0]) {
                    this.props.geoScope.currentCoordination.areas.features.map((a) => { // FINND ALL AS FROM ZS
                        if ((a.properties.ZS === z) && (this.state.activeGeoList.areas.indexOf(parseInt(a.properties.pk, 10))) !== -1) {
                            asIds = (!asIds ? a.properties.pk : `${asIds},${a.properties.pk}`);
                        }
                        return null;
                    });
                }
                return null;
            });
        }
        if (asIds) {
            this.props.saveAreaInGeoloc(asIds, tempTeam, this.props.planningId, true);
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
                <div className="map__panel__container">
                    <div className="map__panel--left geo-scope">
                        <div className="bold-subtitle">
                            {this.props.team.name}
                        </div>
                        <div className="location-filter">
                            <div className="location-subtitle">
                                <FormattedMessage id="main.label.zones" defaultMessage="Health zone" />
                            </div>
                            <div>
                                {
                                    currentCoordination &&
                                    <Select
                                        multi
                                        clearable={false}
                                        name="zoneId"
                                        value={this.state.activeGeoList.zones}
                                        placeholder="--"
                                        options={currentCoordination.zones.features.map(area =>
                                            ({ label: area.properties.name, value: area.properties.pk }))}
                                        onChange={(value) => { this.selectZs(value); }}
                                    />
                                }
                            </div>
                        </div>
                        <div className="location-filter">
                            <div className="location-subtitle">
                                <FormattedMessage id="main.label.areas" defaultMessage="Health area" />
                            </div>
                            <div>
                                {
                                    currentCoordination &&
                                    <Select
                                        multi
                                        clearable={false}
                                        name="areaId"
                                        value={this.state.activeGeoList.areas}
                                        placeholder="--"
                                        options={currentCoordination.areas.features.map(area =>
                                            ({ label: area.properties.name, value: area.properties.pk }))}
                                        onChange={(value) => { this.selectAs(value); }}
                                    />
                                }
                            </div>
                        </div>
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
                    <div className="map geo-scope-map">
                        {
                            currentCoordination && this.state.currentWorkZone &&
                            <GeoScopeMap
                                coordinationId={this.props.coordinationId}
                                baseLayer={baseLayer}
                                overlays={{ labels: false }}
                                coordination={currentCoordination}
                                workzone={this.state.currentWorkZone}
                                selectAs={currentAs => this.selectAsMap(currentAs)}
                                teamGeoScope={teamGeoScope}
                                getShape={type => this.props.getShape(type)}
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
    team: PropTypes.object.isRequired,
    planningId: PropTypes.string.isRequired,
    saveAreaInGeoloc: PropTypes.func.isRequired,
    startLoading: PropTypes.func.isRequired,
    getShape: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    geoScope: state.geoScope,
});

const MapDispatchToProps = dispatch => ({
    startLoading: () => dispatch(loadActions.startLoading()),
    changeLayer: (type, key) => dispatch(geoScopeMapActions.changeLayer(type, key)),
    getShapes: (coordinationId, workzoneId) => dispatch(geoScopeMapActions.getShapes(dispatch, coordinationId, workzoneId)),
    saveAreaInGeoloc: (asId, team, planningId, stopLoading) => dispatch(selectionActions.saveAreaInGeoloc(dispatch, asId, team, planningId, stopLoading)),
    getShape: url => getRequest(url, dispatch, null, false),
});

const GeoScopeIntl = injectIntl(GeoScope);
export default connect(MapStateToProps, MapDispatchToProps)(GeoScopeIntl);
