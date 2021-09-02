import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import { useQuery } from 'react-query';
import { fetchCompleteness } from './actions';
import TopBar from '../../components/nav/TopBarComponent';
import CompletenessListComponent from './components/CompletenessListComponent';

import MESSAGES from './messages';

const Completeness = ({ params }) => {
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
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
                />
            )}
        </>
    );
};

Completeness.propTypes = {
    params: PropTypes.object.isRequired,
};

export default Completeness;
