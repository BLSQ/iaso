import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import LoadingSpinner from '../../../components/loading-spinner';
import PeriodSelectorComponent from '../../../components/PeriodSelectorComponent';
import { createUrl } from '../../../utils/fetchData';
import { filterActions } from '../../../redux/filtersRedux';

import casesListColumns from '../constants/casesListColumns';
import CustomTableComponent from '../../../components/CustomTableComponent';

import FiltersComponent from '../../../components/FiltersComponent';
import DownloadButtonsComponent from '../../../components/DownloadButtonsComponent';
import { filtersCases, filtersCases2, filtersCasesSearch, filtersCasesGeo } from '../constants/filtersSelect';
import { casesActions } from '../redux/cases';
import { currentUserActions } from '../../../redux/currentUserReducer';
import SearchButton from '../../../components/SearchButton';
import { anonymous } from '../../../utils/constants/filters';

export const urls = [];

class Cases extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tableColumns: casesListColumns(props.intl.formatMessage),
            tableUrl: null,
        };
    }

    componentWillMount() {
        if (this.props.params.back) {
            this.onSearch();
            const { params } = this.props;
            delete params.back;
            this.props.redirectTo('tests', params);
        }
        Promise.all([
            this.props.fetchProvinces(),
            this.props.fetchTeams(),
            this.props.fetchCoordinations(),
            this.props.fetchDevices(),
            this.props.fetchCurrentUserInfos(),
        ]).then(() => {
            if (this.props.params.province_id) {
                this.props.selectProvince(this.props.params.province_id, this.props.params.zs_id, this.props.params.as_id, this.props.params.village_id);
            } else if (this.props.params.zs_id) {
                this.props.selectZone(this.props.params.zs_id, this.props.params.as_id, this.props.params.village_id);
            } else if (this.props.params.as_id) {
                this.props.selectArea(this.props.params.as_id, this.props.params.village_id, this.props.params.zs_id);
            } else if (this.props.params.village_id) {
                this.props.selectVillage(this.props.params.village_id);
            }
        });
    }

    componentWillReceiveProps(newProps) {
        if (newProps.params.province_id !== this.props.params.province_id) {
            this.props.selectProvince(newProps.params.province_id, newProps.params.zs_id, newProps.params.as_id, newProps.params.village_id);
        } else if (newProps.params.zs_id !== this.props.params.zs_id) {
            this.props.selectZone(newProps.params.zs_id, newProps.params.as_id, newProps.params.village_id);
        } else if (newProps.params.as_id !== this.props.params.as_id) {
            this.props.selectArea(newProps.params.as_id, newProps.params.village_id, newProps.params.zs_id);
        } else if (newProps.params.village_id !== this.props.params.village_id) {
            this.props.selectVillage(newProps.params.village_id);
        }
    }

    onSearch() {
        this.setState({
            tableUrl: this.getEndpointUrl(),
        });
    }

    getEndpointUrl(toExport = false, exportType = 'csv') {
        let url = '/api/cases/?';
        const {
            params,
        } = this.props;

        const urlParams = {
            ...params,
            located: params.located ? params.located : 'all',
            from: params.date_from,
            to: params.date_to,
        };
        if (urlParams.workzone_id) {
            delete urlParams.workzone_id;
        }

        if (toExport) {
            urlParams[exportType] = true;
            urlParams.anonymous = params.anonymous;
        }
        if (urlParams.order) {
            delete urlParams.order;
        }

        Object.keys(urlParams).forEach((key) => {
            const value = urlParams[key];
            if (value && !url.includes(key)) {
                url += `&${key}=${value}`;
            }
        });
        return url;
    }

    selectCase(caseItem, event) {
        if (event.currentTarget.children[0] && event.currentTarget.children[0].classList[1] === 'not-located') {
            window.open(`/dashboard/locator/case_id/${caseItem.id}`, '_blank');
        } else {
            const { params } = this.props;

            const newParams = {
                patient_id: caseItem.patient.id,
                case_id: caseItem.id,
                ...params,
                tab: 'tests',
            };

            this.props.redirectTo('tests/detail', newParams);
        }
    }

    render() {
        const { formatMessage } = this.props.intl;
        const {
            filters: {
                teams,
                coordinations,
                provinces,
                zones,
                areas,
                villages,
                devices,
            },
            reduxPage,
            params,
            setCasesList,
        } = this.props;
        const filters1 = filtersCases(formatMessage, devices);
        const filters2 = filtersCases2(formatMessage, coordinations || [], teams || [], this.props.params.located === 'only_not_located');
        const search = filtersCasesSearch(formatMessage, this);
        const geo = filtersCasesGeo(
            provinces || [],
            zones || [],
            areas || [],
            villages || [],
            this.props,
            'tests',
        );

        return (
            <section className="cases-list-container">
                {
                    this.props.load.loading && <LoadingSpinner message={formatMessage({
                        defaultMessage: 'Loading',
                        id: 'main.label.loading',
                    })}
                    />
                }

                <div className="widget__container ">
                    <div className="widget__header">
                        <h2 className="widget__heading"><FormattedMessage id="datas.tests.header.title" defaultMessage="Tests" /></h2>
                    </div>
                    <div className="widget__header widget__content--quarter">
                        <PeriodSelectorComponent
                            dateFrom={this.props.params.date_from}
                            dateTo={this.props.params.date_to}
                            onChangeDate={(dateFrom, dateTo) =>
                                this.props.redirectTo('tests', {
                                    ...this.props.params,
                                    date_from: dateFrom,
                                    date_to: dateTo,
                                })}
                        />
                    </div>
                    <div className="widget__content--quarter">
                        <div>
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl="tests"
                                filters={geo}
                            />
                        </div>
                        <div>
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl="tests"
                                filters={search}
                            />
                        </div>
                        <div>
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl="tests"
                                filters={filters1}
                            />
                        </div>
                        <div>
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl="tests"
                                filters={filters2}
                            />
                        </div>
                    </div>
                    <SearchButton onSearch={() => this.onSearch()} />
                </div>
                {
                    this.state.tableUrl &&
                    <div className="widget__container  no-border">
                        <CustomTableComponent
                            isSortable
                            showPagination
                            endPointUrl={this.state.tableUrl}
                            columns={this.state.tableColumns}
                            defaultSorted={[{ id: 'form_year', desc: false }]}
                            params={this.props.params}
                            defaultPath="tests"
                            dataKey="cases"
                            onRowClicked={(caseItem, state, event) => this.selectCase(caseItem, event)}
                            multiSort
                            onDataLoaded={(newCasesList, count, pages) => setCasesList(newCasesList, true, params, count, pages)}
                            reduxPage={reduxPage}
                        />
                        <div className="align-right">
                            <div className="display-inline-block">
                                <FiltersComponent
                                    params={this.props.params}
                                    baseUrl="tests"
                                    filters={[anonymous()]}
                                />
                            </div>
                            <DownloadButtonsComponent
                                csvUrl={this.getEndpointUrl(true, 'csv')}
                                xlsxUrl={this.getEndpointUrl(true, 'xlsx')}
                            />
                        </div>
                    </div>
                }
            </section>
        );
    }
}
Cases.defaultProps = {
    reduxPage: undefined,
};

