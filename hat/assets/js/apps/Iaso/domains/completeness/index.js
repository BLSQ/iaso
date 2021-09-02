import React from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import { useQuery } from 'react-query';
import {
    fetchCompleteness,
    generateDerivedInstances as generateDerivedInstancesAction,
} from './actions';
import TopBar from '../../components/nav/TopBarComponent';
import { redirectTo as redirectToAction } from '../../routing/actions';
import CompletenessListComponent from './components/CompletenessListComponent';

import MESSAGES from './messages';

const Completeness = ({
    onGenerateDerivedInstances,
    dispatch,
    params,
    redirectTo,
}) => {
    const { formatMessage } = useSafeIntl();
    const { data, isFetching } = useQuery(
        ['completness'],
        fetchCompleteness(dispatch),
        [],
    );

    return (
        <>
            {isFetching && <LoadingSpinner />}
            <TopBar
                title={formatMessage(MESSAGES.completeness)}
                displayBackButton={false}
            />
            {data && (
                <CompletenessListComponent
                    completenessList={data}
                    params={params}
                    redirectTo={redirectTo}
                    onGenerateDerivedInstances={onGenerateDerivedInstances}
                />
            )}
        </>
    );
};

Completeness.propTypes = {
    params: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    onGenerateDerivedInstances: PropTypes.func.isRequired,
};

const MapStateToProps = () => ({});

const mapDispatchToProps = dispatch => ({
    ...bindActionCreators(
        {
            redirectTo: redirectToAction,
            onGenerateDerivedInstances: generateDerivedInstancesAction,
        },
        dispatch,
    ),
    dispatch,
});

export default connect(MapStateToProps, mapDispatchToProps)(Completeness);
