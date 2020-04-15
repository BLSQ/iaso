import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import PropTypes from 'prop-types';

import SidebarMenu from '../../../components/nav/SidebarMenuComponent';

import {
    fetchUsersProfiles as fetchUsersProfilesAction,
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
            fetchUsersProfiles,
        } = this.props;
        fetchUsersProfiles();
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
        const isAuthorized = userHasPermission(permission, currentUser);
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
};

AuthorizedUser.propTypes = {
    fetchUsersProfiles: PropTypes.func.isRequired,
    fetchCurrentUser: PropTypes.func.isRequired,
    component: PropTypes.node.isRequired,
    permission: PropTypes.string.isRequired,
    currentUser: PropTypes.object,
};

const MapStateToProps = state => ({
    reduxPage: state.links.linksPage,
    currentUser: state.users.current,
});

const MapDispatchToProps = dispatch => ({
    ...bindActionCreators({
        fetchUsersProfiles: fetchUsersProfilesAction,
        fetchCurrentUser: fetchCurrentUserAction,
    }, dispatch),
});

export default connect(MapStateToProps, MapDispatchToProps)(AuthorizedUser);
