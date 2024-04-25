import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { useLocation, useNavigate, useParams } from 'react-router-dom';
import SidebarMenu from '../../app/components/SidebarMenuComponent';

import { getFirstAllowedUrl, userHasOneOfPermissions } from '../utils';

import PageError from '../../../components/errors/PageError';
import PageNoPerms from '../../../components/errors/PageNoPerms.tsx';
import { hasFeatureFlag } from '../../../utils/featureFlags';
import { useCurrentUser } from '../../../utils/usersUtils.ts';
import { switchLocale } from '../../app/actions';
import { WrongAccountModal } from './WrongAccountModal.tsx';
import { useParamsObject } from '../../../routing/hooks/useParamsObject.tsx';

const ProtectedRoute = ({ routeConfig, allRoutes, component }) => {
    const { featureFlag, permissions, isRootUrl, baseUrl } = routeConfig;
    const params = useParamsObject(baseUrl);
    const paramsString = useParams()['*'];
    const navigate = useNavigate();
    const location = useLocation();
    const currentUser = useCurrentUser();
    const dispatch = useDispatch();

    // TODO test wrong account feature
    const isWrongAccount = Boolean(
        params?.accountId && params?.accountId !== `${currentUser.account.id}`,
    );

    let isAuthorized =
        permissions.length > 0
            ? userHasOneOfPermissions(permissions, currentUser)
            : true;
    if (featureFlag && !hasFeatureFlag(currentUser, featureFlag)) {
        isAuthorized = false;
    }
    // TODO merge both effects for simpler redirect
    useEffect(() => {
        if (!isAuthorized && isRootUrl) {
            const newBaseUrl = getFirstAllowedUrl(
                permissions,
                currentUser.permissions ?? [],
                allRoutes,
            );
            if (newBaseUrl) {
                navigate(`./${newBaseUrl}`);
            }
        }
    }, [
        allRoutes,
        currentUser,
        isAuthorized,
        isRootUrl,
        navigate,
        permissions,
    ]);

    useEffect(() => {
        // Checking with paramsString because params maybe empty if the config is not correct for useParamsObject
        if (!paramsString.includes('accountId') && currentUser.account) {
            navigate(`./accountId/${currentUser.account.id}/${paramsString}`, {
                replace: true,
                state: location.state ? { ...location.state } : null,
            });
        }
    }, [currentUser.account, baseUrl, navigate, paramsString, location.state]);

    useEffect(() => {
        // Use defined default language if it exists and if the user didn't set it manually
        if (currentUser.language) {
            dispatch(switchLocale(currentUser.language));
        }
    }, [currentUser.language, dispatch]);

    // this should kick in if the above effect didn't redirect the user to a better page
    const hasNoPermWarning =
        isRootUrl &&
        (!currentUser.permissions ||
            (currentUser.permissions.length === 0 && !isAuthorized));
    if (!currentUser) {
        return null;
    }
    return (
        <>
            <SidebarMenu location={location} />
            <WrongAccountModal isOpen={isWrongAccount} />
            {isAuthorized && component}
            {hasNoPermWarning && <PageNoPerms />}
            {!isAuthorized && !hasNoPermWarning && (
                <PageError errorCode="403" />
            )}
        </>
    );
};
ProtectedRoute.defaultProps = {
    allRoutes: [],
};

ProtectedRoute.propTypes = {
    component: PropTypes.node.isRequired,
    allRoutes: PropTypes.array,
    routeConfig: PropTypes.object.isRequired,
};

export default ProtectedRoute;
