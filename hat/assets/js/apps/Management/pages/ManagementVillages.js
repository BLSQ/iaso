import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

import LoadingSpinner from '../../../components/loading-spinner';
import CustomTableComponent from '../../../components/CustomTableComponent';
import { createUrl } from '../../../utils/fetchData';
import VillageModaleComponent from '../components/VillageModaleComponent';
import DeleteModaleComponent from '../components/DeleteModaleComponent';
import villagesTableColumns from '../constants/villagesTableColumns';
import { villageActions } from '../redux/villages';
import { filterActions } from '../../../redux/filtersRedux';

const newUser = {
    id: 0,
    name: '',
};

class ManagementVillages extends React.Component {
    constructor(props) {
        super(props);
        const { formatMessage } = props.intl;
        this.state = {
            tableColumns: villagesTableColumns(formatMessage, this),
            showEditModale: false,
            showDeleteModale: false,
            dataDeleted: undefined,
        };
    }

    componentWillMount() {
        this.props.fetchProvinces();
        this.props.fetchGeoProvinces();
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            showEditModale: nextProps.selectedVillage !== null,
        });
    }

    onChangeFilters(key, value) {
        this.props.redirectTo('villages', {
            ...this.props.params,
            [key]: value,
        });
    }

    getEndpointUrl() {
        let newEndPointUrl = '/api/villages/?as_list=true';
        const {
            params,
        } = this.props;
        const urlParams = {
            include_unlocated: params.include_unlocated ? params.include_unlocated : 'true',
            types: params.types ? params.types : 'all',
        };

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
            updateCurrentVillage,
            selectedVillage,
            isUpdated,
            load,
            selectVillage,
            geoProvinces,
        } = this.props;
        return (
            <section>
                {
                    this.state.showEditModale &&
                    <VillageModaleComponent
                        showModale={this.state.showEditModale}
                        closeModale={() => selectVillage(null)}
                        village={selectedVillage}
                        saveVillage={newVillage => this.saveData(newVillage)}
                        updateCurrentVillage={village => updateCurrentVillage(village)}
                        isUpdated={isUpdated}
                        error={load.error}
                        params={this.props.params}
                        geoProvinces={geoProvinces}
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
                                id="management.village.title"
                                defaultMessage="Villages"
                            />
                        </h2>

                    </div>
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
                    <section>
                        <CustomTableComponent
                            pageSize={50}
                            withBorder={false}
                            isSortable
                            showPagination
                            endPointUrl={this.getEndpointUrl()}
                            columns={this.state.tableColumns}
                            defaultSorted={[{ id: 'name', desc: false }]}
                            params={this.props.params}
                            defaultPath="villages"
                            dataKey="villages"
                            onDataLoaded={villages => (this.props.setVillages(villages))}
                            onDataUpdated={isDataUpdated => (this.props.villageUpdated(isDataUpdated))}
                            isUpdated={isUpdated}
                        />
                        <div className="widget__content align-right border-top">
                            <button
                                className="button--add"
                                onClick={() => this.props.selectVillage(newUser)}
                            >
                                <i className="fa fa-plus" />
                                <FormattedMessage id="main.label.new" defaultMessage="Nouveau" />
                            </button>
                        </div>
                    </section>
                </div>
            </section>);
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
    updateCurrentVillage: PropTypes.func.isRequired,
    selectVillage: PropTypes.func.isRequired,
    isUpdated: PropTypes.bool.isRequired,
    selectedVillage: PropTypes.object,
    fetchProvinces: PropTypes.func.isRequired,
    fetchGeoProvinces: PropTypes.func.isRequired,
    geoFilters: PropTypes.object.isRequired,
    geoProvinces: PropTypes.object.isRequired,
};

const ManagementVillagesIntl = injectIntl(ManagementVillages);

const MapStateToProps = state => ({
    load: state.load,
    isUpdated: state.villages.isUpdated,
    selectedVillage: state.villages.current,
    geoFilters: state.geoFilters,
    geoProvinces: state.villages.geoProvinces,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    setVillages: villages => dispatch(villageActions.setVillages(villages)),
    villageUpdated: isUpdated => dispatch(villageActions.villageUpdated(isUpdated)),
    updateCurrentVillage: villageId => dispatch(villageActions.updateCurrentVillage(villageId)),
    selectVillage: village => dispatch(villageActions.selectVillage(village)),
    fetchProvinces: () => dispatch(filterActions.fetchProvinces(dispatch)),
    fetchGeoProvinces: () => dispatch(villageActions.fetchGeoProvinces(dispatch)),
});

export default connect(MapStateToProps, MapDispatchToProps)(ManagementVillagesIntl);
