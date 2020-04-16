import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';

import { fetchCompleteness as fetchCompletenessAction } from './actions';
import { redirectTo as redirectToAction } from '../../routing/actions';
import TopBar from '../../components/nav/TopBarComponent';
import LoadingSpinner from '../../components/LoadingSpinnerComponent';
import CompletenessListComponent from './components/CompletenessListComponent';

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
            redirectTo,
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
                    redirectTo={redirectTo}
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
    redirectTo: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    completeness: state.completeness,
});

const mapDispatchToProps = dispatch => (
    {
        ...bindActionCreators({
            fetchCompleteness: fetchCompletenessAction,
            redirectTo: redirectToAction,
        }, dispatch),
    }
);

export default connect(MapStateToProps, mapDispatchToProps)(injectIntl(Completeness));
