import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';

import LoadingSpinner from '../../../components/loading-spinner';
import CustomTableComponent from '../../../components/CustomTableComponent';
import { createUrl } from '../../../utils/fetchData';
import VillageModaleComponent from '../components/VillageModaleComponent';
import DeleteModaleComponent from '../../../components/DeleteModaleComponent';
import villagesTableColumns from '../constants/villagesTableColumns';
import { villageActions } from '../redux/villages';
import { smallMapActions } from '../../../redux/smallMapReducer';
import { filterActions } from '../../../redux/filtersRedux';
import FiltersComponent from '../../../components/FiltersComponent';
import DownloadButtonsComponent from '../../../components/DownloadButtonsComponent';
import {
    filtersZone1, filtersZone2, filtersSearch, filtersGeo,
} from '../constants/villagesFilters';
import { currentUserActions } from '../../../redux/currentUserReducer';
import SearchButton from '../../../components/SearchButton';

const newItem = {
    id: 0,
    name: '',
    latitude: 0,
    longitude: 0,
    aliases: [],
};

const baseUrl = 'villages';

class ManagementVillages extends React.Component {
    constructor(props) {
        super(props);
        const { formatMessage } = props.intl;
        this.state = {
            tableColumns: villagesTableColumns(formatMessage, this),
            showEditModale: false,
            showDeleteModale: false,
            dataDeleted: undefined,
            tableUrl: null,
        };
    }

    componentWillMount() {
        Promise.all([
            this.props.fetchProvinces(),
            this.props.fetchGeoDatas(),
            this.props.fetchVillageSource(),
            this.props.fetchCurrentUserInfos(),
        ]).then(() => {
            if (this.props.params.province_id) {
                this.props.selectProvince(this.props.params.province_id);
            }
            if (this.props.params.zs_id) {
                this.props.selectZone(this.props.params.zs_id, this.props.params.as_id, this.props.params.village_id);
            }
            if (this.props.params.as_id) {
                this.props.selectArea(this.props.params.as_id, this.props.params.village_id, this.props.params.zs_id);
            }
        });
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            showEditModale: nextProps.selectedVillage !== null,
        });
        if (nextProps.params.province_id !== this.props.params.province_id) {
            this.props.selectProvince(nextProps.params.province_id);
        }
        if (nextProps.params.zs_id !== this.props.params.zs_id) {
            this.props.selectZone(nextProps.params.zs_id, nextProps.params.as_id, nextProps.params.village_id);
        }
        if (nextProps.params.as_id !== this.props.params.as_id) {
            this.props.selectArea(nextProps.params.as_id, nextProps.params.village_id, nextProps.params.zs_id);
        }
    }


    onSearch() {
        this.setState({
            tableUrl: this.getEndpointUrl(),
        });
    }

    onChangeFilters(key, value) {
        this.props.redirectTo(baseUrl, {
            ...this.props.params,
            [key]: value,
        });
    }

    getEndpointUrl(toExport = false, exportType = 'csv') {
        let newEndPointUrl = '/api/villages/?';
        const {
            params,
        } = this.props;
        const urlParams = {
            include_unlocated: true,
            unlocated: params.unlocated,
            types: params.village_official ? params.village_official : 'all',
            province_id: params.province_id,
            zs_id: params.zs_id,
            as_id: params.as_id,
            search: params.search,
            population: params.population,
            results: params.results,
            village_source: params.village_source,
            as_list: true,
        };

        if (toExport) {
            delete urlParams.as_list;
            urlParams[exportType] = true;
        }

        Object.keys(urlParams).forEach((key) => {
            const value = urlParams[key];
            if (value) {
                newEndPointUrl += `&${key}=${value}`;
            }
        });
        return newEndPointUrl;
    }

    toggleDeleteModale() {
        this.setState({
            showDeleteModale: !this.state.showDeleteModale,
            dataDeleted:
                !this.state.showDeleteModale ? this.state.dataDeleted : undefined,
        });
    }

    saveData(newData) {
        const { dispatch } = this.props;
        if (newData.id === 0) {
            dispatch(villageActions.createVillage(dispatch, newData));
        } else {
            dispatch(villageActions.updateVillage(dispatch, newData));
        }
    }

    deleteData(element) {
        const { dispatch } = this.props;
        this.setState({
            showDeleteModale: false,
            dataDeleted: undefined,
        });
        dispatch(villageActions.deleteVillage(dispatch, element));
    }

    render() {
        const { loading } = this.props.load;
        const { formatMessage } = this.props.intl;
        const {
            isUpdated,
            load,
            selectVillage,
            geoProvinces,
            geoFilters: {
                provinces,
                zones,
                areas,
                villageSources,
            },
        } = this.props;
        const filters1 = filtersZone1(formatMessage, defineMessages, villageSources);
        const filters2 = filtersZone2(formatMessage, defineMessages);
        const geo = filtersGeo(
            provinces || [],
            zones || [],
            areas || [],
            this.props,
            baseUrl,
        );
        const search = filtersSearch(formatMessage, defineMessages, this);
        return (
            <section>
                {
                    this.state.showEditModale
                    && (
                        <VillageModaleComponent
                            showModale={this.state.showEditModale}
                            closeModal={() => selectVillage(null)}
                            saveVillage={newVillage => this.saveData(newVillage)}
                            isUpdated={isUpdated}
                            error={load.error}
                            params={this.props.params}
                            geoProvinces={geoProvinces}
                            villageSources={villageSources}
                        />
                    )
                }
                {
                    this.state.showDeleteModale
                    && (
                        <DeleteModaleComponent
                            showModale={this.state.showDeleteModale}
                            toggleModal={() => this.toggleDeleteModale()}
                            element={this.state.dataDeleted}
                            deleteElement={element => this.deleteData(element)}
                            message={this.state.dataDeleted.name}
                        />
                    )
                }
                <div className="widget__container management-control">
                    <div className="widget__header with-button">
                        <h2 className="widget__heading">
                            <FormattedMessage
                                id="main.label.villages"
                                defaultMessage="Villages"
                            />
                        </h2>
                        <button
                            className="button--save--tiny"
                            onClick={() => this.props.selectVillage(newItem)}
                        >
                            <i className="fa fa-plus" />
                            <FormattedMessage id="main.label.new" defaultMessage="New" />
                        </button>

                    </div>
                </div>
                <div className="widget__container ">
                    <div className="widget__content--quarter">
                        <div>
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl={baseUrl}
                                filters={search}
                            />
                        </div>
                        <div>
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl={baseUrl}
                                filters={geo}
                            />
                        </div>
                        <div>
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl={baseUrl}
                                filters={filters1}
                            />
                        </div>
                        <div>
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl={baseUrl}
                                filters={filters2}
                            />
                        </div>
                    </div>
                    <SearchButton onSearch={() => this.onSearch()} />
                </div>
                <div className="widget__container management-control">
                    {
                        loading
                        && (
                            <LoadingSpinner message={formatMessage({
                                defaultMessage: 'Chargement en cours',
                                id: 'main.label.loading',
                            })}
                            />
                        )
                    }
                    {
                        this.state.tableUrl
                        && (
                            <section>
                                <CustomTableComponent
                                    pageSize={50}
                                    withBorder={false}
                                    isSortable
                                    multiSort
                                    showPagination
                                    endPointUrl={this.state.tableUrl}
                                    columns={this.state.tableColumns}
                                    defaultSorted={[{ id: 'name', desc: false }]}
                                    params={this.props.params}
                                    defaultPath={baseUrl}
                                    dataKey={baseUrl}
                                    onDataLoaded={villages => (this.props.setVillages(villages))}
                                    onDataUpdated={isDataUpdated => (this.props.villageUpdated(isDataUpdated))}
                                    isUpdated={isUpdated}
                                    canSelect={false}
                                />
                                <div className="widget__content align-right border-top">
                                    <DownloadButtonsComponent
                                        csvUrl={this.getEndpointUrl(true, 'csv')}
                                        xlsxUrl={this.getEndpointUrl(true, 'xlsx')}
                                    />
                                    <button
                                        className="button--add"
                                        onClick={() => this.props.selectVillage(newItem)}
                                    >
                                        <i className="fa fa-plus" />
                                        <FormattedMessage id="main.label.new" defaultMessage="New" />
                                    </button>
                                </div>
                            </section>
                        )
                    }
                </div>
            </section>
        );
    }
}

