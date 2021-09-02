import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import {
    fetchCompleteness as fetchCompletenessAction,
    generateDerivedInstances as generateDerivedInstancesAction,
} from './actions';
import TopBar from '../../components/nav/TopBarComponent';
import { redirectTo as redirectToAction } from '../../routing/actions';
import CompletenessListComponent from './components/CompletenessListComponent';

import MESSAGES from './messages';

const Completeness = ({
    completeness,
    fetchCompleteness,
    onGenerateDerivedInstances,
    params,
    redirectTo,
}) => {
    useEffect(() => fetchCompleteness(), []);
    const { formatMessage } = useSafeIntl();

    return (
        <>
            {completeness.fetching && <LoadingSpinner />}
            <TopBar
                title={formatMessage(MESSAGES.completeness)}
                displayBackButton={false}
            />
            <CompletenessListComponent
                completenessList={completeness.list}
                params={params}
                redirectTo={redirectTo}
                onGenerateDerivedInstances={onGenerateDerivedInstances}
            />
        </>
    );
};

Completeness.propTypes = {
    params: PropTypes.object.isRequired,
    completeness: PropTypes.object.isRequired,
    fetchCompleteness: PropTypes.func.isRequired,
    redirectTo: PropTypes.func.isRequired,
    onGenerateDerivedInstances: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    completeness: state.completeness,
});

const mapDispatchToProps = dispatch => ({
    ...bindActionCreators(
        {
            fetchCompleteness: fetchCompletenessAction,
            redirectTo: redirectToAction,
            onGenerateDerivedInstances: generateDerivedInstancesAction,
        },
        dispatch,
    ),
});

export default connect(MapStateToProps, mapDispatchToProps)(Completeness);
