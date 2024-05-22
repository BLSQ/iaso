import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { useLocation } from 'react-router-dom';
import { fetchCurrentUser } from '../../domains/users/actions';
import SidebarMenu from '../../domains/app/components/SidebarMenuComponent';
import PageError from './PageError';
import { useCurrentUser, useHasNoAccount } from '../../utils/usersUtils.ts';

/* Wrap PageError so we can display the sidebar */
const Page404 = () => {
    const location = useLocation();
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(fetchCurrentUser());
    }, [dispatch]);
    const currentUser = useCurrentUser();

    const hasNoAccount = useHasNoAccount();
    return (
        <>
            {currentUser && !hasNoAccount && (
                <SidebarMenu location={location} />
            )}
            <PageError errorCode="404" displayMenuButton={!hasNoAccount} />
        </>
    );
};

export default Page404;
