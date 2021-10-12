import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import PropTypes from 'prop-types';

import SidebarMenu from '../../app/components/SidebarMenuComponent';

import { fetchCurrentUser as fetchCurrentUserAction } from '../actions';
import { redirectTo as redirectToAction } from '../../../routing/actions';

import { userHasPermission, getFirstAllowedUrl } from '../utils';

import PageError from '../../../components/errors/PageError';
import { switchLocale } from '../../app/actions';
import { setCookie, getCookie } from '../../../utils/cookies';

import { setLocale } from '../../../utils/dates';
import { hasFeatureFlag } from '../../../utils/featureFlags';

class ProtectedRoute extends Component {
    componentDidMount() {
        this.props.fetchCurrentUser();
        const { activeLocale } = this.props;
        setLocale(activeLocale.code);
    }

    componentDidUpdate(prevProps) {
        const { isRootUrl, permission, redirectTo, currentUser, allRoutes } =
            this.props;
        if (currentUser && currentUser !== prevProps.currentUser) {
            const isAuthorized = permission
                ? userHasPermission(permission, currentUser)
                : true;
            if (!isAuthorized && isRootUrl) {
                const newBaseUrl = getFirstAllowedUrl(
                    permission,
                    currentUser,
                    allRoutes,
                );
                if (newBaseUrl) {
                    redirectTo(newBaseUrl, {});
                }
            }
            // Use defined default language if it exists and if the user didn't set it manually
            if (currentUser?.language && !getCookie('django_language')) {
                setCookie('django_language', currentUser.language);
                setLocale(currentUser.language);
                this.props.dispatch(switchLocale(currentUser.language));
            }
        }
    }

    render() {
        const { component, currentUser, permission, featureFlag } = this.props;
        const clonedProps = {
            ...this.props,
        };
        delete clonedProps.children;
        let isAuthorized = permission
            ? userHasPermission(permission, currentUser)
            : true;
        if (featureFlag && !hasFeatureFlag(currentUser, featureFlag)) {
            isAuthorized = false;
        }
        if (!currentUser) {
            return null;
        }
        return (
            <>
                <SidebarMenu {...clonedProps} />
                {isAuthorized && component}
                {!isAuthorized && <PageError errorCode="401" />}
            </>
        );
    }
}
ProtectedRoute.defaultProps = {
    currentUser: null,
    permission: null,
    isRootUrl: false,
    featureFlag: null,
    allRoutes: [],
};

ProtectedRoute.propTypes = {
    fetchCurrentUser: PropTypes.func.isRequired,
    redirectTo: PropTypes.func.isRequired,
    component: PropTypes.node.isRequired,
    permission: PropTypes.any,
    currentUser: PropTypes.object,
    isRootUrl: PropTypes.bool,
    activeLocale: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    featureFlag: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    allRoutes: PropTypes.array,
};

const MapStateToProps = state => ({
    currentUser: state.users.current,
    activeLocale: state.app.locale,
});

const MapDispatchToProps = dispatch => ({
    ...bindActionCreators(
        {
            fetchCurrentUser: fetchCurrentUserAction,
            redirectTo: redirectToAction,
        },
        dispatch,
    ),
    dispatch,
});

export default connect(MapStateToProps, MapDispatchToProps)(ProtectedRoute);
