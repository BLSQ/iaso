import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import VectorElement from './pages/Vector';
import {
    fetchSites,
    fetchTargets,
    fetchPaginatedSites,
    fetchPaginatedTargets,
    fetchVillages,
    fetchProfiles,
    fetchHabitats,
    saveSite,
    saveTarget,
} from './utlls/requests';
import { loadActions } from '../../redux/load';
import { filterActions } from '../../redux/filtersRedux';


class VectorContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            siteEdited: undefined,
            targetEdited: undefined,
        };
    }

    componentDidMount() {
        const { params, dispatch } = this.props;
        const promises = [
            this.props.fetchProvinces(),
            fetchProfiles(dispatch),
            fetchHabitats(dispatch),
        ];
        if (params.sites && params.tab === 'map') {
            promises.push(fetchSites(dispatch, params));
        }
        if (params.targets && params.tab === 'map') {
            promises.push(fetchTargets(dispatch, params));
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
        if (params.tab === 'targets') {
            promises.push(fetchPaginatedTargets(dispatch, params, params.targetsPageSize, params.targetsPage, params.orderTargets));
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
            const dateChanged = hasChanged(this.props.params, newProps.params, 'dateFrom') ||
                hasChanged(this.props.params, newProps.params, 'dateTo');
            const userChanged = hasChanged(this.props.params, newProps.params, 'userId');
            const sitesFilterChanged = hasChanged(this.props.params, newProps.params, 'habitats') ||
                hasChanged(this.props.params, newProps.params, 'onlyReferenceSites');
            const sitesTableChanged = hasChanged(this.props.params, newProps.params, 'sitesPage') ||
                hasChanged(this.props.params, newProps.params, 'sitesPageSize') ||
                hasChanged(this.props.params, newProps.params, 'orderSites');
            const targetsTableChanged = hasChanged(this.props.params, newProps.params, 'targetsPage') ||
                hasChanged(this.props.params, newProps.params, 'targetsPageSize') ||
                hasChanged(this.props.params, newProps.params, 'orderTargets');
            const geoChanged = hasChanged(this.props.params, newProps.params, 'province_id') ||
                hasChanged(this.props.params, newProps.params, 'zs_id') ||
                hasChanged(this.props.params, newProps.params, 'as_id');

            if ((dateChanged && newProps.params.sites) ||
                (userChanged && newProps.params.sites) ||
                (sitesFilterChanged && newProps.params.sites) ||
                (geoChanged && newProps.params.sites) ||
                (newProps.params.sites && !this.props.vectors.sites && newProps.params.tab === 'map')) {
                promises.push(fetchSites(dispatch, newProps.params));
            }
            if ((dateChanged && newProps.params.targets) ||
                (userChanged && newProps.params.targets) ||
                (geoChanged && newProps.params.targets) ||
                (newProps.params.targets && !this.props.vectors.targets && newProps.params.tab === 'map')) {
                promises.push(fetchTargets(dispatch, newProps.params));
            }
            if ((dateChanged && newProps.params.endemicVillages) ||
                (geoChanged && newProps.params.endemicVillages) ||
                (newProps.params.endemicVillages && !this.props.vectors.endemicVillages && newProps.params.tab === 'map')) {
                promises.push(fetchVillages(dispatch, newProps.params, true));
            }
            if ((dateChanged && newProps.params.nonEndemicVillages) ||
                (geoChanged && newProps.params.nonEndemicVillages) ||
                (newProps.params.nonEndemicVillages && !this.props.vectors.nonEndemicVillages && newProps.params.tab === 'map')) {
                promises.push(fetchVillages(dispatch, newProps.params, false));
            }

            if (dateChanged ||
                userChanged ||
                sitesFilterChanged ||
                geoChanged ||
                ((sitesTableChanged || !this.props.vectors.sitesPage.list) && newProps.params.tab === 'sites')) {
                promises.push(fetchPaginatedSites(dispatch, newProps.params, newProps.params.sitesPageSize, newProps.params.sitesPage, newProps.params.orderSites));
            }
            if (dateChanged ||
                userChanged ||
                geoChanged ||
                ((targetsTableChanged || !this.props.vectors.targetsPage.list) && newProps.params.tab === 'targets')) {
                promises.push(fetchPaginatedTargets(dispatch, newProps.params, newProps.params.targetsPageSize, newProps.params.targetsPage, newProps.params.orderTargets));
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

    saveSite(site) {
        this.setState({
            siteEdited: site,
        });
        const { params, dispatch } = this.props;
        this.props.saveSiteRequest(site).then(() => {
            if (params.tab === 'sites') {
                fetchSites(dispatch, params);
            }
            fetchPaginatedSites(dispatch, params, params.sitesPageSize, params.sitesPage, params.orderSites);
        });
    }

    saveTarget(target) {
        this.setState({
            targetEdited: target,
        });
        this.props.saveTargetRequest(target).then(() => {
            const { params, dispatch } = this.props;
            if (params.tab === 'targets') {
                fetchTargets(dispatch, params);
            }
            fetchPaginatedTargets(dispatch, params, params.sitesPageSize, params.sitesPage, params.orderSites);
        });
    }

    render() {
        return (
            <VectorElement
                params={this.props.params}
                saveSite={site => this.saveSite(site)}
                saveTarget={target => this.saveTarget(target)}
                siteEdited={this.state.siteEdited}
                targetEdited={this.state.targetEdited}
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
    saveSiteRequest: PropTypes.func.isRequired,
    saveTargetRequest: PropTypes.func.isRequired,
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
    saveSiteRequest: site => saveSite(dispatch, site),
    saveTargetRequest: target => saveTarget(dispatch, target),
});

export default connect(MapStateToProps, MapDispatchToProps)(VectorContainer);
