import React, { useMemo } from 'react';
import TopBar from '../../../components/nav/TopBarComponent';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import MESSAGES from './messages';
const GroupSet = () => {
    const isLoading = false;
    const { formatMessage } = useSafeIntl();
    return (
        <>
            {isLoading && <LoadingSpinner />}
            <TopBar
                title={formatMessage(MESSAGES.groupSet)}
                displayBackButton={true}
            />
            <h1>Detail TODO</h1>
        </>
    );
};

export default GroupSet;
