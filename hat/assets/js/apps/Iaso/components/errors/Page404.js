import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch} from 'react-redux';

import { fetchCurrentUser } from '../../domains/users/actions';
import SidebarMenu from '../../domains/app/components/SidebarMenuComponent';
import PageError from './PageError';
import { useCurrentUser } from '../../utils/usersUtils';

/* Wrap PageError so we can display the sidebar */
const Page404 = ({ location }) => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(fetchCurrentUser());
    }, [dispatch]);
    const currentUser = useCurrentUser();
    return (
        <>
            {currentUser && <SidebarMenu location={location} />}
            <PageError errorCode="404" />
        </>
    );
};

Page404.propTypes = {
    location: PropTypes.object.isRequired,
};

export default Page404;
