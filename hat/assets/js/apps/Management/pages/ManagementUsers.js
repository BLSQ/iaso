import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

import LoadingSpinner from '../../../components/loading-spinner';
import CustomTableComponent from '../../../components/CustomTableComponent';
import { createUrl } from '../../../utils/fetchData';
import UserModaleComponent from '../components/UserModaleComponent';
import DeleteModaleComponent from '../components/DeleteModaleComponent';
import { userActions } from '../redux/users';

const baseApiUrl = '/api/profiles/?';


class ManagementUsers extends React.Component {
    constructor(props) {
        super(props);
        const { formatMessage } = props.intl;

        const { dispatch } = props;
        dispatch(userActions.fetchInstitutions(dispatch));
        dispatch(userActions.fetchProvinces(dispatch));
        dispatch(userActions.fetchPermissions(dispatch));
        this.state = {
            tableColumns: [
                {
                    Header: 'ID',
                    accessor: 'id',
                },
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
                        defaultMessage: 'Téléphone',
                        id: 'main.label.phone',
                    }),
                    accessor: 'phone',
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Email',
                        id: 'main.label.email',
                    }),
                    accessor: 'email',
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Institution',
                        id: 'main.label.institution',
                    }),
                    accessor: 'institution',
                    Cell: settings => (<span>{settings.original.institution ? settings.original.institution.name : ''}</span>),
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Actions',
                        id: 'main.actions',
                    }),
                    width: 270,
                    sortable: false,
                    resizable: false,
                    Cell: settings => (
                        <section>
                            <button
                                className="button--edit"
                                onClick={() => this.props.selectUser(settings.original)}
                            >
                                <i className="fa fa-pencil-square-o" />
                                <FormattedMessage id="main.label.edit" defaultMessage="Editer" />
                            </button>
                            <button
                                className="button--delete"
                                onClick={() => this.showDelete(settings.original)}
                            >
                                <i className="fa fa-trash" />
                                <FormattedMessage id="main.label.delete" defaultMessage="Effacer" />
                            </button>
                        </section>
                    ),
                },
            ],
            tableUrl: baseApiUrl,
            showEditModale: false,
            showDeleteModale: false,
            dataDeleted: undefined,
        };
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            tableUrl: baseApiUrl,
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
            permissions,
            provinces,
            zones,
            areas,
            selectProvince,
            selectZone,
            updateCurrentUser,
            selectedUser,
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
                        permissions={permissions}
                        provinces={provinces}
                        zones={zones}
                        areas={areas}
                        selectProvince={(provinceId, zoneId) => selectProvince(provinceId, zoneId)}
                        selectZone={zoneId => selectZone(zoneId)}
                        updateCurrentUser={user => updateCurrentUser(user)}
                        deleteUserZones
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
    users: PropTypes.array.isRequired,
    institutions: PropTypes.array.isRequired,
    permissions: PropTypes.array.isRequired,
    provinces: PropTypes.array.isRequired,
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
    users: state.users.list,
    institutions: state.users.institutions,
    permissions: state.users.permissions,
    provinces: state.users.provinces,
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
