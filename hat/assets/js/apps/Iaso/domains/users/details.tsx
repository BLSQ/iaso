import React from 'react';
import { makeStyles } from '@mui/styles';
import { useRedirectTo, useSafeIntl } from 'bluesquare-components';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { UserDetailsView } from 'Iaso/domains/users/components/UserDetailsView';
import MESSAGES from 'Iaso/domains/users/messages';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';

// todo : remove this once IA-4806 has been done
const useStyles = makeStyles(_theme => ({
    '@global': {
        body: {
            overflowX: 'hidden !important',
            overflowY: 'auto !important',
        },
    },
}));

export const Details = () => {
    const { formatMessage } = useSafeIntl();
    const redirectTo = useRedirectTo();
    useStyles();
    const params = useParamsObject(baseUrls.userDetails) as {
        userId?: string;
    };
    const { userId } = params;

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.userDetails)}
                displayBackButton={true}
                goBack={() => redirectTo(baseUrls.users)}
            />
            <UserDetailsView userId={userId} />
        </>
    );
};
