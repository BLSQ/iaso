import { push } from 'react-router-redux';
import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { clone } from '../../utils';
import { createUrl, fetchUrls } from '../../utils/fetchData';
import StatsComponent from './Stats';
import { filterActions } from '../../redux/filters';


export const urls = [
    {
        name: 'unmatch',
        url: '/api/metrics/unmatch/',
        mock: [],
    },
    {
        name: 'casecount',
        url: '/api/metrics/casecount/',
        mock: [],
    },
    {
        name: 'coverage',
        url: '/api/stats/',
        mock: [],
    },
    {
        name: 'positiveScreeningRate',
        url: '/api/stats/?stat=positiveScreeningRate',
        mock: [],
    },
    {
        name: 'confirmationsRate',
        url: '/api/stats/?stat=confirmationsRate',
        mock: [],
    },
];

export class StatsContainer extends Component {
    constructor(props) {
        super(props);
        this.currentParams = '';
    }

    componentDidMount() {
        this.loadData(this.props.params);
    }
    componentWillReceiveProps(nextProps) {
        if ((nextProps.params.date_from !== this.props.params.date_from) ||
            (nextProps.params.date_to !== this.props.params.date_to) ||
            (nextProps.params.province_id !== this.props.params.province_id) ||
            (nextProps.params.as_id !== this.props.params.as_id) ||
            (nextProps.params.zs_id !== this.props.params.zs_id)) {
            this.loadData(nextProps.params);
        }
    }

    loadData(params) {
        const { dispatch } = this.props;
        const oldParams = clone(this.currentParams);
        this.currentParams = clone(params);
        fetchUrls(urls, params, oldParams, dispatch);
    }

    render(props) {
        return <StatsComponent params={this.props.params} load={this.props.load} />;
    }
}

StatsContainer.propTypes = {
    load: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    filters: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,

};

const MapStateToProps = state => ({
    load: state.load,
    filters: state.filters,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    fetchTeams: () => dispatch(filterActions.fetchTeams(dispatch)),
    fetchCoordinations: () => dispatch(filterActions.fetchCoordinations(dispatch)),
    fetchProvinces: () => dispatch(filterActions.fetchProvinces(dispatch)),
    selectProvince: provinceId => dispatch(filterActions.selectProvince(provinceId, dispatch)),
    selectVillage: villageId => dispatch(filterActions.selectVillage(villageId, dispatch)),
    selectZone: (zoneId, areaId, villageId) => dispatch(filterActions.selectZone(zoneId, dispatch, true, areaId, villageId)),
    selectArea: (areaId, villageId) => dispatch(filterActions.selectArea(areaId, dispatch, true, null, villageId)),
});

const StatsWithIntl = injectIntl(StatsContainer);
export default connect(MapStateToProps, MapDispatchToProps)(StatsWithIntl);
