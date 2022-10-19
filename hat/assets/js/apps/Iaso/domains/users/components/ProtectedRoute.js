import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';

import SidebarMenu from '../../app/components/SidebarMenuComponent';
import { fetchCurrentUser } from '../actions';

import { redirectTo } from '../../../routing/actions';

import { userHasOneOfPermissions, getFirstAllowedUrl } from '../utils';

import PageError from '../../../components/errors/PageError';
import { switchLocale } from '../../app/actions';
import { hasFeatureFlag } from '../../../utils/featureFlags';
import { useCurrentUser } from '../../../utils/usersUtils.ts';

const ProtectedRoute = ({
    isRootUrl,
    permissions,
    allRoutes,
    location,
    featureFlag,
    component,
    params,
}) => {
    const currentUser = useCurrentUser();
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(fetchCurrentUser());
    }, []);

    useEffect(() => {
        if (!params.accountId && currentUser?.account) {
            console.log('REDIRECT', location.pathname);
            dispatch(
                redirectTo(location.pathname, {
                    ...params,
                    accountId: currentUser.account.id,
                }),
            );
        }
    }, [currentUser?.account]);

    useEffect(() => {
        // Use defined default language if it exists and if the user didn't set it manually
        if (currentUser?.language) {
            dispatch(switchLocale(currentUser.language));
        }
    }, [currentUser?.language, dispatch]);

    useEffect(() => {
        const isAuthorized =
            permissions.length > 0
                ? userHasOneOfPermissions(permissions, currentUser)
                : true;
        if (!isAuthorized && isRootUrl) {
            const newBaseUrl = getFirstAllowedUrl(
                permissions,
                currentUser?.permissions ?? [],
                allRoutes,
            );
            if (newBaseUrl) {
                dispatch(redirectTo(newBaseUrl, {}));
            }
        }
    }, [allRoutes, currentUser, dispatch, isRootUrl, permissions]);

    let isAuthorized =
        permissions.length > 0
            ? userHasOneOfPermissions(permissions, currentUser)
            : true;
    if (featureFlag && !hasFeatureFlag(currentUser, featureFlag)) {
        isAuthorized = false;
    }
    if (!currentUser) {
        return null;
    }
    return (
        <>
            <SidebarMenu location={location} />
            {isAuthorized && component}
            {!isAuthorized && <PageError errorCode="401" />}
        </>
    );
};
ProtectedRoute.defaultProps = {
    permissions: [],
    isRootUrl: false,
    featureFlag: null,
    allRoutes: [],
};

ProtectedRoute.propTypes = {
    component: PropTypes.node.isRequired,
    permissions: PropTypes.arrayOf(PropTypes.string),
    isRootUrl: PropTypes.bool,
    featureFlag: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    allRoutes: PropTypes.array,
    location: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
};

export default ProtectedRoute;
