import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { withStyles, Box, Grid } from '@material-ui/core';
import {
    fetchOrgUnitTypes as fetchOrgUnitTypesAction,
    deleteOrgUnitType as deleteOrgUnitTypeAction,
} from './actions';

import TopBar from '../../../components/nav/TopBarComponent';
import LoadingSpinner from '../../../components/LoadingSpinnerComponent';
import Filters from './components/Filters';
import Table from '../../../components/tables/TableComponent';
import OrgUnitsTypesDialog from './components/OrgUnitsTypesDialog';
import AddButtonComponent from '../../../components/buttons/AddButtonComponent';

import commonStyles from '../../../styles/common';
import { baseUrls } from '../../../constants/urls';

import tableColumns from './config';
import MESSAGES from './messages';

import { redirectTo as redirectToAction } from '../../../routing/actions';

const baseUrl = baseUrls.orgUnitTypes;

const styles = theme => ({
    ...commonStyles(theme),
    reactTable: {
        ...commonStyles(theme).reactTable,
        marginTop: theme.spacing(4),
    },
});

class Groups extends Component {
    componentDidMount() {
        const {
            params,
            fetchOrgUnitTypes,
        } = this.props;
        fetchOrgUnitTypes(params);
    }

    componentDidUpdate(prevProps) {
        const { params, fetchOrgUnitTypes } = this.props;
        if ((prevProps.params.pageSize !== params.pageSize)
        || (prevProps.params.order !== params.order)
        || (prevProps.params.page !== params.page)) {
            fetchOrgUnitTypes(params);
        }
    }

    deleteOrgUnitType(group) {
        const {
            params,
            deleteOrgUnitType,
        } = this.props;
        return deleteOrgUnitType(group, params);
    }

    render() {
        const {
            params,
            intl: {
                formatMessage,
            },
            orgUnitsTypes,
            count,
            pages,
            fetching,
            classes,
            fetchOrgUnitTypes,
            redirectTo,
        } = this.props;
        return (
            <>
                {
                    fetching
                    && <LoadingSpinner />
                }
                <TopBar
                    title={formatMessage(MESSAGES.orgUnitsTypes)}
                    displayBackButton={false}
                />
                <Box className={classes.containerFullHeightNoTabPadded}>
                    <Filters
                        baseUrl={baseUrl}
                        params={params}
                        onSearch={() => fetchOrgUnitTypes(params)}
                    />
                    <Table
                        data={orgUnitsTypes}
                        pages={pages}
                        defaultSorted={[
                            { id: 'name', desc: false },
                        ]}
                        columns={tableColumns(formatMessage, this)}
                        count={count}
                        baseUrl={baseUrl}
                        params={params}
                        redirectTo={redirectTo}
                    />
                    <Grid container spacing={0} justify="flex-end" alignItems="center" className={classes.marginTop}>
                        <OrgUnitsTypesDialog
                            titleMessage={MESSAGES.create}
                            renderTrigger={({ openDialog }) => <AddButtonComponent onClick={openDialog} />}
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
    fetchOrgUnitTypes: PropTypes.func.isRequired,
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

const mapDispatchToProps = dispatch => (
    {
        ...bindActionCreators({
            fetchOrgUnitTypes: fetchOrgUnitTypesAction,
            deleteOrgUnitType: deleteOrgUnitTypeAction,
            redirectTo: redirectToAction,
        }, dispatch),
    }
);

export default withStyles(styles)(connect(MapStateToProps, mapDispatchToProps)(injectIntl(Groups)));
