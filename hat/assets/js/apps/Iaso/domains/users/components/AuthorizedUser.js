import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import PropTypes from 'prop-types';

import SidebarMenu from '../../../components/nav/SidebarMenuComponent';

import {
    fetchCurrentUser as fetchCurrentUserAction,
} from '../actions';

import {
    userHasPermission,
} from '../utils';

import PageError from '../../../components/errors/PageError';


class AuthorizedUser extends Component {
    componentDidMount() {
        const {
            fetchCurrentUser,
        } = this.props;
        fetchCurrentUser();
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
AuthorizedUser.defaultProps = {
    currentUser: null,
    permission: null,
};

AuthorizedUser.propTypes = {
    fetchCurrentUser: PropTypes.func.isRequired,
    component: PropTypes.node.isRequired,
    permission: PropTypes.any,
    currentUser: PropTypes.object,
};

const MapStateToProps = state => ({
    reduxPage: state.links.linksPage,
    currentUser: state.users.current,
});

const MapDispatchToProps = dispatch => ({
    ...bindActionCreators({
        fetchCurrentUser: fetchCurrentUserAction,
    }, dispatch),
});

export default connect(MapStateToProps, MapDispatchToProps)(AuthorizedUser);
