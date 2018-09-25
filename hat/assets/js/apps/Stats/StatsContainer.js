import React, { Component } from 'react';
import { injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { clone } from '../../utils';
import { fetchUrls } from '../../utils/fetchData';
import StatsComponent from './Stats';

export const urls = [
    {
        name: 'provinces',
        url: '/api/provinces/',
        mock: [{
            name: 'Buele',
            old_name: '',
            id: 29,
        }],
    },
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
            (nextProps.params.province_id !== this.props.params.province_id)) {
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
    dispatch: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    load: state.load,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
});

const StatsWithIntl = injectIntl(StatsContainer);
export default connect(MapStateToProps, MapDispatchToProps)(StatsWithIntl);
