import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { push } from 'react-router-redux';

import {
    withStyles, Grid, Paper,
} from '@material-ui/core';

import PropTypes from 'prop-types';

import {
    fetchOrgUnitsTypes,
    fetchSources,
} from '../utils/requests';

import {
    setOrgUnits,
    setOrgUnitTypes,
    setOrgUnitsListFetching,
    setSources,
} from '../redux/orgUnitsReducer';

import orgUnitsTableColumns from '../constants/orgUnitsTableColumns';

import { createUrl } from '../../../utils/fetchData';
import { fetchLatestOrgUnitLevelId } from '../utils/orgUnitUtils';

import DownloadButtonsComponent from '../components/buttons/DownloadButtonsComponent';
import TopBar from '../components/nav/TopBarComponent';
import CustomTableComponent from '../../../components/CustomTableComponent';
import LoadingSpinner from '../components/LoadingSpinnerComponent';
import OrgUnitsFiltersComponent from '../components/filters/OrgUnitsFiltersComponent';

import commonStyles from '../styles/common';
import reactTable from '../styles/reactTable';
import chipColors from '../constants/chipColors';

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
        if (this.props.params.searchActive) {
            this.onSearch();
        }
        fetchOrgUnitsTypes(this.props.dispatch).then(orgUnitTypes => this.props.setOrgUnitTypes(orgUnitTypes));

        fetchSources(this.props.dispatch)
            .then((data) => {
                const sources = [];
                data.forEach((s, i) => {
                    sources.push({
                        ...s,
                        color: chipColors[i],
                    });
                });
                this.props.setSources(sources);
            });
    }

    componentDidUpdate(prevProps) {
        const validatedChanged = prevProps.params.validated !== this.props.params.validated;
        const sourceChanged = prevProps.params.source !== this.props.params.source;
        if (validatedChanged || sourceChanged) {
            const newParams = {
                ...this.props.params,
            };
            newParams.levels = null;
            this.props.redirectTo(baseUrl, newParams);
        }
        if (!this.props.params.searchActive && this.props.reduxPage.list) {
            this.resetOrgUnitData();
        }
    }

    componentWillUnmount() {
        this.props.setOrgUnits(null, this.props.params, 0, 1);
    }

    onSearch() {
        const { redirectTo, params } = this.props;
        const newParams = {
            ...params,
        };
        if (!params.searchActive) {
            newParams.searchActive = true;
        }
        redirectTo(baseUrl, newParams);
        const url = this.getEndpointUrl();
        this.setState({
            tableUrl: url,
        });
    }

    getEndpointUrl(toExport, exportType = 'csv') {
        let url = '/api/orgunits/?';
        const {
            params,
        } = this.props;

        const clonedParams = { ...params };

        if (toExport) {
            clonedParams[exportType] = true;
        }

        Object.keys(clonedParams).forEach((key) => {
            const value = clonedParams[key];
            if (value && !url.includes(key)) {
                if (key === 'levels') {
                    url += `&orgUnitParentId=${fetchLatestOrgUnitLevelId(value)}`;
                } else {
                    url += `&${key}=${value}`;
                }
            }
        });

        return url;
    }

    resetOrgUnitData() {
        this.setState({
            tableUrl: null,
        });
        this.props.setOrgUnits(null, this.props.params, 0, 1);
    }

    selectOrgUnit(orgUnit, tab) {
        const { redirectTo } = this.props;
        const newParams = {
            orgUnitId: orgUnit.id,
            tab,
        };
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
            sources,
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
                        sources={sources}
                    />
                    {
                        tableUrl && (
                            <Fragment>
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
                                <Grid container spacing={0} alignItems="center" className={classes.marginTop}>
                                    <Grid xs={12} item className={classes.textAlignRight}>
                                        <DownloadButtonsComponent
                                            csvUrl={this.getEndpointUrl(true, 'csv')}
                                            xlsxUrl={this.getEndpointUrl(true, 'xlsx')}
                                        />
                                    </Grid>
                                </Grid>
                            </Fragment>
                        )
                    }
                </Paper>
            </Fragment>
        );
    }
}
OrgUnits.defaultProps = {
    reduxPage: undefined,
    sources: [],
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
    setSources: PropTypes.func.isRequired,
    sources: PropTypes.array,
    dispatch: PropTypes.func.isRequired,
    setOrgUnitsListFetching: PropTypes.func.isRequired,
    fetchingList: PropTypes.bool.isRequired,
};

const MapStateToProps = state => ({
    reduxPage: state.orgUnits.orgUnitsPage,
    orgUnitTypes: state.orgUnits.orgUnitTypes,
    sources: state.orgUnits.sources,
    fetchingList: state.orgUnits.fetchingList,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    setOrgUnits: (orgUnitsList, params, count, pages) => dispatch(setOrgUnits(orgUnitsList, true, params, count, pages)),
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    setOrgUnitTypes: orgUnitTypes => dispatch(setOrgUnitTypes(orgUnitTypes)),
    setSources: sources => dispatch(setSources(sources)),
    setOrgUnitsListFetching: isFetching => dispatch(setOrgUnitsListFetching(isFetching)),
});

export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(OrgUnits)),
);
