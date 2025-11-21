import React from 'react';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import TopBar from '../../components/nav/TopBarComponent';
import snackMessages from '../../components/snackBars/messages';
import CompletenessListComponent from './components/CompletenessListComponent';
import MESSAGES from './messages';

const Completeness = () => {
    const { formatMessage } = useSafeIntl();
    const { data = [], isFetching } = useSnackQuery(
        ['completeness'],
        () => getRequest('/api/completeness/').then(res => res.completeness),
        snackMessages.fetchCompletenessError,
    );

    return (
        <>
            {isFetching && <LoadingSpinner />}
            <TopBar
                title={formatMessage(MESSAGES.completeness)}
                displayBackButton={false}
            />

            <CompletenessListComponent completenessList={data} />
        </>
    );
};

export default Completeness;
