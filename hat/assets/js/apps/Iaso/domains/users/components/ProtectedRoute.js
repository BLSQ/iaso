import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import PropTypes from 'prop-types';

import SidebarMenu from '../../../components/nav/SidebarMenuComponent';

import {
    fetchCurrentUser as fetchCurrentUserAction,
} from '../actions';
import { redirectTo as redirectToAction } from '../../../routing/actions';

import {
    userHasPermission,
    getFirstAllowedUrl,
} from '../utils';

import PageError from '../../../components/errors/PageError';


class ProtectedRoute extends Component {
    componentDidMount() {
        const {
            fetchCurrentUser,
            isRootUrl,
            permission,
            redirectTo,
        } = this.props;
        fetchCurrentUser().then((currentUser) => {
            const isAuthorized = permission ? userHasPermission(permission, currentUser) : true;
            if (!isAuthorized && isRootUrl) {
                const newBaseUrl = getFirstAllowedUrl(permission, currentUser);
                if (newBaseUrl) {
                    redirectTo(newBaseUrl, {});
                }
            }
        });
    }

    render() {
        const {
            component,
            currentUser,
            permission,
        } = this.props;
        const clonedProps = {
            ...this.props,
        };
        delete clonedProps.children;
        const isAuthorized = permission ? userHasPermission(permission, currentUser) : true;
        if (!currentUser) {
            return null;
        }
        return (
            <>
                <SidebarMenu {...clonedProps} />
                {
                    isAuthorized
                    && (
                        component
                    )
                }
                {
                    !isAuthorized
                    && (
                        <PageError errorCode="401" />
                    )
                }
            </>
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
};

const MapStateToProps = state => ({
    reduxPage: state.links.linksPage,
    currentUser: state.users.current,
});

const MapDispatchToProps = dispatch => ({
    ...bindActionCreators({
        fetchCurrentUser: fetchCurrentUserAction,
        redirectTo: redirectToAction,
    }, dispatch),
});

export default connect(MapStateToProps, MapDispatchToProps)(ProtectedRoute);
