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

class ProtectedRoute extends Component {
    componentDidMount() {
        this.props.fetchCurrentUser();
    }

    componentDidUpdate(prevProps) {
        const { isRootUrl, permission, redirectTo, currentUser } = this.props;
        if (currentUser !== prevProps.currentUser) {
            const isAuthorized = permission
                ? userHasPermission(permission, currentUser)
                : true;
            if (!isAuthorized && isRootUrl) {
                const newBaseUrl = getFirstAllowedUrl(permission, currentUser);
                if (newBaseUrl) {
                    redirectTo(newBaseUrl, {});
                }
            }
        }
    }

    render() {
        const { component, currentUser, permission, activeLocale } = this.props;
        const clonedProps = {
            ...this.props,
        };
        delete clonedProps.children;
        const isAuthorized = permission
            ? userHasPermission(permission, currentUser)
            : true;
        if (!currentUser) {
            return null;
        }
        return (
            <MuiPickersUtilsProvider
                utils={MomentUtils}
                locale={activeLocale.code}
            >
                <>
                    <SidebarMenu {...clonedProps} />
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
};

ProtectedRoute.propTypes = {
    fetchCurrentUser: PropTypes.func.isRequired,
    redirectTo: PropTypes.func.isRequired,
    component: PropTypes.node.isRequired,
    permission: PropTypes.any,
    currentUser: PropTypes.object,
    isRootUrl: PropTypes.bool,
    activeLocale: PropTypes.object.isRequired,
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
});

export default connect(MapStateToProps, MapDispatchToProps)(ProtectedRoute);
