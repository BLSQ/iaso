import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import Select from 'react-select';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';

import LoadingSpinner from '../../../components/loading-spinner';
import CustomTableComponent from '../../../components/CustomTableComponent';
import { createUrl } from '../../../utils/fetchData';
import UserModaleComponent from '../components/UserModaleComponent';
import DeleteModaleComponent from '../components/DeleteModaleComponent';
import { userActions } from '../redux/users';
import Search from '../../../components/Search';

const baseApiUrl = '/api/profiles/?';


const MESSAGES = defineMessages({
    searchPlaceholder: {
        defaultMessage: 'Recherche',
        id: 'listlocator.search.placeholder',
    },
    none: {
        defaultMessage: 'Aucune',
        id: 'management.none',
    },
});
class ManagementUsers extends React.Component {
    constructor(props) {
        super(props);
        const { formatMessage } = props.intl;

        const { dispatch } = props;
        dispatch(userActions.fetchInstitutions(dispatch));
        dispatch(userActions.fetchProvinces(dispatch));
        dispatch(userActions.fetchTeams(dispatch));
        dispatch(userActions.fetchPermissions(dispatch));
        dispatch(userActions.fetchUserTypes(dispatch));
        dispatch(userActions.fetchTesterTypes(dispatch));
        let tableUrl = baseApiUrl;
        if (props.params.search) {
            tableUrl += `search=${props.params.search}`;
        }
        if (props.params.institutionId) {
            tableUrl += `&institutionId=${props.params.institutionId}`;
        }
        this.state = {
            tableColumns: [
                {
                    Header: formatMessage({
                        defaultMessage: 'Nom d\'utilisateur',
                        id: 'main.label.userName',
                    }),
                    accessor: 'userName',
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Prénom',
                        id: 'main.label.firstName',
                    }),
                    accessor: 'firstName',
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Nom',
                        id: 'main.label.lastName',
                    }),
                    accessor: 'lastName',
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Institution',
                        id: 'main.label.institution',
                    }),
                    width: 150,
                    accessor: 'institution',
                    Cell: settings => (<span>{settings.original.institution ? settings.original.institution.name : ''}</span>),
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Actions',
                        id: 'main.actions',
                    }),
                    width: 180,
                    sortable: false,
                    resizable: false,
                    Cell: settings => (
                        <section>
                            <button
                                className="button--edit--tiny margin-right"
                                onClick={() => this.props.selectUser(settings.original)}
                            >
                                <i className="fa fa-pencil-square-o" />
                                <FormattedMessage id="main.label.edit" defaultMessage="Editer" />
                            </button>
                            <button
                                className="button--delete--tiny"
                                onClick={() => this.showDelete(settings.original)}
                            >
                                <i className="fa fa-trash" />
                                <FormattedMessage id="main.label.delete" defaultMessage="Effacer" />
                            </button>
                        </section>
                    ),
                },
            ],
            tableUrl,
            showEditModale: false,
            showDeleteModale: false,
            dataDeleted: undefined,
        };
    }

    componentWillReceiveProps(nextProps) {
        let tableUrl = baseApiUrl;
        if (nextProps.params.search) {
            tableUrl += `search=${nextProps.params.search}`;
        }
        if (nextProps.params.institutionId) {
            tableUrl += `&institutionId=${nextProps.params.institutionId}`;
        }
        this.setState({
            tableUrl,
            showEditModale: nextProps.selectedUser !== null,
        });
    }

    onChangeFilters(key, value) {
        this.props.redirectTo('users', {
            ...this.props.params,
            [key]: value,
        });
    }

    showDelete(data) {
        this.setState({
            showDeleteModale: true,
            dataDeleted: data,
        });
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
            dispatch(userActions.createUser(dispatch, newData));
        } else {
            dispatch(userActions.updateUser(dispatch, newData));
        }
    }

    deleteData(element) {
        const { dispatch } = this.props;
        this.setState({
            showDeleteModale: false,
            dataDeleted: undefined,
        });
        dispatch(userActions.deleteUser(dispatch, element));
    }

    render() {
        const { loading } = this.props.load;
        const { formatMessage } = this.props.intl;
        const {
            institutions,
            userTypes,
            testerTypes,
            permissions,
            provinces,
            zones,
            areas,
            selectProvince,
            selectZone,
            updateCurrentUser,
            selectedUser,
            teams,
            load,
        } = this.props;

        return (
            <section>
                {
                    this.state.showEditModale &&
                    <UserModaleComponent
                        showModale={this.state.showEditModale}
                        closeModal={() => this.props.selectUser(null)}
                        user={selectedUser}
                        saveData={newData => this.saveData(newData)}
                        institutions={institutions}
                        userTypes={userTypes}
                        testerTypes={testerTypes}
                        permissions={permissions}
                        provinces={provinces}
                        zones={zones}
                        areas={areas}
                        teams={teams}
                        selectProvince={(provinceId, zoneId) => selectProvince(provinceId, zoneId)}
                        selectZone={zoneId => selectZone(zoneId)}
                        updateCurrentUser={user => updateCurrentUser(user)}
                        deleteUserZones
                        isUpdated={this.props.isUpdated}
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
                        message={this.state.dataDeleted.userName}
                    />
                }
                <div className="widget__container management-control">
                    <div className="widget__header">
                        <h2 className="widget__heading">
                            <FormattedMessage
                                id="management.users.title"
                                defaultMessage="Utilisateurs"
                            />
                        </h2>

                    </div>
                </div>
                <div className="widget__container management-control">
                    <div className="widget__content--tier">
                        <div>
                            <span className="map__text--select">
                                <FormattedMessage
                                    id="locator.list.textualsearch.label"
                                    defaultMessage="Recherche textuelle"
                                />
                            </span>
                            <Search
                                placeholderText={formatMessage(MESSAGES.searchPlaceholder)}
                                allowEmptySearch
                                onSearch={value => this.onChangeFilters('search', value)}
                                resetSearch={() => this.onChangeFilters('search', null)}
                                displayResults={false}
                                searchString={this.props.params.search}
                            />
                        </div>
                        <div>
                            <span className="map__text--select">
                                <FormattedMessage
                                    id="main.label.institution"
                                    defaultMessage="Institution"
                                />
                            </span>
                            <Select
                                simpleValue
                                name="institution_id"
                                value={this.props.params.institutionId}
                                placeholder={formatMessage(MESSAGES.none)}
                                options={institutions.map(institution =>
                                    ({ label: institution.name, value: institution.id }))}
                                onChange={institutionId => this.onChangeFilters('institutionId', institutionId)}
                            />
                        </div>
                    </div>
                </div>
                <div className="widget__container management-control">
                    {
                        loading &&
                        <LoadingSpinner message={formatMessage({
                            defaultMessage: 'Chargement en cours',
                            id: 'main.labels.loading',
                        })}
                        />
                    }
                    <section>
                        <CustomTableComponent
                            pageSize={50}
                            withBorder={false}
                            isSortable
                            showPagination
                            endPointUrl={this.state.tableUrl}
                            columns={this.state.tableColumns}
                            defaultSorted={[{ id: 'id', desc: false }]}
                            params={this.props.params}
                            defaultPath="users"
                            dataKey="users"
                            onDataLoaded={users => (this.props.setUsers(users))}
                            onDataUpdated={isUpdated => (this.props.userUpdated(isUpdated))}
                            isUpdated={this.props.isUpdated}
                        />
                        <div className="widget__content align-right border-top">
                            <button
                                className="button--add"
                                onClick={() => this.props.selectUser({
                                    id: 0,
                                    province: [],
                                    AS: [],
                                    ZS: [],
                                    permissions: [],
                                })}
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
ManagementUsers.defaultProps = {
    selectedUser: null,
};

ManagementUsers.propTypes = {
    params: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    setUsers: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    userUpdated: PropTypes.func.isRequired,
    isUpdated: PropTypes.bool.isRequired,
    institutions: PropTypes.array.isRequired,
    userTypes: PropTypes.array.isRequired,
    testerTypes: PropTypes.array.isRequired,
    permissions: PropTypes.array.isRequired,
    provinces: PropTypes.array.isRequired,
    teams: PropTypes.array.isRequired,
    zones: PropTypes.array.isRequired,
    areas: PropTypes.array.isRequired,
    selectProvince: PropTypes.func.isRequired,
    selectZone: PropTypes.func.isRequired,
    selectUser: PropTypes.func.isRequired,
    selectedUser: PropTypes.object,
    updateCurrentUser: PropTypes.func.isRequired,
};

const ManagementUsersIntl = injectIntl(ManagementUsers);

const MapStateToProps = state => ({
    load: state.load,
    institutions: state.users.institutions,
    userTypes: state.users.userTypes,
    testerTypes: state.users.testerTypes,
    permissions: state.users.permissions,
    provinces: state.users.provinces,
    teams: state.users.teams,
    zones: state.users.zones,
    areas: state.users.areas,
    isUpdated: state.users.isUpdated,
    selectedUser: state.users.current,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    setUsers: users => dispatch(userActions.setUsers(users)),
    userUpdated: isUpdated => dispatch(userActions.userUpdated(isUpdated)),
    selectProvince: (provinceId, zoneId) => dispatch(userActions.selectProvince(provinceId, dispatch, zoneId)),
    selectZone: zoneId => dispatch(userActions.selectZone(zoneId, dispatch)),
    updateCurrentUser: areaId => dispatch(userActions.updateCurrentUser(areaId)),
    selectUser: user => dispatch(userActions.selectUser(user)),
});

export default connect(MapStateToProps, MapDispatchToProps)(ManagementUsersIntl);
