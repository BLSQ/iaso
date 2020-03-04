import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';

import PropTypes from 'prop-types';

import {
    fetchPeriodTypes,
    fetchIsntanceStatus,
} from '../utils/requests';

import { fetchCompleteness } from '../domains/completeness/actions';

import { setInstanceStatus } from '../redux/instancesReducer';
import { setPeriodTypes } from '../redux/periodsReducer';

import { sortPeriodTypes } from '../utils/periodsUtils';

import TopBar from '../components/nav/TopBarComponent';
import LoadingSpinner from '../components/LoadingSpinnerComponent';
import CompletenessListComponent from '../domains/completeness/components/CompletenessListComponent';


class Completeness extends Component {
    componentDidMount() {
        const {
            dispatch,
            intl: {
                formatMessage,
            },
        } = this.props;
        fetchPeriodTypes(dispatch)
            .then(res => this.props.setPeriodTypes(sortPeriodTypes(res.period_types)));
        fetchIsntanceStatus(dispatch)
            .then(res => this.props.setInstanceStatus(res.instance_status.map(s => ({
                key: s[0],
                isVisible: true,
                label: formatMessage({
                    defaultMessage: s[0],
                    id: `iaso.completeness.${s[0]}Multi`,
                }),
            }))));

        this.props.fetchCompleteness();
    }

    render() {
        const {
            params,
            intl: {
                formatMessage,
            },
            completeness,
            instanceStatus,
        } = this.props;

        return (
            <>
                {
                    completeness.fetching
                    && <LoadingSpinner />
                }
                <TopBar
                    title={formatMessage({
                        defaultMessage: 'Completeness',
                        id: 'iaso.completeness.title',
                    })}
                    displayBackButton={false}
                />
                <CompletenessListComponent
                    completenessList={completeness.list}
                    instanceStatusList={instanceStatus}
                    params={params}
                />
            </>
        );
    }
}

Completeness.propTypes = {
    intl: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    params: PropTypes.object.isRequired,
    completeness: PropTypes.object.isRequired,
    fetchCompleteness: PropTypes.func.isRequired,
    setPeriodTypes: PropTypes.func.isRequired,
    setInstanceStatus: PropTypes.func.isRequired,
    instanceStatus: PropTypes.array.isRequired,
};

const MapStateToProps = state => ({
    completeness: state.completeness,
    instanceStatus: state.instances.instanceStatus,
});

const mapDispatchToProps = dispatch => (
    {
        dispatch,
        ...bindActionCreators({
            fetchCompleteness,
            setInstanceStatus,
            setPeriodTypes,
        }, dispatch),
    }
);

export default connect(MapStateToProps, mapDispatchToProps)(injectIntl(Completeness));
