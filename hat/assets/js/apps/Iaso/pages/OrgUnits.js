import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { push } from 'react-router-redux';

import { withStyles } from '@material-ui/core';
import Container from '@material-ui/core/Container';

import PropTypes from 'prop-types';

import { setOrgUnits, setCurrentOrgUnit } from '../redux/orgUnitsReducer';

import orgUnitsTableColumns from '../constants/orgUnitsTableColumns';

import { createUrl } from '../../../utils/fetchData';

import TopBar from '../components/TopBar';
import DownloadButtonsComponent from '../components/DownloadButtonsComponent';
import CustomTableComponent from '../../../components/CustomTableComponent';

const baseUrl = 'orgunits';

const styles = theme => ({
    filterContainer: {
        margin: theme.spacing(4),
        backgroundColor: 'white',
        padding: theme.spacing(2),
        width: 'auto',
        border: '1px solid #ccc',
    },
    container: {
        marginTop: theme.spacing(2),
    },
    tableIcon: {
        marginRight: theme.spacing(1),
        width: 15,
        height: 15,
    },
});

class OrgUnits extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tableColumns: orgUnitsTableColumns(props.intl.formatMessage, this),
        };
    }

    getExportUrl(exportType = 'csv') {
        let url = '/api/orgunits/?';
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

    selectOrgUnit(orgUnit) {
        const { redirectTo, params } = this.props;
        this.props.setCurrentOrgUnit(orgUnit);
        const newParams = {
            orgUnitId: orgUnit.id,
            ...params,
            orgUnitsOrder: params.order,
            orgUnitsPageSize: params.pageSize,
            orgUnitsPage: params.page,
        };
        delete newParams.page;
        delete newParams.pageSize;
        delete newParams.order;
        redirectTo('orgunit/detail', newParams);
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
            <section className="iaso">
                <TopBar title={formatMessage({
                    defaultMessage: 'Org units',
                    id: 'iaso.orgUnits.title',
                })}
                />
                <Container maxWidth={false} className={classes.container}>
                    <CustomTableComponent
                        isSortable
                        pageSize={50}
                        showPagination
                        endPointUrl={`/api/orgunits/?validated=${params.validated}`}
                        columns={this.state.tableColumns}
                        defaultSorted={[{ id: 'id', desc: false }]}
                        params={params}
                        defaultPath={baseUrl}
                        dataKey="orgunits"
                        canSelect={false}
                        multiSort
                        onDataLoaded={(orgUnitsList, count, pages) => this.props.setOrgUnits(orgUnitsList, true, params, count, pages)}
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
OrgUnits.defaultProps = {
    reduxPage: undefined,
};

OrgUnits.propTypes = {
    classes: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    reduxPage: PropTypes.object,
    params: PropTypes.object.isRequired,
    setOrgUnits: PropTypes.func.isRequired,
    setCurrentOrgUnit: PropTypes.func.isRequired,
    redirectTo: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    reduxPage: state.orgUnits.orgUnitsPage,
});

const MapDispatchToProps = dispatch => ({
    setCurrentOrgUnit: orgUnit => dispatch(setCurrentOrgUnit(orgUnit)),
    setOrgUnits: (orgUnitsList, showPagination, params, count, pages) => dispatch(setOrgUnits(orgUnitsList, showPagination, params, count, pages)),
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});

export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(OrgUnits)),
);