ManagementVillages.defaultProps = {
    selectedVillage: null,
};

ManagementVillages.propTypes = {
    params: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    setVillages: PropTypes.func.isRequired,
    villageUpdated: PropTypes.func.isRequired,
    selectVillage: PropTypes.func.isRequired,
    isUpdated: PropTypes.bool.isRequired,
    selectedVillage: PropTypes.object,
    fetchProvinces: PropTypes.func.isRequired,
    fetchGeoDatas: PropTypes.func.isRequired,
    geoFilters: PropTypes.object.isRequired,
    geoProvinces: PropTypes.object.isRequired,
    selectProvince: PropTypes.func.isRequired,
    selectZone: PropTypes.func.isRequired,
    selectArea: PropTypes.func.isRequired,
    fetchVillageSource: PropTypes.func.isRequired,
    fetchCurrentUserInfos: PropTypes.func.isRequired,
};

const ManagementVillagesIntl = injectIntl(ManagementVillages);

const MapStateToProps = state => ({
    load: state.load,
    isUpdated: state.villages.isUpdated,
    selectedVillage: state.villages.current,
    geoFilters: state.geoFilters,
    geoProvinces: state.map.geoProvinces,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    setVillages: villages => dispatch(villageActions.setVillages(villages)),
    villageUpdated: isUpdated => dispatch(villageActions.villageUpdated(isUpdated)),
    selectVillage: village => dispatch(villageActions.selectVillage(village)),
    fetchProvinces: () => dispatch(filterActions.fetchProvinces(dispatch)),
    fetchGeoDatas: () => dispatch(smallMapActions.fetchGeoDatas(dispatch)),
    selectProvince: provinceId => dispatch(filterActions.selectProvince(provinceId, dispatch)),
    selectZone: (zoneId, areaId, villageId) => dispatch(filterActions.selectZone(zoneId, dispatch, false, areaId, villageId)),
    selectArea: (areaId, villageId, zoneId) => dispatch(filterActions.selectArea(areaId, dispatch, false, zoneId, villageId)),
    fetchVillageSource: () => dispatch(filterActions.fetchVillageSource(dispatch)),
    fetchCurrentUserInfos: () => dispatch(currentUserActions.fetchCurrentUserInfos(dispatch)),
});

export default connect(MapStateToProps, MapDispatchToProps)(ManagementVillagesIntl);
