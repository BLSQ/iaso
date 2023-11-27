import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Router } from '../../../../../../hat/assets/js/apps/Iaso/types/general';
import TopBar from '../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import MESSAGES from '../../constants/messages';

type Props = { router: Router };

export const Notifications: FunctionComponent<Props> = ({ router }) => {
    const { params } = router;

    console.log(params);

    const { formatMessage } = useSafeIntl();
    return (
        <TopBar
            title={formatMessage(MESSAGES.notificationsTitle)}
            displayBackButton={false}
        />
    );
};
