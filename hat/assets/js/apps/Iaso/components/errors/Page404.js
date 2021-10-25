import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import { fetchCurrentUser } from '../../domains/users/actions';
import SidebarMenu from '../../domains/app/components/SidebarMenuComponent';
import PageError from './PageError';

/* Wrap PageError so we can display the sidebar */
const Page404 = ({ location }) => {
    const dispatch = useDispatch();
    React.useEffect(() => dispatch(fetchCurrentUser()), [dispatch]);
    const currentUser = useSelector(state => state.users.current);
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
