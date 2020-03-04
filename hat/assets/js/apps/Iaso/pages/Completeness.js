import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';

import { fetchCompleteness } from '../domains/completeness/actions';
import { setInstanceStatus } from '../redux/instancesReducer';
import { setPeriodTypes } from '../redux/periodsReducer';
import TopBar from '../components/nav/TopBarComponent';
import LoadingSpinner from '../components/LoadingSpinnerComponent';
import CompletenessListComponent from '../domains/completeness/components/CompletenessListComponent';


class Completeness extends Component {
    componentDidMount() {
        this.props.fetchCompleteness();
    }

    render() {
        const {
            params,
            intl: {
                formatMessage,
            },
            completeness,
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
                    params={params}
                />
            </>
        );
    }
}

Completeness.propTypes = {
    intl: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    completeness: PropTypes.object.isRequired,
    fetchCompleteness: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    completeness: state.completeness,
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
