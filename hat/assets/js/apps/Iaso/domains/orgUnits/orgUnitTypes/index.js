import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withStyles, Box, Grid } from '@material-ui/core';
import {
    injectIntl,
    LoadingSpinner,
    commonStyles,
    Table,
    AddButton as AddButtonComponent,
} from 'bluesquare-components';
import {
    fetchOrgUnitTypes as fetchOrgUnitTypesAction,
    fetchAllOrgUnitTypes as fetchAllOrgUnitTypesAction,
    deleteOrgUnitType as deleteOrgUnitTypeAction,
} from './actions';
import { fetchAllProjects as fetchAllProjectsAction } from '../../projects/actions';
import TopBar from '../../../components/nav/TopBarComponent';

import OrgUnitsTypesDialog from './components/OrgUnitsTypesDialog';

import { baseUrls } from '../../../constants/urls';

import tableColumns from './config/tableColumns';
import MESSAGES from './messages';

import { redirectTo as redirectToAction } from '../../../routing/actions';

const baseUrl = baseUrls.orgUnitTypes;

const styles = theme => ({
    ...commonStyles(theme),
});

class OrgUnitTypes extends Component {
    componentDidMount() {
        const { fetchAllOrgUnitTypes, fetchAllProjects } = this.props;
        this.fetchOrgUnitTypes();
        fetchAllOrgUnitTypes(); //  TO-DO, API endpoint giving only id, name, short name. This is used by the dialog to choose sub org unit
        fetchAllProjects();
    }

    componentDidUpdate(prevProps) {
        const { params } = this.props;
        if (
            prevProps.params.pageSize !== params.pageSize ||
            prevProps.params.order !== params.order ||
            prevProps.params.page !== params.page
        ) {
            this.fetchOrgUnitTypes();
        }
    }

    fetchOrgUnitTypes() {
        this.props.fetchOrgUnitTypes(this.props.params);
    }

    deleteOrgUnitType(orgUnitType) {
        const { params, deleteOrgUnitType } = this.props;
        return deleteOrgUnitType(orgUnitType, params);
    }

    render() {
        const {
            params,
            intl: { formatMessage },
            orgUnitsTypes,
            count,
            pages,
            fetching,
            classes,
            redirectTo,
        } = this.props;
        return (
            <>
                {fetching && <LoadingSpinner />}
                <TopBar
                    title={formatMessage(MESSAGES.orgUnitsTypes)}
                    displayBackButton={false}
                    id="orgunittype-topbar"
                />
                <Box className={classes.containerFullHeightNoTabPadded}>
                    <Table
                        data={orgUnitsTypes}
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
                        justifyContent="flex-end"
                        alignItems="center"
                        className={classes.marginTop}
                    >
                        <OrgUnitsTypesDialog
                            titleMessage={MESSAGES.create}
                            renderTrigger={({ openDialog }) => (
                                <AddButtonComponent
                                    onClick={openDialog}
                                    id="create-ou-type"
                                />
                            )}
                            params={params}
                            onConfirmed={() => this.fetchOrgUnitTypes()}
                        />
                    </Grid>
                </Box>
            </>
        );
    }
}

OrgUnitTypes.defaultProps = {
    count: 0,
};

OrgUnitTypes.propTypes = {
    classes: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    fetchOrgUnitTypes: PropTypes.func.isRequired,
    fetchAllOrgUnitTypes: PropTypes.func.isRequired,
    fetchAllProjects: PropTypes.func.isRequired,
    deleteOrgUnitType: PropTypes.func.isRequired,
    orgUnitsTypes: PropTypes.array.isRequired,
    count: PropTypes.number,
    fetching: PropTypes.bool.isRequired,
    pages: PropTypes.number.isRequired,
    redirectTo: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    orgUnitsTypes: state.orgUnitsTypes.list,
    count: state.orgUnitsTypes.count,
    pages: state.orgUnitsTypes.pages,
    fetching: state.orgUnitsTypes.fetching,
});

const mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            fetchOrgUnitTypes: fetchOrgUnitTypesAction,
            fetchAllOrgUnitTypes: fetchAllOrgUnitTypesAction,
            fetchAllProjects: fetchAllProjectsAction,
            deleteOrgUnitType: deleteOrgUnitTypeAction,
            redirectTo: redirectToAction,
        },
        dispatch,
    );
export default withStyles(styles)(
    connect(MapStateToProps, mapDispatchToProps)(injectIntl(OrgUnitTypes)),
);
