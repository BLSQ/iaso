import React, { FunctionComponent } from 'react';

import { useLocation } from 'react-router-dom';
import SidebarMenu from '../../domains/app/components/SidebarMenuComponent';
import { useCurrentUser, useHasNoAccount } from '../../utils/usersUtils';
import PageError from './PageError';

type Props = Omit<React.ComponentProps<typeof PageError>, "displayMenuButton" | "errorCode">

/* Wrap PageError so we can display the sidebar */
const Page404: FunctionComponent<Props> = (props) => {
    const location = useLocation();

    const currentUser = useCurrentUser();

    const hasNoAccount = useHasNoAccount();
    return (
        <>
            {currentUser && !hasNoAccount && (
                <SidebarMenu location={location} />
            )}
            <PageError errorCode="404" displayMenuButton={!hasNoAccount} {...props}/>
        </>
    );
};

export default Page404;
