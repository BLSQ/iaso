import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';

import ListFilters from '../components/ListFilters';
import Filters from '../components/Filters';
import { createUrl } from '../../../utils/fetchData';
import LoadingSpinner from '../../../components/loading-spinner';
import CustomTableComponent from '../../../components/CustomTableComponent';
import listLocatorColumns from '../constants/ListLocatorColumns';

import { locatorActions } from '../redux/locator';
import { provinceActions } from '../redux/province';


export class ListLocator extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tableColumns: listLocatorColumns(props.intl.formatMessage),
        };
    }

    componentWillMount() {
        Promise.all([
            this.props.fetchProvinces(),
            this.props.fetchTeams(),
        ]).then(() => {
            if (this.props.params.province_id) {
                this.props.selectProvince(this.props.params.province_id);
            }
            if (this.props.params.zs_id) {
                this.props.selectZone(this.props.params.zs_id);
            }
            if (this.props.params.as_id) {
                this.props.selectArea(this.props.params.as_id);
            }
        });
    }

    componentWillReceiveProps(newProps) {
        if (newProps.params.province_id !== this.props.params.province_id) {
            this.props.selectProvince(newProps.params.province_id);
        }
        if (newProps.params.zs_id !== this.props.params.zs_id) {
            this.props.selectZone(newProps.params.zs_id);
        }
        if (newProps.params.as_id !== this.props.params.as_id) {
            this.props.selectArea(newProps.params.as_id);
        }
    }

    getEnpointUrl() {
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
        };

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
        this.props.redirectTo('list', tempParams);
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
        this.props.redirectTo('list', tempParams);
    }

    selectArea(areaId) {
        const tempParams = {
            ...this.props.params,
            as_id: areaId,
        };
        if (!areaId) {
            delete tempParams.as_id;
        }
        this.props.redirectTo('list', tempParams);
    }


    render() {
        const { formatMessage } = this.props.intl;
        return (
            <section>
                <div className="widget__container">
                    <ListFilters
                        filters={this.props.listFilters}
                        params={this.props.params}
                        redirect={(params) => {
                            const tempParam = params;
                            tempParam.page = 1;
                            return (this.props.redirectTo('list', tempParam));
                        }}
                        resetSearch={() => this.props.resetSearch()}
                    />
                    <div className="widget__content list-locator-filters">
                        <Filters
                            isMultiSelect={false} // need to update api to work with multiple ids
                            showVillages={false}
                            isClearable
                            filters={this.props.listFilters}
                            selectProvince={provindeId => this.selectProvince(provindeId)}
                            selectZone={zsId => this.selectZone(zsId)}
                            selectArea={asId => this.selectArea(asId)}
                        />
                    </div>
                </div>
                <div className="locator-container widget__container no-border">
                    {
                        this.props.load.loading &&
                        <div>
                            <LoadingSpinner message={formatMessage({
                                defaultMessage: 'Chargement en cours',
                                id: 'microplanning.labels.loading',
                            })}
                            />
                        </div>
                    }

                    <CustomTableComponent
                        isSortable
                        showPagination
                        endPointUrl={this.getEnpointUrl()}
                        columns={this.state.tableColumns}
                        defaultSorted={[{ id: 'form_year', desc: false }]}
                        params={this.props.params}
                        defaultPath="list"
                        dataKey="cases"
                        onRowClicked={caseItem => this.selectCase(caseItem)}
                        multiSort
                    />
                </div>
            </section>
        );
    }
}

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
};

const LocatorWithIntl = injectIntl(ListLocator);

const MapDispatchToProps = dispatch => ({
    fetchTeams: () => dispatch(locatorActions.fetchTeams(dispatch)),
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    fetchProvinces: () => dispatch(provinceActions.fetchProvinces(dispatch)),
    selectProvince: provinceId => dispatch(provinceActions.selectProvince(provinceId, dispatch)),
    selectZone: zoneId => dispatch(locatorActions.selectZone(zoneId, undefined, dispatch)),
    selectArea: areaId => dispatch(locatorActions.selectArea(areaId, undefined, dispatch, true)),
    resetSearch: () => dispatch(locatorActions.resetSearch()),
});

const MapStateToProps = state => ({
    load: state.load,
    listFilters: state.locator,
    kase: state.kase,
});


export default connect(MapStateToProps, MapDispatchToProps)(LocatorWithIntl);
