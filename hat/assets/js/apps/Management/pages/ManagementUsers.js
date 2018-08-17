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
                    Cell: (settings) => {
                        let newInstitutionName = '';
                        if (settings.original.institution) {
                            if (parseInt(settings.original.institution[0], 10)) {
                                [, newInstitutionName] = settings.original.institution;
                            } else {
                                [newInstitutionName] = settings.original.institution;
                            }
                        }
                        return (<span>{newInstitutionName}</span>);
                    },
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
                                onClick={() => this.editData(settings.original)}
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
            dataEdited: undefined,
            dataDeleted: undefined,
        };
    }

    componentWillReceiveProps() {
        this.setState({
            tableUrl: baseApiUrl,
        });
    }

    onChangeFilters(key, value) {
        this.props.redirectTo('users', {
            ...this.props.params,
            [key]: value,
        });
    }

    editData(data) {
        this.setState({
            showEditModale: true,
            dataEdited: data,
        });
    }

    showDelete(data) {
        this.setState({
            showDeleteModale: true,
            dataDeleted: data,
        });
    }

    toggleEditModale() {
        this.setState({
            showEditModale: !this.state.showEditModale,
            dataEdited:
                !this.state.showEditModale ? this.state.dataEdited : undefined,
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
        this.setState({
            showEditModale: false,
            dataEdited: undefined,
        });
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
            institutions, provinces, zones, areas, selectProvince, selectZone,
        } = this.props;
        return (
            <section>
                {
                    this.state.showEditModale &&
                    <UserModaleComponent
                        showModale={this.state.showEditModale}
                        toggleModal={() => this.toggleEditModale()}
                        user={this.state.dataEdited}
                        saveData={newData => this.saveData(newData)}
                        institutions={institutions}
                        provinces={provinces}
                        zones={zones}
                        areas={areas}
                        selectProvince={provinceId => selectProvince(provinceId)}
                        selectZone={zoneId => selectZone(zoneId)}
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
                            onDataUpdated={() => (this.props.userUpdated())}
                            isUpdated={this.props.isUpdated}
                        />
                        <div className="widget__content align-right border-top">
                            <button
                                className="button--add"
                                onClick={() => this.editData()}
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
    provinces: PropTypes.array.isRequired,
    zones: PropTypes.array.isRequired,
    areas: PropTypes.array.isRequired,
    selectProvince: PropTypes.func.isRequired,
    selectZone: PropTypes.func.isRequired,
};

const ManagementUsersIntl = injectIntl(ManagementUsers);

const MapStateToProps = state => ({
    load: state.load,
    users: state.users.list,
    institutions: state.users.institutions,
    provinces: state.users.provinces,
    zones: state.users.zones,
    areas: state.users.areas,
    isUpdated: state.users.isUpdated,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    setUsers: users => dispatch(userActions.setUsers(users)),
    userUpdated: () => dispatch(userActions.userUpdated()),
    selectProvince: provinceId => dispatch(userActions.selectProvince(provinceId, dispatch)),
    selectZone: zoneId => dispatch(userActions.selectZone(zoneId, dispatch)),
});

export default connect(MapStateToProps, MapDispatchToProps)(ManagementUsersIntl);
