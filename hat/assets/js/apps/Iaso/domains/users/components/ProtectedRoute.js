import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import PropTypes from 'prop-types';

import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import SidebarMenu from '../../app/components/SidebarMenuComponent';

import { fetchCurrentUser as fetchCurrentUserAction } from '../actions';
import { redirectTo as redirectToAction } from '../../../routing/actions';

import { userHasPermission, getFirstAllowedUrl } from '../utils';

import PageError from '../../../components/errors/PageError';
import { switchLocale } from '../../app/actions';
import { hasFeatureFlag } from '../../../utils/featureFlags';

class ProtectedRoute extends Component {
    componentDidMount() {
        this.props.fetchCurrentUser();
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
            if (
                currentUser?.language &&
                currentUser?.language !== prevProps.currentUser?.language
            ) {
                this.props.dispatch(switchLocale(currentUser.language));
            }
        }
    }

    render() {
        const {
            component,
            currentUser,
            permission,
            activeLocale,
            featureFlag,
            location,
        } = this.props;

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
            <MuiPickersUtilsProvider
                utils={MomentUtils}
                locale={activeLocale.code}
            >
                <>
                    <SidebarMenu location={location} />
                    {isAuthorized && component}
                    {!isAuthorized && <PageError errorCode="401" />}
                </>
            </MuiPickersUtilsProvider>
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
    location: PropTypes.object.isRequired,
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
