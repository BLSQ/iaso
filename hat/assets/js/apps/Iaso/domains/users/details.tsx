import React from 'react';
import { useRedirectTo, useSafeIntl } from 'bluesquare-components';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { UserDetailsView } from 'Iaso/domains/users/components/UserDetailsView';
import MESSAGES from 'Iaso/domains/users/messages';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';

export const Details = () => {
    const { formatMessage } = useSafeIntl();
    const redirectTo = useRedirectTo();
    const params = useParamsObject(baseUrls.userDetails) as {
        userId?: string;
    };
    const { userId } = params;

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.users)}
                displayBackButton={true}
                goBack={() => redirectTo(baseUrls.users)}
            />
            <UserDetailsView userId={userId} />
        </>
    );
}