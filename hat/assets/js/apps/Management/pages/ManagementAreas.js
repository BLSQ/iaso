import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

import LoadingSpinner from '../../../components/loading-spinner';
import CustomTableComponent from '../../../components/CustomTableComponent';
import AreaModaleComponent from '../components/AreaModaleComponent';
import DeleteModaleComponent from '../../../components/DeleteModaleComponent';
import areasTableColumns from '../constants/areasTableColumns';
import ShapeModaleComponent from '../components/ShapeModaleComponent';
import SearchButton from '../../../components/SearchButton';
import FiltersComponent from '../../../components/FiltersComponent';
import DownloadButtonsComponent from '../../../components/DownloadButtonsComponent';

import { areaActions } from '../redux/areas';
import { filterActions } from '../../../redux/filtersRedux';
import { currentUserActions } from '../../../redux/currentUserReducer';
import { smallMapActions } from '../../../redux/smallMapReducer';

import { filtersSearch, filtersGeo, filtersShapes } from '../constants/areasFilters';

import { userHasPermission } from '../../../utils';
import { createUrl } from '../../../utils/fetchData';

const baseUrl = 'areas';

class ManagementAreas extends React.Component {
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
            showEditModale: nextProps.selectedArea !== null,
        });
        const { intl: { formatMessage }, permissions, currentUser } = nextProps;
        if (nextProps.currentUser.id
            && permissions.length > 0
            && this.state.tableColumns.length === 0) {
            const userCanEditOrDelete = userHasPermission(permissions, currentUser, 'x_management_edit_areas');
            const userCanEditShape = userHasPermission(permissions, currentUser, 'x_management_edit_shape_areas');
            this.setState({
                tableColumns: areasTableColumns(formatMessage, this, userCanEditOrDelete, userCanEditShape),
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
        let newEndPointUrl = '/api/as/?';
        const {
            params,
        } = this.props;
        const urlParams = {
            province_id: params.province_id,
            zs_id: params.zs_id,
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

    saveData(newData, shapeUpdated = false) {
        const { dispatch } = this.props;
        if (newData.id === 0) {
            dispatch(areaActions.createArea(dispatch, newData));
        } else {
            dispatch(areaActions.updateArea(dispatch, newData));
        }
        if (shapeUpdated) {
            setTimeout(() => {
                this.props.fetchGeoDatas(false, false, true);
            }, 500);
        }
    }

    deleteData(element) {
        const { dispatch } = this.props;
        this.setState({
            showDeleteModale: false,
            dataDeleted: undefined,
        });
        dispatch(areaActions.deleteArea(dispatch, element));
    }

    editShape(area) {
        this.setState({
            showEditShape: true,
        });
        this.props.fetchAreaDetail(area.id);
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
            updateCurrentArea,
            selectedArea,
            isUpdated,
            selectArea,
            selectedShapeItem,
            geoProvinces,
            geoFilters: {
                provinces,
                zones,
            },
        } = this.props;
        const geo = filtersGeo(
            provinces || [],
            zones || [],
            this.props,
            baseUrl,
        );
        const search = filtersSearch(this, formatMessage);
        const shapes = filtersShapes(formatMessage);
        return (
            <section>
                {
                    this.state.showEditModale
                    && (
                        <AreaModaleComponent
                            showModale={this.state.showEditModale}
                            closeModal={() => selectArea(null)}
                            area={selectedArea}
                            saveArea={newArea => this.saveData(newArea)}
                            updateCurrentArea={area => updateCurrentArea(area)}
                            params={this.props.params}
                            geoProvinces={geoProvinces}
                        />
                    )
                }
                {
                    this.state.showEditShape
                    && selectedShapeItem
                    && (
                        <ShapeModaleComponent
                            showModale={this.state.showEditShape}
                            closeModal={() => this.closeShapeModal()}
                            item={selectedShapeItem}
                            saveShape={newArea => this.saveData(newArea, true)}
                            isUpdated={isUpdated}
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
                                id="main.label.areas"
                                defaultMessage="Health area"
                            />
                        </h2>
                        <button
                            className="button--save--tiny"
                            onClick={() => selectArea({ id: 0 })}
                        >
                            <i className="fa fa-plus" />
                            <FormattedMessage id="mangement.label.addArea" defaultMessage="New area" />
                        </button>

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
                                    onDataLoaded={areasList => (this.props.setAreas(areasList))}
                                    onDataUpdated={isDataUpdated => (this.props.areaUpdated(isDataUpdated))}
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
                        )
                    }
                </div>
            </section>
        );
    }
}

ManagementAreas.defaultProps = {
    selectedArea: null,
    selectedShapeItem: null,
};

ManagementAreas.propTypes = {
    params: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    setAreas: PropTypes.func.isRequired,
    areaUpdated: PropTypes.func.isRequired,
    updateCurrentArea: PropTypes.func.isRequired,
    selectArea: PropTypes.func.isRequired,
    isUpdated: PropTypes.bool.isRequired,
    selectedArea: PropTypes.object,
    fetchProvinces: PropTypes.func.isRequired,
    fetchGeoDatas: PropTypes.func.isRequired,
    geoFilters: PropTypes.object.isRequired,
    geoProvinces: PropTypes.object.isRequired,
    selectProvince: PropTypes.func.isRequired,
    currentUser: PropTypes.object.isRequired,
    permissions: PropTypes.array.isRequired,
    fetchCurrentUserInfos: PropTypes.func.isRequired,
    selectedShapeItem: PropTypes.object,
    fetchAreaDetail: PropTypes.func.isRequired,
    resetShapeItem: PropTypes.func.isRequired,
};

const ManagementAreasIntl = injectIntl(ManagementAreas);

const MapStateToProps = state => ({
    load: state.load,
    isUpdated: state.areas.isUpdated,
    selectedArea: state.areas.current,
    geoFilters: state.geoFilters,
    geoProvinces: state.map.geoProvinces,
    currentUser: state.currentUser.user,
    permissions: state.currentUser.permissions,
    selectedShapeItem: state.areas.selectedShapeItem,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    setAreas: areas => dispatch(areaActions.setAreas(areas)),
    areaUpdated: isUpdated => dispatch(areaActions.areaUpdated(isUpdated)),
    updateCurrentArea: areaId => dispatch(areaActions.updateCurrentArea(areaId)),
    selectArea: area => dispatch(areaActions.selectArea(area)),
    fetchProvinces: () => dispatch(filterActions.fetchProvinces(dispatch)),
    fetchGeoDatas: (withProvinces, withZones, withAreas) => dispatch(smallMapActions.fetchGeoDatas(dispatch, withProvinces, withZones, withAreas)),
    selectProvince: provinceId => dispatch(filterActions.selectProvince(provinceId, dispatch)),
    fetchCurrentUserInfos: () => dispatch(currentUserActions.fetchCurrentUserInfos(dispatch)),
    fetchAreaDetail: areaId => dispatch(areaActions.fetchAreaDetail(dispatch, areaId)),
    resetShapeItem: () => dispatch(areaActions.resetShapeItem()),
});

export default connect(MapStateToProps, MapDispatchToProps)(ManagementAreasIntl);
