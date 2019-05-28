import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import VectorDashboard from './pages/Vector';
import {
    fetchSites,
    fetchTraps,
    fetchTargets,
    fetchCatches,
    fetchPaginatedTraps,
    fetchPaginatedTargets,
    fetchPaginatedCatches,
    fetchVillages,
    fetchProfiles,
    fetchTeams,
    fetchHabitats,
    saveTrap,
    saveTarget,
    saveSite,
    fetchPaginatedSites,
} from './utlls/requests';
import { loadActions } from '../../redux/load';
import { filterActions } from '../../redux/filtersRedux';
import { vectorActions } from './redux/vectorReducer';
import { currentUserActions } from '../../redux/currentUserReducer';


class VectorContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            siteEdited: null,
            trapEdited: null,
            targetEdited: null,
            catchEdited: null,
        };
    }

    componentDidMount() {
        const { params, dispatch } = this.props;
        const promises = [
            this.props.fetchProvinces(),
            fetchProfiles(dispatch),
            fetchTeams(dispatch),
            fetchHabitats(dispatch),
            this.props.fetchCurrentUserInfos(),
        ];
        if (params.sites && params.tab === 'map') {
            promises.push(fetchSites(dispatch, params));
        }
        if (params.traps && params.tab === 'map') {
            promises.push(fetchTraps(dispatch, params));
        }
        if (params.targets && params.tab === 'map') {
            promises.push(fetchTargets(dispatch, params));
        }
        if (params.catches && params.tab === 'map') {
            promises.push(fetchCatches(dispatch, params));
        }
        if (params.endemicVillages === 'true' && params.tab === 'map') {
            promises.push(fetchVillages(dispatch, params, true));
        }
        if (params.nonEndemicVillages === 'true' && params.tab === 'map') {
            promises.push(fetchVillages(dispatch, params, false));
        }
        if (params.tab === 'sites') {
            promises.push(fetchPaginatedSites(dispatch, params, params.sitesPageSize, params.sitesPage, params.orderSites));
        }
        if (params.tab === 'traps') {
            promises.push(fetchPaginatedTraps(dispatch, params, params.sitesPageSize, params.sitesPage, params.orderSites));
        }
        if (params.tab === 'targets') {
            promises.push(fetchPaginatedTargets(dispatch, params, params.targetsPageSize, params.targetsPage, params.orderTargets));
        }
        if (params.tab === 'catches') {
            promises.push(fetchPaginatedCatches(dispatch, params, params.catchesPageSize, params.catchesPage, params.ordercatches));
        }
        dispatch(loadActions.startLoading());
        Promise.all(promises).then(() => {
            if (this.props.params.province_id) {
                this.props.selectProvince(this.props.params.province_id, this.props.params.zs_id, this.props.params.as_id, this.props.params.village_id, true);
            } else if (this.props.params.zs_id) {
                this.props.selectZone(this.props.params.zs_id, this.props.params.as_id, this.props.params.village_id, true);
            } else if (this.props.params.as_id) {
                this.props.selectArea(this.props.params.as_id, null, this.props.params.zs_id, true);
            } else {
                dispatch(loadActions.successLoadingNoData());
            }
        }).catch((err) => {
            dispatch(loadActions.errorLoading(err));
        });
    }


    componentWillReceiveProps(newProps) {
        const { dispatch } = this.props;
        if (!newProps.load.loading && !this.props.load.loading) {
            const promises = [];
            if (newProps.params.province_id !== this.props.params.province_id) {
                promises.push(this.props.selectProvince(newProps.params.province_id, newProps.params.zs_id, newProps.params.as_id, newProps.params.village_id, false));
            } else if (newProps.params.zs_id !== this.props.params.zs_id) {
                promises.push(this.props.selectZone(newProps.params.zs_id, newProps.params.as_id, newProps.params.village_id, false));
            } else if (newProps.params.as_id !== this.props.params.as_id) {
                promises.push(this.props.selectArea(newProps.params.as_id, null, newProps.params.zs_id, false));
            }

            const hasChanged = (prev, curr, key) => (prev[key] !== curr[key]);
            const sitesTableChanged = hasChanged(this.props.params, newProps.params, 'sitesPage') ||
                hasChanged(this.props.params, newProps.params, 'sitesPageSize') ||
                hasChanged(this.props.params, newProps.params, 'orderSites');
            const trapsTableChanged = hasChanged(this.props.params, newProps.params, 'trapsPage') ||
                hasChanged(this.props.params, newProps.params, 'trapsPageSize') ||
                hasChanged(this.props.params, newProps.params, 'orderTraps');
            const targetsTableChanged = hasChanged(this.props.params, newProps.params, 'targetsPage') ||
                hasChanged(this.props.params, newProps.params, 'targetsPageSize') ||
                hasChanged(this.props.params, newProps.params, 'orderTargets');
            const catchesTableChanged = hasChanged(this.props.params, newProps.params, 'catchesPage') ||
                hasChanged(this.props.params, newProps.params, 'catchesPageSize') ||
                hasChanged(this.props.params, newProps.params, 'orderCatches');
            if (newProps.params.sites && !this.props.vectors.sites && newProps.params.tab === 'map') {
                promises.push(fetchSites(dispatch, newProps.params));
            }
            if (newProps.params.traps && !this.props.vectors.traps && newProps.params.tab === 'map') {
                promises.push(fetchTraps(dispatch, newProps.params));
            }
            if (newProps.params.targets && !this.props.vectors.targets && newProps.params.tab === 'map') {
                promises.push(fetchTargets(dispatch, newProps.params));
            }
            if (newProps.params.catches && !this.props.vectors.catches && newProps.params.tab === 'map') {
                promises.push(fetchCatches(dispatch, newProps.params));
            }
            if (newProps.params.endemicVillages && !this.props.vectors.endemicVillages && newProps.params.tab === 'map') {
                promises.push(fetchVillages(dispatch, newProps.params, true));
            }
            if (newProps.params.nonEndemicVillages && !this.props.vectors.nonEndemicVillages && newProps.params.tab === 'map') {
                promises.push(fetchVillages(dispatch, newProps.params, false));
            }
            if ((sitesTableChanged || !this.props.vectors.sitesPage.list) && newProps.params.tab === 'sites') {
                promises.push(fetchPaginatedSites(dispatch, newProps.params, newProps.params.sitesPageSize, newProps.params.sitesPage, newProps.params.orderSites));
            }

            if ((trapsTableChanged || !this.props.vectors.trapsPage.list) && newProps.params.tab === 'traps') {
                promises.push(fetchPaginatedTraps(dispatch, newProps.params, newProps.params.trapsPageSize, newProps.params.trapsPage, newProps.params.orderTraps));
            }
            if ((targetsTableChanged || !this.props.vectors.targetsPage.list) && newProps.params.tab === 'targets') {
                promises.push(fetchPaginatedTargets(dispatch, newProps.params, newProps.params.targetsPageSize, newProps.params.targetsPage, newProps.params.orderTargets));
            }
            if ((catchesTableChanged || !this.props.vectors.catchesPage.list) && newProps.params.tab === 'catches') {
                promises.push(fetchPaginatedCatches(dispatch, newProps.params, newProps.params.catchesPageSize, newProps.params.catchesPage, newProps.params.ordercCatches));
            }
            if (promises.length > 0) {
                dispatch(loadActions.startLoading());
                Promise.all(promises).then(() => {
                    dispatch(loadActions.successLoadingNoData());
                }).catch((err) => {
                    dispatch(loadActions.errorLoading(err));
                });
            }
        }
    }

    onSearch() {
        const { dispatch, params } = this.props;
        if (!this.props.load.loading) {
            const promises = [];
            if (params.sites) {
                promises.push(fetchSites(dispatch, params));
            }
            if (params.traps) {
                promises.push(fetchTraps(dispatch, params));
            }
            if (params.targets) {
                promises.push(fetchTargets(dispatch, params));
            }
            if (params.catches) {
                promises.push(fetchCatches(dispatch, params));
            }
            if (params.endemicVillages) {
                promises.push(fetchVillages(dispatch, params, true));
            }
            if (params.nonEndemicVillages) {
                promises.push(fetchVillages(dispatch, params, false));
            }
            promises.push(fetchPaginatedSites(dispatch, params, params.sitesPageSize, params.sitesPage, params.orderSites));
            promises.push(fetchPaginatedTraps(dispatch, params, params.trapsPageSize, params.trapsPage, params.orderTraps));
            promises.push(fetchPaginatedTargets(dispatch, params, params.targetsPageSize, params.targetsPage, params.orderTargets));
            promises.push(fetchPaginatedCatches(dispatch, params, params.catchesPageSize, params.catchesPage, params.orderCatches));
            dispatch(loadActions.startLoading());
            Promise.all(promises).then(() => {
                dispatch(loadActions.successLoadingNoData());
            }).catch((err) => {
                dispatch(loadActions.errorLoading(err));
            });
        }
    }

    saveSite(site) {
        this.setState({
            siteEdited: site,
        });
        const { params, dispatch } = this.props;
        this.props.saveSiteRequest(site).then(() => {
            if (params.sites) {
                fetchSites(dispatch, params);
            }
            fetchPaginatedSites(dispatch, params, params.sitesPageSize, params.sitesPage, params.orderSites);
        });
    }

    saveTrap(trap) {
        this.setState({
            trapEdited: trap,
        });
        const { params, dispatch } = this.props;
        return this.props.saveTrapRequest(trap).then(() => {
            if (params.traps) {
                fetchTraps(dispatch, params);
            }
            fetchPaginatedTraps(dispatch, params, params.sitesPageSize, params.sitesPage, params.orderSites);
        });
    }

    saveTarget(target) {
        this.setState({
            targetEdited: target,
        });
        this.props.saveTargetRequest(target).then(() => {
            const { params, dispatch } = this.props;
            if (params.tab) {
                fetchTargets(dispatch, params);
            }
            fetchPaginatedTargets(dispatch, params, params.sitesPageSize, params.sitesPage, params.orderSites);
        });
    }

    render() {
        return (
            <VectorDashboard
                params={this.props.params}
                saveSite={site => this.saveSite(site)}
                saveTrap={trap => this.saveTrap(trap)}
                saveTarget={target => this.saveTarget(target)}
                siteEdited={this.state.siteEdited}
                trapEdited={this.state.trapEdited}
                targetEdited={this.state.targetEdited}
                catchEdited={this.state.catchEdited}
                onSearch={() => this.onSearch()}
            />
        );
    }
}


