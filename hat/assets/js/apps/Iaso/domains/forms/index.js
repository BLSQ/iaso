import React, { Component } from 'react';
import { connect } from 'react-redux';

import { withStyles } from '@material-ui/core';
import Box from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';

import PropTypes from 'prop-types';

import { bindActionCreators } from 'redux';
import { setForms as setFormsAction } from './actions';
import { fetchAllProjects as fetchAllProjectsAction } from '../projects/actions';
import { fetchAllOrgUnitTypes as fetchAllOrgUnitTypesAction } from '../orgUnits/types/actions';

import formsTableColumns from './config';

import commonStyles from '../../styles/common';
import TopBar from '../../components/nav/TopBarComponent';
import DownloadButtonsComponent from '../../components/buttons/DownloadButtonsComponent';
import CustomTableComponent from '../../components/CustomTableComponent';
import FormDialogComponent from './components/FormDialogComponent';
import AddButtonComponent from '../../components/buttons/AddButtonComponent';
import LoadingSpinner from '../../components/LoadingSpinnerComponent';

import MESSAGES from './messages';
import injectIntl from '../../libs/intl/injectIntl';

import { baseUrls } from '../../constants/urls';

const baseUrl = baseUrls.forms;

const styles = theme => ({
    ...commonStyles(theme),
    reactTable: {
        ...commonStyles(theme).reactTable,
        marginTop: theme.spacing(4),
    },
});

export class Forms extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tableColumns: formsTableColumns(props.intl.formatMessage, this),
            isUpdated: false,
        };
    }

    componentDidMount() {
        this.props.fetchAllProjects();
        this.props.fetchAllOrgUnitTypes();
    }

    getExportUrl(exportType = 'csv') {
        let url = '/api/forms/?';
        const { params } = this.props;
        const urlParams = {
            order: params.order,
        };

        urlParams[exportType] = true;

        Object.keys(urlParams).forEach(key => {
            const value = urlParams[key];
            if (value && !url.includes(key)) {
                url += `&${key}=${value}`;
            }
        });
        return url;
    }

    render() {
        const {
            classes,
            params,
            reduxPage,
            intl: { formatMessage },
            isLoading,
        } = this.props;
        return (
            <section>
                <TopBar title={formatMessage(MESSAGES.title)} />
                <Box className={classes.containerFullHeightNoTabPadded}>
                    <div className={classes.reactTable}>
                        <CustomTableComponent
                            isSortable
                            pageSize={50}
                            showPagination
                            endPointUrl="/api/forms/?all=true"
                            columns={this.state.tableColumns}
                            defaultSorted={[
                                { id: 'instance_updated_at', desc: false },
                            ]}
                            params={params}
                            defaultPath={baseUrl}
                            dataKey="forms"
                            canSelect={false}
                            multiSort
                            onDataLoaded={(newFormsList, count, pages) => {
                                this.props.setForms(
                                    newFormsList,
                                    true,
                                    params,
                                    count,
                                    pages,
                                );
                                this.setState({ isUpdated: false });
                            }}
                            reduxPage={reduxPage}
                            isUpdated={this.state.isUpdated}
                        />
                    </div>
                    <Grid
                        container
                        spacing={0}
                        justify="flex-end"
                        alignItems="center"
                        className={classes.marginTop}
                    >
                        <FormDialogComponent
                            titleMessage={MESSAGES.createForm}
                            renderTrigger={({ openDialog }) => (
                                <AddButtonComponent onClick={openDialog} />
                            )}
                            onSuccess={() => this.setState({ isUpdated: true })}
                        />
                        {reduxPage.list && (
                            <DownloadButtonsComponent
                                csvUrl={this.getExportUrl('csv')}
                                xlsxUrl={this.getExportUrl('xlsx')}
                            />
                        )}
                    </Grid>
                </Box>
                {isLoading && <LoadingSpinner />}
            </section>
        );
    }
}

Forms.defaultProps = {
    reduxPage: undefined,
};

Forms.propTypes = {
    classes: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    reduxPage: PropTypes.object,
    params: PropTypes.object.isRequired,
    setForms: PropTypes.func.isRequired,
    isLoading: PropTypes.bool.isRequired,
    fetchAllOrgUnitTypes: PropTypes.func.isRequired,
    fetchAllProjects: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
    reduxPage: state.forms.formsPage,
    isLoading: state.forms.isLoading,
});

const mapDispatchToProps = dispatch =>
    bindActionCreators(
        {
            setForms: setFormsAction,
            fetchAllOrgUnitTypes: fetchAllOrgUnitTypesAction,
            fetchAllProjects: fetchAllProjectsAction,
        },
        dispatch,
    );

export default withStyles(styles)(
    connect(mapStateToProps, mapDispatchToProps)(injectIntl(Forms)),
);
