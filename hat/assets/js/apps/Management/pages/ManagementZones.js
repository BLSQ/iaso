import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

import LoadingSpinner from '../../../components/loading-spinner';
import CustomTableComponent from '../../../components/CustomTableComponent';
import ZoneModaleComponent from '../components/ZoneModaleComponent';
import DeleteModaleComponent from '../components/DeleteModaleComponent';
import ShapeModaleComponent from '../components/ShapeModaleComponent';
import FiltersComponent from '../../../components/FiltersComponent';
import DownloadButtonsComponent from '../../../components/DownloadButtonsComponent';
import SearchButton from '../../../components/SearchButton';

import zonesTableColumns from '../constants/zonesTableColumns';
import { filtersSearch, filtersGeo, filtersShapes } from '../constants/zonesFilters';

import { zoneActions } from '../redux/zones';
import { filterActions } from '../../../redux/filtersRedux';
import { currentUserActions } from '../../../redux/currentUserReducer';
import { mapActions } from '../redux/mapReducer';

import { userHasPermission } from '../../../utils';
import { createUrl } from '../../../utils/fetchData';


const baseUrl = 'zones';

class ManagementZones extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tableColumns: [],
            showEditModale: false,
            showDeleteModale: false,
            showEditShape: false,
            dataDeleted: undefined,
            tableUrl: null,
        };
    }

    componentWillMount() {
        Promise.all([
            this.props.fetchProvinces(),
            this.props.fetchGeoDatas(),
            this.props.fetchCurrentUserInfos(),
        ]).then(() => {
            if (this.props.params.province_id) {
                this.props.selectProvince(this.props.params.province_id);
            }
        });
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            showEditModale: nextProps.selectedZone !== null,
        });
        const { intl: { formatMessage }, permissions, currentUser } = nextProps;
        if (nextProps.currentUser.id &&
            permissions.length > 0 &&
            this.state.tableColumns.length === 0) {
            const userCanEditOrDelete = userHasPermission(permissions, currentUser, 'x_management_edit_zones');
            const userCanEditShape = userHasPermission(permissions, currentUser, 'x_management_edit_shape_zones');

            this.setState({
                tableColumns: zonesTableColumns(formatMessage, this, userCanEditOrDelete, userCanEditShape),
            });
        }
        if (nextProps.params.province_id !== this.props.params.province_id) {
            this.props.selectProvince(nextProps.params.province_id);
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
        let newEndPointUrl = '/api/zs/?';
        const {
            params,
        } = this.props;
        const urlParams = {
            province_id: params.province_id,
            search: params.search,
            shapes: params.shapes,
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
            dispatch(zoneActions.createZone(dispatch, newData));
        } else {
            dispatch(zoneActions.updateZone(dispatch, newData));
        }
    }

    deleteData(element) {
        const { dispatch } = this.props;
        this.setState({
            showDeleteModale: false,
            dataDeleted: undefined,
        });
        dispatch(zoneActions.deleteZone(dispatch, element));
    }

    editShape(zone) {
        this.setState({
            showEditShape: true,
        });
        this.props.fetchZoneDetail(zone.id);
    }

    closeShapeModal() {
        this.setState({
            showEditShape: false,
        });
        this.props.resetShapeItem();
    }

    render() {
        const { loading } = this.props.load;
        const { formatMessage } = this.props.intl;
        const {
            updateCurrentZone,
            selectedZone,
            isUpdated,
            load,
            selectZone,
            selectedShapeItem,
            geoProvinces,
            geoFilters: {
                provinces,
            },
        } = this.props;
        const geo = filtersGeo(
            provinces || [],
            this.props,
            baseUrl,
        );
        const search = filtersSearch(this);
        const shapes = filtersShapes(formatMessage);
        return (
            <section>
                {
                    this.state.showEditModale &&
                    <ZoneModaleComponent
                        showModale={this.state.showEditModale}
                        closeModal={() => selectZone(null)}
                        zone={selectedZone}
                        saveZone={newZone => this.saveData(newZone)}
                        updateCurrentZone={zone => updateCurrentZone(zone)}
                        isUpdated={isUpdated}
                        error={load.error}
                        params={this.props.params}
                        geoProvinces={geoProvinces}
                    />
                }
                {
                    this.state.showEditShape &&
                    selectedShapeItem &&
                    <ShapeModaleComponent
                        showModale={this.state.showEditShape}
                        closeModal={() => this.closeShapeModal()}
                        item={selectedShapeItem}
                        saveShape={newZone => this.saveData(newZone)}
                        isUpdated={isUpdated}
                        error={load.error}
                    />
                }
                {
                    this.state.showDeleteModale &&
                    <DeleteModaleComponent
                        showModale={this.state.showDeleteModale}
                        toggleModal={() => this.toggleDeleteModale()}
                        element={this.state.dataDeleted}
                        deleteElement={element => this.deleteData(element)}
                        message={this.state.dataDeleted.name}
                    />
                }
                <div className="widget__container management-control">
                    <div className="widget__header">
                        <h2 className="widget__heading">
                            <FormattedMessage
                                id="main.label.zones"
                                defaultMessage="Health zones"
                            />
                        </h2>

                    </div>
                </div>
                <div className="widget__container ">
                    <div className="widget__content--tier">
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
                                filters={shapes}
                            />
                        </div>
                    </div>
                    <SearchButton onSearch={() => this.onSearch()} />
                </div>
                <div className="widget__container management-control">
                    {
                        loading &&
                        <LoadingSpinner message={formatMessage({
                            defaultMessage: 'Chargement en cours',
                            id: 'main.label.loading',
                        })}
                        />
                    }
                    {
                        this.state.tableUrl &&
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
                                onDataLoaded={zonesList => (this.props.setZones(zonesList))}
                                onDataUpdated={isDataUpdated => (this.props.zoneUpdated(isDataUpdated))}
                                isUpdated={isUpdated}
                                canSelect={false}
                            />
                            <div className="widget__content align-right border-top">
                                <DownloadButtonsComponent
                                    csvUrl={this.getEndpointUrl(true, 'csv')}
                                    xlsxUrl={this.getEndpointUrl(true, 'xlsx')}
                                />
                            </div>
                        </section>
                    }
                </div>
            </section>);
    }
}

