import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withStyles, Box, Grid } from '@material-ui/core';

import {
    injectIntl,
    commonStyles,
    Table,
    LoadingSpinner,
    AddButton as AddButtonComponent,
} from 'bluesquare-components';
import {
    fetchUsersProfiles as fetchUsersProfilesAction,
    deleteUser as deleteUserAction,
} from './actions';

import TopBar from '../../components/nav/TopBarComponent';
import Filters from './components/Filters';
import UsersDialog from './components/UsersDialog';

import { baseUrls } from '../../constants/urls';

import usersTableColumns from './config';
import MESSAGES from './messages';

import { redirectTo as redirectToAction } from '../../routing/actions';

const baseUrl = baseUrls.users;

const styles = theme => ({
    ...commonStyles(theme),
});

class Users extends Component {
    componentDidMount() {
        const { params, fetchUsersProfiles } = this.props;
        fetchUsersProfiles(params);
    }

    componentDidUpdate(prevProps) {
        const { params, fetchUsersProfiles } = this.props;
        if (
            prevProps.params.pageSize !== params.pageSize ||
            prevProps.params.order !== params.order ||
            prevProps.params.page !== params.page
        ) {
            fetchUsersProfiles(params);
        }
    }

    deleteUser(user) {
        const { params, deleteUser } = this.props;
        return deleteUser(user, params);
    }

    render() {
        const {
            params,
            intl: { formatMessage },
            profiles,
            count,
            pages,
            fetching,
            classes,
            fetchUsersProfiles,
            redirectTo,
        } = this.props;
        return (
            <>
                {fetching && <LoadingSpinner />}
                <TopBar
                    title={formatMessage(MESSAGES.users)}
                    displayBackButton={false}
                />
                <Box className={classes.containerFullHeightNoTabPadded}>
                    <Filters
                        baseUrl={baseUrl}
                        params={params}
                        onSearch={() => fetchUsersProfiles(params)}
                    />
                    <Grid
                        container
                        spacing={0}
                        justifyContent="flex-end"
                        alignItems="center"
                        className={classes.marginTop}
                    >
                        <UsersDialog
                            titleMessage={MESSAGES.create}
                            renderTrigger={({ openDialog }) => (
                                <AddButtonComponent onClick={openDialog} />
                            )}
                            params={params}
                        />
                    </Grid>
                    <Table
                        data={profiles}
                        pages={pages}
                        defaultSorted={[{ id: 'user__username', desc: false }]}
                        columns={usersTableColumns(formatMessage, this)}
                        count={count}
                        baseUrl={baseUrl}
                        params={params}
                        redirectTo={redirectTo}
                    />
                </Box>
            </>
        );
    }
}

Users.defaultProps = {
    count: 0,
};

Users.propTypes = {
    classes: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    fetchUsersProfiles: PropTypes.func.isRequired,
    deleteUser: PropTypes.func.isRequired,
    profiles: PropTypes.array.isRequired,
    count: PropTypes.number,
    fetching: PropTypes.bool.isRequired,
    pages: PropTypes.number.isRequired,
    redirectTo: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    profiles: state.users.list,
    count: state.users.count,
    pages: state.users.pages,
    fetching: state.users.fetching,
});

const mapDispatchToProps = dispatch => ({
    ...bindActionCreators(
        {
            fetchUsersProfiles: fetchUsersProfilesAction,
            deleteUser: deleteUserAction,
            redirectTo: redirectToAction,
        },
        dispatch,
    ),
});

export default withStyles(styles)(
    connect(MapStateToProps, mapDispatchToProps)(injectIntl(Users)),
);
