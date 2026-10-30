import React, { useEffect, FunctionComponent, ReactNode } from 'react';
import * as Sentry from '@sentry/browser';
import { useLocation, useNavigate } from 'react-router-dom';
import PageError from '../../../components/errors/PageError';
import PageNoPerms from '../../../components/errors/PageNoPerms';
import { WorkInProgressLocationState } from '../../../components/workInProgress/PageWorkInProgress';
import { baseUrls } from '../../../constants/urls';
import { useParamsObject } from '../../../routing/hooks/useParamsObject';
import { getRawSplat } from '../../../routing/utils';
import { SHOW_DEV_FEATURES, hasFeatureFlag } from '../../../utils/featureFlags';
import { useCurrentUser } from '../../../utils/usersUtils';
import SidebarMenu from '../../app/components/SidebarMenuComponent';
import { getFirstAllowedUrl, userHasOneOfPermissions } from '../utils';
import { WrongAccountModal } from './WrongAccountModal';

type Props = {
    component: ReactNode;
    allRoutes: any[];
    routeConfig: Record<string, any>;
};

const ProtectedRoute: FunctionComponent<Props> = ({
    routeConfig,
    allRoutes = [],
    component,
}) => {
    const {
        featureFlag,
        permissions,
        isRootUrl,
        baseUrl,
        routerUrl,
        dev,
        plannedRelease,
    } = routeConfig;
    const params = useParamsObject(baseUrl);
    const navigate = useNavigate();
    const location = useLocation();
    const paramsString = getRawSplat(location.pathname, routerUrl);
    const currentUser = useCurrentUser();

    // TODO test wrong account feature
    const isWrongAccount = Boolean(
        params?.accountId && params?.accountId !== `${currentUser.account?.id}`,
    );

    let isAuthorized =
        permissions.length > 0
            ? userHasOneOfPermissions(permissions, currentUser)
            : true;
    if (featureFlag && !hasFeatureFlag(currentUser, featureFlag)) {
        isAuthorized = false;
    }
    const isHiddenDevPage =
        Boolean(dev) && !hasFeatureFlag(currentUser, SHOW_DEV_FEATURES);

    useEffect(() => {
        if (isHiddenDevPage) {
            const state: WorkInProgressLocationState = { plannedRelease };
            navigate(`/${baseUrls.workInProgress}`, { replace: true, state });
        }
    }, [isHiddenDevPage, navigate, plannedRelease]);
    // TODO merge both effects for simpler redirect
    useEffect(() => {
        if (!isAuthorized && isRootUrl) {
            const newBaseUrl = getFirstAllowedUrl(
                permissions,
                currentUser.permissions ?? [],
                allRoutes,
            );
            if (newBaseUrl) {
                navigate(`/${newBaseUrl}`);
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
        if (
            !isHiddenDevPage &&
            !(paramsString ?? '').includes('accountId') &&
            currentUser.account
        ) {
            navigate(`./accountId/${currentUser.account.id}/${paramsString}`, {
                replace: true,
                state: location.state ? { ...location.state } : null,
            });
        }
    }, [
        currentUser.account,
        baseUrl,
        navigate,
        paramsString,
        location.state,
        isHiddenDevPage,
    ]);

    useEffect(() => {
        if (currentUser && Sentry?.setUser) {
            Sentry.setUser({
                id: currentUser.id,
                username: currentUser.user_name,
                email: currentUser.email,
                account: currentUser.account?.name,
            });
        }
    }, [currentUser]);
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
            {isAuthorized && !isHiddenDevPage && component}
            {hasNoPermWarning && <PageNoPerms />}
            {!isAuthorized && !hasNoPermWarning && (
                <PageError errorCode="403" />
            )}
        </>
    );
};

export default ProtectedRoute;
