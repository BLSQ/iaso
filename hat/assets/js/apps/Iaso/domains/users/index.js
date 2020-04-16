import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import isEqual from 'lodash/isEqual';
import { withStyles, Box } from '@material-ui/core';

import {
    fetchUsersProfiles as fetchUsersProfilesAction,
} from './actions';


import { redirectTo as redirectToAction } from '../../routing/actions';
import TopBar from '../../components/nav/TopBarComponent';
import LoadingSpinner from '../../components/LoadingSpinnerComponent';

import commonStyles from '../../styles/common';
import { baseUrls } from '../../constants/routes';
import Table from '../../components/tables/TableComponent';

import usersTableColumns from './config';

const baseUrl = baseUrls.users;

const styles = theme => ({
    ...commonStyles(theme),
    reactTable: {
        ...commonStyles(theme).reactTable,
        marginTop: theme.spacing(4),
    },
});

class Users extends Component {
    componentDidMount() {
        const {
            params,
            fetchUsersProfiles,
        } = this.props;
        fetchUsersProfiles(params);
    }

    componentDidUpdate(prevProps) {
        const { params, fetchUsersProfiles } = this.props;
        if (!isEqual(prevProps.params, params)) {
            fetchUsersProfiles(params);
        }
    }


    selectUser(user) {
        const { redirectTo } = this.props;
        console.log(user);
    }

    render() {
        const {
            params,
            intl: {
                formatMessage,
            },
            profiles,
            count,
            pages,
            fetching,
            classes,
        } = this.props;
        return (
            <>
                {
                    fetching
                    && <LoadingSpinner />
                }
                <TopBar
                    title={formatMessage({
                        defaultMessage: 'Users',
                        id: 'iaso.label.users',
                    })}
                    displayBackButton={false}
                />
                <Box className={classes.containerFullHeightNoTabPadded}>
                    <Table
                        data={profiles}
                        pages={pages}
                        defaultSorted={[
                            { id: 'user__username', desc: false },
                        ]}
                        columns={usersTableColumns(formatMessage, this)}
                        count={count}
                        baseUrl={baseUrl}
                        params={params}
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
    redirectTo: PropTypes.func.isRequired,
    fetchUsersProfiles: PropTypes.func.isRequired,
    profiles: PropTypes.array.isRequired,
    count: PropTypes.number,
    fetching: PropTypes.bool.isRequired,
    pages: PropTypes.number.isRequired,
};

const MapStateToProps = state => ({
    profiles: state.users.list,
    count: state.users.count,
    pages: state.users.pages,
    fetching: state.users.fetching,
});

const mapDispatchToProps = dispatch => (
    {
        ...bindActionCreators({
            fetchUsersProfiles: fetchUsersProfilesAction,
            redirectTo: redirectToAction,
        }, dispatch),
    }
);

export default withStyles(styles)(connect(MapStateToProps, mapDispatchToProps)(injectIntl(Users)));
