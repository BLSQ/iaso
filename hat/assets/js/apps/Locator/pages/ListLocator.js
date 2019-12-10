import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';

import ListFilters from '../components/ListFilters';
import { createUrl } from '../../../utils/fetchData';
import LoadingSpinner from '../../../components/loading-spinner';
import CustomTableComponent from '../../../components/CustomTableComponent';
import listLocatorColumns from '../constants/ListLocatorColumns';
import DownloadButtonsComponent from '../../../components/DownloadButtonsComponent';

import { locatorActions } from '../redux/locator';
import { caseActions } from '../redux/case';
import { provinceActions } from '../redux/province';
import SearchButton from '../../../components/SearchButton';

import { currentUserActions } from '../../../redux/currentUserReducer';

const baseUrl = 'list';

export class ListLocator extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tableColumns: listLocatorColumns(props.intl.formatMessage),
            tableUrl: null,
        };
    }

    componentWillMount() {
        Promise.all([
            this.props.fetchProvinces(),
            this.props.fetchTeams(),
            this.props.fetchCurrentUserInfos(),
        ]).then(() => {
            if (this.props.params.province_id) {
                this.props.selectProvince(this.props.params.province_id, this.props.params.zs_id, this.props.params.as_id);
            } else if (this.props.params.zs_id) {
                this.props.selectZone(this.props.params.zs_id, this.props.params.as_id);
            } else if (this.props.params.as_id) {
                this.props.selectArea(this.props.params.as_id, this.props.params.zs_id);
            }
            if (this.props.params.back) {
                this.onSearch();
                const { params } = this.props;
                delete params.back;
                this.props.redirectTo(baseUrl, params);
            }
        });
    }

    componentWillReceiveProps(newProps) {
        if (newProps.params.province_id !== this.props.params.province_id) {
            this.props.selectProvince(newProps.params.province_id, newProps.params.zs_id, newProps.params.as_id);
        } else if (newProps.params.zs_id !== this.props.params.zs_id) {
            this.props.selectZone(newProps.params.zs_id, newProps.params.as_id);
        } else if (newProps.params.as_id !== this.props.params.as_id) {
            this.props.selectArea(newProps.params.as_id, newProps.params.zs_id);
        }
    }

    onSearch() {
        this.setState({
            tableUrl: this.getEndpointUrl(),
        });
    }

    getEndpointUrl(toExport = false, exportType = 'csv') {
        let url = '/api/cases/?';
        const urlParams = {
            province_id: this.props.params.province_id,
            as_id: this.props.params.as_id,
            zs_id: this.props.params.zs_id,
            years: this.props.params.years,
            teams: this.props.params.teams,
            geo_search: this.props.params.search,
            normalized: this.props.params.normalized,
            isLocator: 'true',
            located: this.props.params.located,
        };

        if (toExport) {
            urlParams[exportType] = true;
        }

        Object.keys(urlParams).forEach((key) => {
            const value = urlParams[key];
            if (value) {
                url += `&${key}=${value}`;
            }
        });
        return url;
    }

    selectCase(caseItem) {
        this.props.redirectTo('', {
            case_id: caseItem.id,
            ...this.props.params,
        });
    }

    selectProvince(provinceId) {
        const tempParams = {
            ...this.props.params,
            province_id: provinceId,
        };
        delete tempParams.zs_id;
        delete tempParams.as_id;
        if (!provinceId) {
            delete tempParams.province_id;
        }
        this.props.redirectTo(baseUrl, tempParams);
    }

    selectZone(zoneId) {
        const tempParams = {
            ...this.props.params,
            zs_id: zoneId,
        };
        delete tempParams.as_id;
        if (!zoneId) {
            delete tempParams.zs_id;
        }
        this.props.redirectTo(baseUrl, tempParams);
    }

    selectArea(areaId) {
        const tempParams = {
            ...this.props.params,
            as_id: areaId,
        };
        if (!areaId) {
            delete tempParams.as_id;
        }
        this.props.redirectTo(baseUrl, tempParams);
    }


    render() {
        const {
            intl: {
                formatMessage,
            },
            params,
            reduxPage,
            setCasesList,
        } = this.props;
        return (
            <section>
                <div className="widget__container">
                    <ListFilters
                        filters={this.props.listFilters}
                        params={params}
                        redirect={(redirectParams) => {
                            const tempParam = {
                                ...redirectParams,
                            };
                            tempParam.page = 1;
                            return (this.props.redirectTo(baseUrl, tempParam));
                        }}
                        resetSearch={() => this.props.resetSearch()}
                        listFilters={this.props.listFilters}
                        selectProvince={provindeId => this.selectProvince(provindeId)}
                        selectZone={zsId => this.selectZone(zsId)}
                        selectArea={asId => this.selectArea(asId)}
                    />
                    <SearchButton onSearch={() => this.onSearch()} />
                </div>
                <div className="locator-container">
                    {
                        this.props.load.loading
                        && (
                            <div>
                                <LoadingSpinner message={formatMessage({
                                    defaultMessage: 'Loading',
                                    id: 'main.label.loading',
                                })}
                                />
                            </div>
                        )
                    }
                    {
                        this.state.tableUrl
                        && (
                            <div className="widget__container  no-border">
                                <CustomTableComponent
                                    isSortable
                                    showPagination
                                    endPointUrl={this.state.tableUrl}
                                    columns={this.state.tableColumns}
                                    defaultSorted={[{ id: 'form_year', desc: false }]}
                                    params={params}
                                    defaultPath="list"
                                    dataKey="cases"
                                    onRowClicked={caseItem => this.selectCase(caseItem)}
                                    multiSort
                                    onDataLoaded={(newCasesList, count, pages) => setCasesList(newCasesList, true, params, count, pages)}
                                    reduxPage={reduxPage}
                                />
                                <div className="align-right">
                                    <DownloadButtonsComponent
                                        csvUrl={this.getEndpointUrl(true, 'csv')}
                                        xlsxUrl={this.getEndpointUrl(true, 'xlsx')}
                                    />
                                </div>
                            </div>
                        )
                    }
                </div>
            </section>
        );
    }
}

