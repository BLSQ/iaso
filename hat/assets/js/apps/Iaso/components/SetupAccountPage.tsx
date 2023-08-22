import React, { FunctionComponent } from 'react';

import { UrlParams } from 'bluesquare-components';
import { useCurrentUser } from '../utils/usersUtils';
import TopBar from './nav/TopBarComponent';

type Props = {
    params: UrlParams;
};

export const SetupAccount: FunctionComponent<Props> = ({ params }) => {
    const currentUser = useCurrentUser();
    return (
        <>
            <TopBar
                displayBackButton={false}
                displayMenuButton={false}
                title="SETUP"
            />
            SETUP ACCOUNT {currentUser.user_name}
        </>
    );
};
