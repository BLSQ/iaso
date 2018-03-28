/*
 * The MicroplanningContainer is responsible for loading data
 * for the micro-planning
 *
 * It has a few behaviors:
 * - load data when mounted
 * - make sure only filter params changing triggers a new data load
 * - emit success/fail events
 *
 * Handles state and data loading for the Microplanning page
 */

import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import LocatorElement from './Locator';
import { villageFiltersActions } from './redux/villageFilters';
import { caseActions } from './redux/case';
import { loadActions } from '../../redux/load';

const request = require('superagent');

export const urls = [];

class LocatorContainer extends Component {
    componentDidMount() {
        this.fetchProvinces();
        // this.fetchList();
        this.fetchCase();
    }

    /* ###########requests########### */
    fetchProvinces() {
        const { dispatch } = this.props;
        dispatch(loadActions.startLoading());
        return request
            .get('/api/provinces/')
            .then((result) => {
                dispatch(loadActions.successLoadingNoData());
                dispatch(villageFiltersActions.loadProvinces(result.body));
            })
            .catch((err) => {
                dispatch(loadActions.errorLoading(err));
                console.error('Error when fetching provinces', err);
            });
    }

    selectProvince(provinceId) {
        const { dispatch } = this.props;
        if (provinceId) {
            return request
                .get(`/api/zs/?province_id=${provinceId}`)
                .then((result) => {
                    const payload = { zones: result.body, provinceId };
                    dispatch(villageFiltersActions.loadZones(payload));
                })
                .catch((err) => {
                    console.error('Error when fetching zones', err);
                });
        }
        return true;
    }

    selectZone(zoneId) {
        const { dispatch } = this.props;
        if (zoneId) {
            return request
                .get(`/api/as/?zs_id=${zoneId}`)
                .then((result) => {
                    const payload = { areas: result.body, zoneId };
                    dispatch(villageFiltersActions.loadAreas(payload));
                })
                .catch((err) => {
                    console.error('Error when fetching areas', err);
                });
        }
        return true;
    }

    selectArea(areaId, currentTypes) {
        const { dispatch } = this.props;
        if (areaId) {
            return request
                .get(`/api/villages/?as_list=true&as_id=${areaId}&types=${currentTypes.toString()}`)
                .then((result) => {
                    const payload = { villages: result.body, areaId };
                    dispatch(villageFiltersActions.loadVillages(payload));
                })
                .catch((err) => {
                    console.error('Error when fetching areas', err);
                });
        }
        return true;
    }

    selectVillage(villageId) {
        const { dispatch } = this.props;
        dispatch(villageFiltersActions.selectVillage(villageId));
    }

    saveVillage(kaseId, villageObj) {
        const { dispatch } = this.props;
        dispatch(loadActions.startLoading());
        return request
            .patch(`/api/cases/${kaseId}/`)
            .set('Content-Type', 'application/json')
            .send(villageObj)
            .then(() => {
                dispatch(villageFiltersActions.resetFilters());
                this.fetchProvinces();
                this.fetchCase();
            })
            .catch((err) => {
                dispatch(loadActions.errorLoading(err));
                console.error('Error when saving village', err);
            });
    }

    selectType(newType, areaId, currentTypes) {
        const { dispatch } = this.props;
        if (currentTypes.indexOf(newType) > -1) {
            currentTypes.splice(currentTypes.indexOf(newType), 1);
        } else {
            currentTypes.push(newType);
        }
        dispatch(villageFiltersActions.selectType(currentTypes));
        this.selectArea(areaId, currentTypes);
    }

    fetchList() {
        const { dispatch } = this.props;
        dispatch(loadActions.startLoading());
        return request
            .get('/api/cases/')
            .then((result) => {
                dispatch(loadActions.successLoadingNoData());
                dispatch(caseActions.setList(result.body));
            })
            .catch((err) => {
                dispatch(loadActions.errorLoading(err));
                console.error('Error when fetching list of cases', err);
            });
    }


    fetchCase() {
        const { dispatch } = this.props;
        dispatch(loadActions.startLoading());
        return request
            .get('/api/cases/?limit=1')
            .then((result) => {
                dispatch(loadActions.successLoadingNoData());
                dispatch(caseActions.setCase(result.body));
            })
            .catch((err) => {
                dispatch(loadActions.errorLoading(err));
                console.error('Error when fetching case', err);
            });
    }

    render() {
        const { villageFilters } = this.props;
        return (
            <LocatorElement
                villageFilters={villageFilters}
                kase={this.props.kase}
                load={this.props.load}
                selectProvince={provinceId => this.selectProvince(provinceId)}
                selectZone={zoneId => this.selectZone(zoneId)}
                selectArea={(areaId, currentType) => this.selectArea(areaId, currentType)}
                selectVillage={villageId => this.selectVillage(villageId)}
                saveVillage={(kaseId, villageObj) => this.saveVillage(kaseId, villageObj)}
                selectType={(newType, areaId, currentTypes) =>
                    this.selectType(newType, areaId, currentTypes)}
            />
        );
    }
}

LocatorContainer.propTypes = {
    villageFilters: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    kase: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
};

const MapStateToProps = state => ({
    load: state.load,
    villageFilters: state.villageFilters,
    kase: state.kase,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
});

export default connect(MapStateToProps, MapDispatchToProps)(LocatorContainer);
