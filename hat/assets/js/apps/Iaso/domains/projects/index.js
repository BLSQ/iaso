import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withStyles, Box, Grid } from '@material-ui/core';

import {
    injectIntl,
    commonStyles,
    LoadingSpinner,
    TopBar,
    Table,
} from 'bluesquare-components';
import {
    fetchAllApps as fetchAllAppsAction,
    fetchAllFeatureFlags as fetchAllFeatureFlagsAction,
} from './actions';

import ProjectsDialog from './components/ProjectsDialog';
import AddButtonComponent from '../../components/buttons/AddButtonComponent';

import { baseUrls } from '../../constants/urls';

import projectsTableColumns from './config';
import MESSAGES from './messages';

import { redirectTo as redirectToAction } from '../../routing/actions';

const baseUrl = baseUrls.projects;

const styles = theme => ({
    ...commonStyles(theme),
    reactTable: {
        ...commonStyles(theme).reactTable,
        marginTop: theme.spacing(4),
    },
});

class Projects extends Component {
    componentDidMount() {
        const { params, fetchAllApps, fetchAllFeatureFlags } = this.props;
        fetchAllApps(params);
        fetchAllFeatureFlags();
    }

    componentDidUpdate(prevProps) {
        const { params, fetchAllApps } = this.props;
        if (
            prevProps.params.pageSize !== params.pageSize ||
            prevProps.params.order !== params.order ||
            prevProps.params.page !== params.page
        ) {
            fetchAllApps(params);
        }
    }

    render() {
        const {
            params,
            intl: { formatMessage },
            apps,
            count,
            pages,
            fetching,
            featureFlags,
            classes,
            redirectTo,
        } = this.props;

        return (
            <>
                {fetching && <LoadingSpinner />}
                <TopBar
                    title={formatMessage(MESSAGES.projects)}
                    displayBackButton={false}
                />
                <Box className={classes.containerFullHeightNoTabPadded}>
                    <Grid
                        container
                        spacing={0}
                        justify="flex-end"
                        alignItems="center"
                        className={classes.marginTop}
                    >
                        <ProjectsDialog
                            titleMessage={MESSAGES.create}
                            renderTrigger={({ openDialog }) => (
                                <AddButtonComponent onClick={openDialog} />
                            )}
                            featureFlags={featureFlags}
                            params={params}
                        />
                    </Grid>
                    <Table
                        data={apps}
                        pages={pages}
                        defaultSorted={[{ id: 'project__name', desc: false }]}
                        columns={projectsTableColumns(formatMessage, this)}
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

Projects.propTypes = {
    classes: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    fetchAllApps: PropTypes.func.isRequired,
    fetchAllFeatureFlags: PropTypes.func.isRequired,
    apps: PropTypes.array.isRequired,
    featureFlags: PropTypes.array.isRequired,
    count: PropTypes.number.isRequired,
    fetching: PropTypes.bool.isRequired,
    pages: PropTypes.number.isRequired,
    redirectTo: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    apps: state.projects.list,
    count: state.projects.count,
    pages: state.projects.pages,
    featureFlags: state.projects.allFeatureFlags,
    fetching: state.projects.fetching,
});

const mapDispatchToProps = dispatch => ({
    ...bindActionCreators(
        {
            fetchAllApps: fetchAllAppsAction,
            fetchAllFeatureFlags: fetchAllFeatureFlagsAction,
            redirectTo: redirectToAction,
        },
        dispatch,
    ),
});

export default withStyles(styles)(
    connect(MapStateToProps, mapDispatchToProps)(injectIntl(Projects)),
);
