import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import PropTypes from 'prop-types';

import {
    fetchUsersProfiles as fetchUsersProfilesAction,
    fetchCurrentUser as fetchCurrentUserAction,
} from '../actions';


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
            children,
            fetching,
        } = this.props;
        const isAuthorized = true;
        if (fetching) {
            return null;
        }
        return (
            <>
                {
                    isAuthorized
                    && (
                        children
                    )
                }
                {
                    !isAuthorized
                    && (
                        'NOT AUTHORIZED'
                    )
                }
            </>
        );
    }
}

AuthorizedUser.propTypes = {
    router: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    fetchUsersProfiles: PropTypes.func.isRequired,
    fetchCurrentUser: PropTypes.func.isRequired,
    fetching: PropTypes.bool.isRequired,
    children: PropTypes.node.isRequired,
};

const MapStateToProps = state => ({
    reduxPage: state.links.linksPage,
    fetching: state.users.fetching,
});

const MapDispatchToProps = dispatch => ({
    ...bindActionCreators({
        fetchUsersProfiles: fetchUsersProfilesAction,
        fetchCurrentUser: fetchCurrentUserAction,
    }, dispatch),
});

export default connect(MapStateToProps, MapDispatchToProps)(AuthorizedUser);
