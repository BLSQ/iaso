import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

import LoadingSpinner from '../../../components/loading-spinner';
import CustomTableComponent from '../../../components/CustomTableComponent';
import AreaModaleComponent from '../components/AreaModaleComponent';
import DeleteModaleComponent from '../components/DeleteModaleComponent';
import areasTableColumns from '../constants/areasTableColumns';
import ShapeModaleComponent from '../components/ShapeModaleComponent';
import SearchButton from '../../../components/SearchButton';
import FiltersComponent from '../../../components/FiltersComponent';
import DownloadButtonsComponent from '../../../components/DownloadButtonsComponent';

import { areaActions } from '../redux/areas';
import { filterActions } from '../../../redux/filtersRedux';
import { currentUserActions } from '../../../redux/currentUserReducer';

import { filtersSearch, filtersGeo } from '../constants/areasFilters';

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
        if (nextProps.currentUser.id &&
            permissions.length > 0 &&
            this.state.tableColumns.length === 0) {
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
            dispatch(areaActions.createArea(dispatch, newData));
        } else {
            dispatch(areaActions.updateArea(dispatch, newData));
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
        console.log(area);
        this.setState({
            showEditShape: true,
        });
    }

    render() {
        const { loading } = this.props.load;
        const { formatMessage } = this.props.intl;
        const {
            updateCurrentArea,
            selectedArea,
            isUpdated,
            load,
            selectArea,
            selectedShape,
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
        const search = filtersSearch(this);
        return (
            <section>
                {
                    this.state.showEditModale &&
                    <AreaModaleComponent
                        showModale={this.state.showEditModale}
                        closeModal={() => selectArea(null)}
                        area={selectedArea}
                        saveArea={newArea => this.saveData(newArea)}
                        updateCurrentArea={area => updateCurrentArea(area)}
                        isUpdated={isUpdated}
                        error={load.error}
                        params={this.props.params}
                        geoProvinces={geoProvinces}
                    />
                }
                {
                    this.state.showEditShape &&
                    <ShapeModaleComponent
                        showModale={this.state.showEditShape}
                        closeModal={() => this.setState({ showEditShape: false })}
                        shape={sele}
                        saveShape={newShape => console.log(newShape)}
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
                                id="management.areas.title"
                                defaultMessage="Aires de santé"
                            />
                        </h2>

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
                    }
                </div>
            </section>);
    }
}

ManagementAreas.defaultProps = {
    selectedArea: null,
    selectedShape: null,
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
    selectedShape: PropTypes.object,
};

const ManagementAreasIntl = injectIntl(ManagementAreas);

const MapStateToProps = state => ({
    load: state.load,
    isUpdated: state.areas.isUpdated,
    selectedArea: state.areas.current,
    geoFilters: state.geoFilters,
    geoProvinces: state.areas.geoProvinces,
    currentUser: state.currentUser.user,
    permissions: state.currentUser.permissions,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    setAreas: areas => dispatch(areaActions.setAreas(areas)),
    areaUpdated: isUpdated => dispatch(areaActions.areaUpdated(isUpdated)),
    updateCurrentArea: areaId => dispatch(areaActions.updateCurrentArea(areaId)),
    selectArea: area => dispatch(areaActions.selectArea(area)),
    fetchProvinces: () => dispatch(filterActions.fetchProvinces(dispatch)),
    fetchGeoDatas: () => dispatch(areaActions.fetchGeoDatas(dispatch)),
    selectProvince: provinceId => dispatch(filterActions.selectProvince(provinceId, dispatch)),
    fetchCurrentUserInfos: () => dispatch(currentUserActions.fetchCurrentUserInfos(dispatch)),
});

export default connect(MapStateToProps, MapDispatchToProps)(ManagementAreasIntl);

