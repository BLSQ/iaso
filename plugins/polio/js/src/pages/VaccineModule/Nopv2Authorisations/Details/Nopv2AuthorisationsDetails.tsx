import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Router } from '../../../../../../../../hat/assets/js/apps/Iaso/types/general';
import MESSAGES from '../../../../constants/messages';
import TopBar from '../../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { Nopv2AuthorisationsDetailsTable } from './Nopv2AuthorisationsDetailsTable';

type Props = {
    router: Router;
};

export const Nopv2AuthorisationsDetails: FunctionComponent<Props> = ({
    router,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.nopv2Auth)}
                displayBackButton
            />
            <Nopv2AuthorisationsDetailsTable params={router.params} />
        </>
    );
};
