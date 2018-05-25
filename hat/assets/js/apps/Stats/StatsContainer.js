import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { clone } from '../../utils';
import { fetchUrls, checkLocation } from '../../utils/fetchData';
import StatsComponent from './Stats';

export const urls = [
    {
        name: 'timeseries',
        url: '/api/datasets/cases_over_time',
        mock: [],
    },
    {
        name: 'coverage',
        url: '/api/datasets/population_coverage',
        mock: [],
    },
    {
        name: 'locations',
        url: '/api/datasets/list_locations/',
        mock: ['Yasa Bonga'],
    },
    {
        name: 'total',
        url: '/api/datasets/count_total/',
        mock: {
            tested: 1401, female: 818, male: 583, registered: 1401,
        },
    },
    {
        name: 'screening',
        url: '/api/datasets/count_screened/',
        mock: {
            negative: 1330, total: 1401, missing_confirmation: 71, positive: 71,
        },
    },
    {
        name: 'confirmation',
        url: '/api/datasets/count_confirmed/',
        mock: { negative: 0, total: 0, positive: 0 },
    },
    {
        name: 'staging',
        url: '/api/datasets/count_staging/',
        mock: { stage1: 0, total: 0, stage2: 0 },
    },
    {
        name: 'unmatch',
        url: '/api/metrics/unmatch/',
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

    componentWillReceiveProps(newProps) {
        this.loadData(newProps.params);
    }

    loadData(params) {
        const { dispatch } = this.props;
        const oldParams = clone(this.currentParams);
        this.currentParams = clone(params);
        fetchUrls(urls, params, oldParams, dispatch, checkLocation);
    }

    render(props) {
        return <StatsComponent params={this.props.params} />;
    }
}

StatsContainer.propTypes = {
    params: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
};

export default connect()(StatsContainer);