Cases.propTypes = {
    load: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    filters: PropTypes.object.isRequired,
    fetchProvinces: PropTypes.func.isRequired,
    fetchTeams: PropTypes.func.isRequired,
    fetchCoordinations: PropTypes.func.isRequired,
    fetchDevices: PropTypes.func.isRequired,
    selectProvince: PropTypes.func.isRequired,
    selectVillage: PropTypes.func.isRequired,
    selectZone: PropTypes.func.isRequired,
    selectArea: PropTypes.func.isRequired,
    reduxPage: PropTypes.object,
    setCasesList: PropTypes.func.isRequired,
    fetchCurrentUserInfos: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    load: state.load,
    filters: state.testsFilters,
    reduxPage: state.cases.casesPage,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    fetchTeams: () => dispatch(filterActions.fetchTeams(dispatch)),
    fetchCoordinations: () => dispatch(filterActions.fetchCoordinations(dispatch)),
    fetchProvinces: () => dispatch(filterActions.fetchProvinces(dispatch)),
    fetchDevices: () => dispatch(filterActions.fetchDevices(dispatch)),
    selectProvince: (provinceId, zoneId, areaId, villageId) => dispatch(filterActions.selectProvince(provinceId, dispatch, zoneId, areaId, villageId)),
    selectVillage: villageId => dispatch(filterActions.selectVillage(villageId, dispatch)),
    selectZone: (zoneId, areaId, villageId) => dispatch(filterActions.selectZone(zoneId, dispatch, true, areaId, villageId)),
    selectArea: (areaId, villageId, zoneId) => dispatch(filterActions.selectArea(areaId, dispatch, true, zoneId, villageId)),
    setCasesList: (patientList, showPagination, params, count, pages) => dispatch(casesActions.setCasesList(patientList, showPagination, params, count, pages)),
    fetchCurrentUserInfos: () => dispatch(currentUserActions.fetchCurrentUserInfos(dispatch)),
});

const CasesWithIntl = injectIntl(Cases);

export default connect(MapStateToProps, MapDispatchToProps)(CasesWithIntl);
