import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import PropTypes from 'prop-types';

import SidebarMenu from '../../app/components/SidebarMenuComponent';

import { fetchCurrentUser as fetchCurrentUserAction } from '../actions';
import { redirectTo as redirectToAction } from '../../../routing/actions';

import { userHasOneOfPermissions, getFirstAllowedUrl } from '../utils';

import PageError from '../../../components/errors/PageError';
import { switchLocale } from '../../app/actions';
import { hasFeatureFlag } from '../../../utils/featureFlags';

class ProtectedRoute extends Component {
    componentDidMount() {
        this.props.fetchCurrentUser();
    }

    componentDidUpdate(prevProps) {
        const { isRootUrl, permissions, redirectTo, currentUser, allRoutes } =
            this.props;
        if (currentUser && currentUser !== prevProps.currentUser) {
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
                    redirectTo(newBaseUrl, {});
                }
            }
            // Use defined default language if it exists and if the user didn't set it manually
            if (
                currentUser?.language &&
                currentUser?.language !== prevProps.currentUser?.language
            ) {
                this.props.dispatch(switchLocale(currentUser.language));
            }
        }
    }

    render() {
        const { component, currentUser, permissions, featureFlag, location } =
            this.props;
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
    }
}
ProtectedRoute.defaultProps = {
    currentUser: null,
    permissions: [],
    isRootUrl: false,
    featureFlag: null,
    allRoutes: [],
};

ProtectedRoute.propTypes = {
    fetchCurrentUser: PropTypes.func.isRequired,
    redirectTo: PropTypes.func.isRequired,
    component: PropTypes.node.isRequired,
    permissions: PropTypes.arrayOf(PropTypes.string),
    currentUser: PropTypes.object,
    isRootUrl: PropTypes.bool,
    dispatch: PropTypes.func.isRequired,
    featureFlag: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    allRoutes: PropTypes.array,
    location: PropTypes.object.isRequired,
};

const MapStateToProps = state => ({
    currentUser: state.users.current,
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
