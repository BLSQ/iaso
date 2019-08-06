import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { push } from 'react-router-redux';

import { withStyles } from '@material-ui/core';
import Container from '@material-ui/core/Container';

import PropTypes from 'prop-types';

import { setForms, setCurrentForm } from '../redux/formsReducer';

import formsTableColumns from '../constants/formsTableColumns';

import { createUrl } from '../../../utils/fetchData';

import TopBar from '../components/TopBarComponent';
import DownloadButtonsComponent from '../components/DownloadButtonsComponent';
import CustomTableComponent from '../../../components/CustomTableComponent';
import PeriodSelectorComponent from '../../../components/PeriodSelectorComponent';

import commonStyles from '../styles/common';

const baseUrl = 'forms';

const styles = theme => ({
    ...commonStyles(theme),
    container: {
        ...commonStyles(theme).container,
        marginTop: theme.spacing(2),
    },
});

class Forms extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tableColumns: formsTableColumns(props.intl.formatMessage, this),
        };
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
        const { redirectTo, params } = this.props;
        this.props.setCurrentForm(form);
        const newParams = {
            formId: form.id,
            ...params,
            formOrder: params.order,
            formPageSize: params.pageSize,
            formPage: params.page,
        };
        delete newParams.page;
        delete newParams.pageSize;
        delete newParams.order;
        redirectTo('instances', newParams);
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
                    defaultMessage: 'Formulaires',
                    id: 'iaso.form.title',
                })}
                />
                <Container maxWidth={false} className={classes.whiteContainer}>
                    <PeriodSelectorComponent
                        dateFrom={params.date_from}
                        dateTo={params.date_to}
                        onChangeDate={(dateFrom, dateTo) => redirectTo(baseUrl, {
                            ...this.props.params,
                            date_from: dateFrom,
                            date_to: dateTo,
                        })}
                    />
                </Container>
                <Container maxWidth={false} className={classes.container}>
                    <CustomTableComponent
                        isSortable
                        pageSize={50}
                        showPagination
                        endPointUrl={`/api/forms/?date_from=${params.date_from}&date_to=${params.date_to}`}
                        columns={this.state.tableColumns}
                        defaultSorted={[{ id: 'instance_updated_at', desc: false }]}
                        params={params}
                        defaultPath={baseUrl}
                        dataKey="forms"
                        canSelect={false}
                        multiSort
                        onDataLoaded={(newFormsList, count, pages) => this.props.setForms(newFormsList, true, params, count, pages)}
                        reduxPage={reduxPage}
                    />
                </Container>
                {reduxPage.list
                    && (
                        <DownloadButtonsComponent
                            csvUrl={this.getExportUrl('csv')}
                            xlsxUrl={this.getExportUrl('xlsx')}
                        />
                    )}
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
    redirectTo: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    reduxPage: state.forms.formsPage,
});

const MapDispatchToProps = dispatch => ({
    setCurrentForm: form => dispatch(setCurrentForm(form)),
    setForms: (forms, showPagination, params, count, pages) => dispatch(setForms(forms, showPagination, params, count, pages)),
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});

export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(Forms)),
);