ListLocator.defaultProps = {
    reduxPage: undefined,
};

ListLocator.propTypes = {
    params: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    fetchProvinces: PropTypes.func.isRequired,
    listFilters: PropTypes.object.isRequired,
    selectProvince: PropTypes.func.isRequired,
    selectZone: PropTypes.func.isRequired,
    selectArea: PropTypes.func.isRequired,
    resetSearch: PropTypes.func.isRequired,
    fetchTeams: PropTypes.func.isRequired,
    reduxPage: PropTypes.object,
    setCasesList: PropTypes.func.isRequired,
    fetchCurrentUserInfos: PropTypes.func.isRequired,
};

const LocatorWithIntl = injectIntl(ListLocator);

const MapDispatchToProps = dispatch => ({
    fetchTeams: () => dispatch(locatorActions.fetchTeams(dispatch)),
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    fetchProvinces: () => dispatch(provinceActions.fetchProvinces(dispatch)),
    selectProvince: (provinceId, zoneId, areaId) => dispatch(provinceActions.selectProvince(provinceId, dispatch, zoneId, areaId, null, false)),
    selectZone: (zoneId, areaId) => dispatch(locatorActions.selectZone(zoneId, undefined, dispatch, false, areaId)),
    selectArea: (areaId, zoneId) => dispatch(locatorActions.selectArea(areaId, undefined, dispatch, false, zoneId)),
    resetSearch: () => dispatch(locatorActions.resetSearch()),
    fetchCurrentUserInfos: () => dispatch(currentUserActions.fetchCurrentUserInfos(dispatch)),
    setCasesList: (patientList, showPagination, params, count, pages) => dispatch(caseActions.setCasesList(patientList, showPagination, params, count, pages)),
});

const MapStateToProps = state => ({
    load: state.load,
    listFilters: state.locator,
    kase: state.kase,
    reduxPage: state.kase.casesPage,
});


export default connect(MapStateToProps, MapDispatchToProps)(LocatorWithIntl);
