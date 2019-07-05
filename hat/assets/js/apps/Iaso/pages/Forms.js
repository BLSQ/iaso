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

import TopBar from '../components/TopBar';
import DownloadButtonsComponent from '../components/DownloadButtonsComponent';
import CustomTableComponent from '../../../components/CustomTableComponent';

const baseUrl = 'forms';

const styles = theme => ({
    container: {
        marginTop: theme.spacing(2),
    },
    tableIcon: {
        marginRight: theme.spacing(1),
        width: 15,
        height: 15,
    },
});

class Forms extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tableColumns: formsTableColumns(props.intl.formatMessage, this),
        };
    }

    getEndpointUrl(toExport, exportType = 'csv') {
        let url = '/api/forms/?';
        const {
            params,
        } = this.props;
        const urlParams = {
            ...params,
        };

        if (toExport) {
            urlParams[exportType] = true;
        }

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
        redirectTo('instances', { formId: form.id });
    }


    render() {
        const {
            classes,
            params,
            reduxPage,
            intl: {
                formatMessage,
            },
        } = this.props;
        return (
            <section className="iaso-table">
                <TopBar title={formatMessage({
                    defaultMessage: 'Formulaires',
                    id: 'iaso.form.title',
                })}
                />
                <Container maxWidth={false} className={classes.container}>
                    <CustomTableComponent
                        isSortable
                        pageSize={50}
                        showPagination
                        endPointUrl={this.getEndpointUrl()}
                        columns={this.state.tableColumns}
                        defaultSorted={[{ id: 'updated_at', desc: true }]}
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
                            csvUrl={this.getEndpointUrl(true, 'csv')}
                            xlsxUrl={this.getEndpointUrl(true, 'xlsx')}
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
