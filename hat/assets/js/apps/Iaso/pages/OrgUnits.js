import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { push } from 'react-router-redux';

import { withStyles } from '@material-ui/core';
import Paper from '@material-ui/core/Paper';

import PropTypes from 'prop-types';
import {
    fetchOrgUnitsTypes,
    fetchSourceTypes,
} from '../utils/requests';


import { setOrgUnits, setOrgUnitTypes, setSourceTypes } from '../redux/orgUnitsReducer';

import orgUnitsTableColumns from '../constants/orgUnitsTableColumns';

import { createUrl } from '../../../utils/fetchData';

import TopBar from '../components/nav/TopBarComponent';
import CustomTableComponent from '../../../components/CustomTableComponent';
import OrgUnitsFiltersComponent from '../components/filters/OrgUnitsFiltersComponent';

import commonStyles from '../styles/common';

const baseUrl = 'orgunits';

const styles = theme => ({
    ...commonStyles(theme),
    buttonIcon: {
        marginRight: theme.spacing(1),
        width: 15,
        height: 15,
    },
    tableButton: {
        marginRight: theme.spacing(2),
    },
});

class OrgUnits extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tableColumns: orgUnitsTableColumns(props.intl.formatMessage, this),
            tableUrl: null,
        };
    }

    componentWillMount() {
        if (this.props.params.back) {
            this.onSearch();
            const { params } = this.props;
            delete params.back;
            this.props.redirectTo(baseUrl, params);
        }
        fetchOrgUnitsTypes(this.props.dispatch).then(orgUnitTypes => this.props.setOrgUnitTypes(orgUnitTypes));
        fetchSourceTypes(this.props.dispatch).then(sourceTypes => this.props.setSourceTypes(sourceTypes));
    }

    componentWillUnmount() {
        this.props.setOrgUnits(null, this.props.params, 0, 1);
    }

    onSearch() {
        let url = '/api/orgunits/?';
        const {
            params,
        } = this.props;
        Object.keys(params).forEach((key) => {
            const value = params[key];
            if (value && !url.includes(key)) {
                url += `&${key}=${value}`;
            }
        });

        this.setState({
            tableUrl: url,
        });
    }

    selectOrgUnit(orgUnit, isMap) {
        const { redirectTo, params } = this.props;
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
        if (isMap) {
            newParams.tab = 'map';
        }
        redirectTo('orgunits/detail', newParams);
    }

    render() {
        const {
            classes,
            params,
            reduxPage,
            intl: {
                formatMessage,
            },
            orgUnitTypes,
            sourceTypes,
        } = this.props;
        const {
            tableUrl,
            tableColumns,
        } = this.state;
        return (
            <Fragment>
                <TopBar title={formatMessage({
                    defaultMessage: 'Org units',
                    id: 'iaso.orgUnits.title',
                })}
                />
                <Paper className={classes.paperContainer}>
                    <OrgUnitsFiltersComponent
                        baseUrl={baseUrl}
                        params={params}
                        onSearch={() => this.onSearch()}
                        orgUnitTypes={orgUnitTypes}
                        sourceTypes={sourceTypes}
                    />
                    {
                        tableUrl && (
                            <div className={classes.marginTopBig}>
                                <CustomTableComponent
                                    isSortable
                                    pageSize={50}
                                    showPagination
                                    endPointUrl={tableUrl}
                                    columns={tableColumns}
                                    defaultSorted={[{ id: 'id', desc: false }]}
                                    params={params}
                                    defaultPath={baseUrl}
                                    dataKey="orgunits"
                                    canSelect={false}
                                    multiSort
                                    onDataLoaded={(orgUnitsList, count, pages) => this.props.setOrgUnits(orgUnitsList, this.props.params, count, pages)}
                                    reduxPage={reduxPage}
                                />
                            </div>
                        )
                    }
                </Paper>
            </Fragment>
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
    redirectTo: PropTypes.func.isRequired,
    setOrgUnitTypes: PropTypes.func.isRequired,
    orgUnitTypes: PropTypes.array.isRequired,
    setSourceTypes: PropTypes.func.isRequired,
    sourceTypes: PropTypes.array.isRequired,
    dispatch: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    reduxPage: state.orgUnits.orgUnitsPage,
    orgUnitTypes: state.orgUnits.orgUnitTypes,
    sourceTypes: state.orgUnits.sourceTypes,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    setOrgUnits: (orgUnitsList, params, count, pages) => dispatch(setOrgUnits(orgUnitsList, true, params, count, pages)),
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    setOrgUnitTypes: orgUnitTypes => dispatch(setOrgUnitTypes(orgUnitTypes)),
    setSourceTypes: sourceTypes => dispatch(setSourceTypes(sourceTypes)),
});

export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(OrgUnits)),
);