ManagementZones.defaultProps = {
    selectedZone: null,
    selectedShapeItem: null,
};

ManagementZones.propTypes = {
    params: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    setZones: PropTypes.func.isRequired,
    zoneUpdated: PropTypes.func.isRequired,
    updateCurrentZone: PropTypes.func.isRequired,
    selectZone: PropTypes.func.isRequired,
    selectedShapeItem: PropTypes.object,
    isUpdated: PropTypes.bool.isRequired,
    selectedZone: PropTypes.object,
    fetchProvinces: PropTypes.func.isRequired,
    fetchGeoDatas: PropTypes.func.isRequired,
    geoFilters: PropTypes.object.isRequired,
    geoProvinces: PropTypes.object.isRequired,
    selectProvince: PropTypes.func.isRequired,
    fetchCurrentUserInfos: PropTypes.func.isRequired,
    currentUser: PropTypes.object.isRequired,
    permissions: PropTypes.array.isRequired,
    fetchZoneDetail: PropTypes.func.isRequired,
    resetShapeItem: PropTypes.func.isRequired,
};

const ManagementZonesIntl = injectIntl(ManagementZones);

const MapStateToProps = state => ({
    load: state.load,
    isUpdated: state.zones.isUpdated,
    selectedZone: state.zones.current,
    selectedShapeItem: state.zones.selectedShapeItem,
    geoFilters: state.geoFilters,
    geoProvinces: state.map.geoProvinces,
    currentUser: state.currentUser.user,
    permissions: state.currentUser.permissions,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    setZones: zones => dispatch(zoneActions.setZones(zones)),
    zoneUpdated: isUpdated => dispatch(zoneActions.zoneUpdated(isUpdated)),
    updateCurrentZone: zoneId => dispatch(zoneActions.updateCurrentZone(zoneId)),
    selectZone: zone => dispatch(zoneActions.selectZone(zone)),
    fetchZoneDetail: zoneId => dispatch(zoneActions.fetchZoneDetail(dispatch, zoneId)),
    resetShapeItem: () => dispatch(zoneActions.resetShapeItem()),
    fetchProvinces: () => dispatch(filterActions.fetchProvinces(dispatch)),
    fetchGeoDatas: () => dispatch(mapActions.fetchGeoDatas(dispatch)),
    selectProvince: provinceId => dispatch(filterActions.selectProvince(provinceId, dispatch)),
    fetchCurrentUserInfos: () => dispatch(currentUserActions.fetchCurrentUserInfos(dispatch)),
});

export default connect(MapStateToProps, MapDispatchToProps)(ManagementZonesIntl);