VectorContainer.propTypes = {
    dispatch: PropTypes.func.isRequired,
    params: PropTypes.object.isRequired,
    vectors: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    fetchProvinces: PropTypes.func.isRequired,
    selectProvince: PropTypes.func.isRequired,
    selectZone: PropTypes.func.isRequired,
    selectArea: PropTypes.func.isRequired,
    saveTrapRequest: PropTypes.func.isRequired,
    saveTargetRequest: PropTypes.func.isRequired,
    saveSiteRequest: PropTypes.func.isRequired,
    fetchCurrentUserInfos: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    load: state.load,
    infos: state.infos,
    vectors: state.vectors,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    fetchProvinces: () => dispatch(filterActions.fetchProvinces(dispatch)),
    selectProvince: (provinceId, zoneId, areaId, villageId, removeLoading) => dispatch(filterActions.selectProvince(provinceId, dispatch, zoneId, areaId, villageId, false, removeLoading)),
    selectZone: (zoneId, areaId, villageId, removeLoading) => dispatch(filterActions.selectZone(zoneId, dispatch, false, areaId, villageId, removeLoading)),
    selectArea: (areaId, villageId, zoneId, removeLoading) => dispatch(filterActions.selectArea(areaId, dispatch, false, zoneId, villageId, removeLoading)),
    saveTrapRequest: trap => saveTrap(dispatch, trap),
    saveSiteRequest: site => saveSite(dispatch, site),
    saveTargetRequest: target => saveTarget(dispatch, target),
    fetchCurrentUserInfos: () => dispatch(currentUserActions.fetchCurrentUserInfos(dispatch)),
});

export default connect(MapStateToProps, MapDispatchToProps)(VectorContainer);
