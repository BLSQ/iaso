import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withStyles, Box, Grid } from '@material-ui/core';
import {
    injectIntl,
    TopBar,
    LoadingSpinner,
    commonStyles,
    Table,
} from 'bluesquare-components';
import {
    fetchGroups as fetchGroupsAction,
    deleteGroup as deleteGroupAction,
} from './actions';

import Filters from './components/Filters';
import GroupsDialog from './components/GroupsDialog';
import AddButtonComponent from '../../../components/buttons/AddButtonComponent';

import { baseUrls } from '../../../constants/urls';

import tableColumns from './config';
import MESSAGES from './messages';

import { redirectTo as redirectToAction } from '../../../routing/actions';

const baseUrl = baseUrls.groups;

const styles = theme => ({
    ...commonStyles(theme),
    reactTable: {
        ...commonStyles(theme).reactTable,
        marginTop: theme.spacing(4),
    },
});

class Groups extends Component {
    componentDidMount() {
        const { params, fetchGroups } = this.props;
        fetchGroups(params);
    }

    componentDidUpdate(prevProps) {
        const { params, fetchGroups } = this.props;
        if (
            prevProps.params.pageSize !== params.pageSize ||
            prevProps.params.order !== params.order ||
            prevProps.params.page !== params.page
        ) {
            fetchGroups(params);
        }
    }

    deleteGroup(group) {
        const { params, deleteGroup } = this.props;
        return deleteGroup(group, params);
    }

    render() {
        const {
            params,
            intl: { formatMessage },
            groups,
            count,
            pages,
            fetching,
            classes,
            fetchGroups,
            redirectTo,
        } = this.props;
        return (
            <>
                {fetching && <LoadingSpinner />}
                <TopBar
                    title={formatMessage(MESSAGES.groups)}
                    displayBackButton={false}
                />
                <Box className={classes.containerFullHeightNoTabPadded}>
                    <Filters
                        baseUrl={baseUrl}
                        params={params}
                        onSearch={() => fetchGroups(params)}
                    />
                    <Table
                        data={groups}
                        pages={pages}
                        defaultSorted={[{ id: 'name', desc: false }]}
                        columns={tableColumns(formatMessage, this)}
                        count={count}
                        baseUrl={baseUrl}
                        params={params}
                        redirectTo={redirectTo}
                    />
                    <Grid
                        container
                        spacing={0}
                        justify="flex-end"
                        alignItems="center"
                        className={classes.marginTop}
                    >
                        <GroupsDialog
                            titleMessage={MESSAGES.create}
                            renderTrigger={({ openDialog }) => (
                                <AddButtonComponent onClick={openDialog} />
                            )}
                            params={params}
                        />
                    </Grid>
                </Box>
            </>
        );
    }
}

Groups.defaultProps = {
    count: 0,
};

Groups.propTypes = {
    classes: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    fetchGroups: PropTypes.func.isRequired,
    deleteGroup: PropTypes.func.isRequired,
    groups: PropTypes.array.isRequired,
    count: PropTypes.number,
    fetching: PropTypes.bool.isRequired,
    pages: PropTypes.number.isRequired,
    redirectTo: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    groups: state.groups.list,
    count: state.groups.count,
    pages: state.groups.pages,
    fetching: state.groups.fetching,
});

const mapDispatchToProps = dispatch => ({
    ...bindActionCreators(
        {
            fetchGroups: fetchGroupsAction,
            deleteGroup: deleteGroupAction,
            redirectTo: redirectToAction,
        },
        dispatch,
    ),
});

export default withStyles(styles)(
    connect(MapStateToProps, mapDispatchToProps)(injectIntl(Groups)),
);
