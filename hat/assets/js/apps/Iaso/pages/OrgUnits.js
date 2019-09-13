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


import {
    setOrgUnits, setOrgUnitTypes, setSourceTypes, setOrgUnitsListFetching,
} from '../redux/orgUnitsReducer';

import { resetOrgUnitsLevels } from '../redux/orgUnitsLevelsReducer';

import orgUnitsTableColumns from '../constants/orgUnitsTableColumns';

import { createUrl } from '../../../utils/fetchData';
import { fetchLatestOrgUnitLevelId } from '../utils/orgUnitUtils';

import TopBar from '../components/nav/TopBarComponent';
import CustomTableComponent from '../../../components/CustomTableComponent';
import LoadingSpinner from '../components/LoadingSpinnerComponent';
import OrgUnitsFiltersComponent from '../components/filters/OrgUnitsFiltersComponent';

import commonStyles from '../styles/common';
import reactTable from '../styles/reactTable';

const baseUrl = 'orgunits';

const styles = theme => ({
    ...commonStyles(theme),
    reactTable: {
        ...reactTable(theme).reactTable,
        marginTop: theme.spacing(4),
    },
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
                if (key === 'levels') {
                    url += `&orgUnitParentId=${fetchLatestOrgUnitLevelId(value)}`;
                } else {
                    url += `&${key}=${value}`;
                }
            }
        });

        this.setState({
            tableUrl: url,
        });
    }

    selectOrgUnit(orgUnit, tab) {
        const { redirectTo, params } = this.props;
        const newParams = {
            orgUnitId: orgUnit.id,
            ...params,
            orgUnitslevels: params.levels,
            orgUnitsOrder: params.order,
            orgUnitsPageSize: params.pageSize,
            orgUnitsPage: params.page,
        };
        delete newParams.page;
        delete newParams.pageSize;
        delete newParams.order;
        delete newParams.levels;
        if (tab) {
            newParams.tab = tab;
        }
        this.props.resetOrgUnitsLevels();
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
            dispatch,
            orgUnitTypes,
            sourceTypes,
            fetchingList,
        } = this.props;
        const {
            tableUrl,
            tableColumns,
        } = this.state;
        return (
            <Fragment>
                {
                    fetchingList
                    && <LoadingSpinner />
                }
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
                            <div className={classes.reactTable}>
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
                                    onDataStartLoaded={() => dispatch(this.props.setOrgUnitsListFetching(true))}
                                    onDataLoaded={(orgUnitsList, count, pages) => {
                                        dispatch(this.props.setOrgUnitsListFetching(false));
                                        this.props.setOrgUnits(orgUnitsList, this.props.params, count, pages);
                                    }}
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
    setOrgUnitsListFetching: PropTypes.func.isRequired,
    fetchingList: PropTypes.bool.isRequired,
    resetOrgUnitsLevels: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    reduxPage: state.orgUnits.orgUnitsPage,
    orgUnitTypes: state.orgUnits.orgUnitTypes,
    sourceTypes: state.orgUnits.sourceTypes,
    fetchingList: state.orgUnits.fetchingList,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    setOrgUnits: (orgUnitsList, params, count, pages) => dispatch(setOrgUnits(orgUnitsList, true, params, count, pages)),
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    setOrgUnitTypes: orgUnitTypes => dispatch(setOrgUnitTypes(orgUnitTypes)),
    setSourceTypes: sourceTypes => dispatch(setSourceTypes(sourceTypes)),
    setOrgUnitsListFetching: isFetching => dispatch(setOrgUnitsListFetching(isFetching)),
    resetOrgUnitsLevels: () => dispatch(resetOrgUnitsLevels()),
});

export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(OrgUnits)),
);
