import React from 'react';
import TopBar from '../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';

import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from './messages';

const test = () => {
    const intl = useSafeIntl();
    return <>
        <TopBar
            title={intl.formatMessage(MESSAGES.title)}
            displayBackButton={false}
        />
    </>;
};

export default test;