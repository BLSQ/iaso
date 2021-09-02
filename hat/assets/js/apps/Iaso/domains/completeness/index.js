import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import { useQuery } from 'react-query';
import TopBar from '../../components/nav/TopBarComponent';
import CompletenessListComponent from './components/CompletenessListComponent';

import MESSAGES from './messages';
import { getRequest } from '../../libs/Api';
import { enqueueSnackbar } from '../../redux/snackBarsReducer';
import { errorSnackBar } from '../../constants/snackBars';

const Completeness = ({ params }) => {
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const { data = [], isFetching } = useQuery(['completeness'], () =>
        getRequest('/api/completeness/')
            .then(res => res.completeness)
            .catch(err =>
                dispatch(
                    enqueueSnackbar(
                        errorSnackBar('fetchCompletenessError', null, err),
                    ),
                ),
            ),
    );

    return (
        <>
            {isFetching && <LoadingSpinner />}
            <TopBar
                title={formatMessage(MESSAGES.completeness)}
                displayBackButton={false}
            />

            <CompletenessListComponent
                completenessList={data}
                params={params}
            />
        </>
    );
};

Completeness.propTypes = {
    params: PropTypes.object.isRequired,
};

export default Completeness;
