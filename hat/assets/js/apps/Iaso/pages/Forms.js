import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { push } from 'react-router-redux';

import { withStyles } from '@material-ui/core';
import Box from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';

import PropTypes from 'prop-types';

import { setForms, setCurrentForm } from '../redux/formsReducer';
import { setOrgUnitTypes } from '../redux/orgUnitsReducer';
import { setProjects } from '../redux/projectsReducer';

import formsTableColumns from '../constants/formsTableColumns';

import { createUrl } from '../../../utils/fetchData';

import TopBar from '../components/nav/TopBarComponent';
import DownloadButtonsComponent from '../components/buttons/DownloadButtonsComponent';
import CustomTableComponent from '../../../components/CustomTableComponent';
import PeriodSelectorComponent from '../../../components/PeriodSelectorComponent';
import AddFormDialogComponent from '../components/dialogs/AddFormDialogComponent';

import commonStyles from '../styles/common';
import { fetchOrgUnitsTypes, fetchProjects, deleteForm } from '../utils/requests';

const baseUrl = 'forms';

const styles = theme => ({
    ...commonStyles(theme),
    reactTable: {
        ...commonStyles(theme).reactTable,
        marginTop: theme.spacing(4),
    },
});

class Forms extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tableColumns: formsTableColumns(props.intl.formatMessage, this),
            isUpdated: false,
        };
    }

    /**
   * TODO: replace by async actions or saga
   */
    componentDidMount() {
        Promise.all([
            fetchOrgUnitsTypes(this.props.dispatch),
            fetchProjects(this.props.dispatch),
        ]).then(([orgUnitsTypes, projects]) => {
            this.props.setOrgUnitTypes(orgUnitsTypes);
            this.props.setProjects(projects);
        });
    }

    getExportUrl(exportType = 'csv') {
        let url = '/api/forms/?';
        const {
            params,
        } = this.props;
        const urlParams = {
            order: params.order,
        };

        urlParams[exportType] = true;

        Object.keys(urlParams).forEach((key) => {
            const value = urlParams[key];
            if (value && !url.includes(key)) {
                url += `&${key}=${value}`;
            }
        });
        return url;
    }

    selectForm(form) {
        const { redirectTo } = this.props;
        this.props.setCurrentForm(form);
        const newParams = {
            formId: form.id,
        };
        redirectTo('instances', newParams);
    }

    deleteForm(form) {
        deleteForm(this.props.dispatch, form.id)
            .then(() => this.setState({ isUpdated: true }));
    }

    render() {
        const {
            classes,
            params,
            reduxPage,
            redirectTo,
            intl: {
                formatMessage,
            },
        } = this.props;
        return (
            <section>
                <TopBar title={formatMessage({
                    defaultMessage: 'Forms',
                    id: 'iaso.forms.title',
                })}
                />
                <Box className={classes.containerFullHeightNoTabPadded}>
                    <PeriodSelectorComponent
                        dateFrom={params.date_from}
                        dateTo={params.date_to}
                        onChangeDate={(dateFrom, dateTo) => redirectTo(baseUrl, {
                            ...this.props.params,
                            date_from: dateFrom,
                            date_to: dateTo,
                        })}
                    />
                    <div className={classes.reactTable}>
                        <CustomTableComponent
                            isSortable
                            pageSize={50}
                            showPagination
                            endPointUrl={`/api/forms/?date_from=${params.date_from}&date_to=${params.date_to}&all=true`}
                            columns={this.state.tableColumns}
                            defaultSorted={[{ id: 'instance_updated_at', desc: false }]}
                            params={params}
                            defaultPath={baseUrl}
                            dataKey="forms"
                            canSelect={false}
                            multiSort
                            onDataLoaded={(newFormsList, count, pages) => {
                                this.props.setForms(newFormsList, true, params, count, pages);
                                this.setState({ isUpdated: false });
                            }}
                            reduxPage={reduxPage}
                            isUpdated={this.state.isUpdated}
                        />
                    </div>
                    <Grid container spacing={0} justify="flex-end" alignItems="center" className={classes.marginTop}>
                        <AddFormDialogComponent />
                        {reduxPage.list
            && (
                <DownloadButtonsComponent
                    csvUrl={this.getExportUrl('csv')}
                    xlsxUrl={this.getExportUrl('xlsx')}
                />
            )}
                    </Grid>
                </Box>
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
    setCurrentForm: PropTypes.func.isRequired,
    setOrgUnitTypes: PropTypes.func.isRequired,
    setProjects: PropTypes.func.isRequired,
    redirectTo: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    reduxPage: state.forms.formsPage,
});

const MapDispatchToProps = dispatch => ({
    setCurrentForm: form => dispatch(setCurrentForm(form)),
    setForms: (forms, showPagination, params, count, pages) => dispatch(setForms(forms, showPagination, params, count, pages)),
    setOrgUnitTypes: orgUnitTypes => dispatch(setOrgUnitTypes(orgUnitTypes)),
    setProjects: projects => dispatch(setProjects(projects)),
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    dispatch,
});

export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(Forms)),
);
