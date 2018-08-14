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
import { saveFull, deleteFull } from '../../../utils/saveData';

const baseApiUrl = '/api/profiles/?';


class ManagementUsers extends React.Component {
    constructor(props) {
        super(props);
        const { formatMessage } = props.intl;
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
            isUpdating: false,
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
        this.setState({
            isUpdating: true,
            showEditModale: false,
        });
        saveFull(newData, `/api/profiles/${newData.id}/`).then((isSaved) => {
            if (isSaved) {
                this.setState({
                    isUpdating: false,
                    showEditModale: false,
                    dataEdited: undefined,
                });
            } else {
                console.error(`One error occured when trying to save user: ${newData.name}`);
            }
        });
    }

    deleteData(element) {
        this.setState({
            isUpdating: true,
        });
        deleteFull(`/api/profiles/${element.id}/`).then((isSaved) => {
            if (isSaved) {
                this.setState({
                    isUpdating: false,
                    showDeleteModale: false,
                    dataDeleted: undefined,
                });
            } else {
                console.error(`One error occured when trying to delete user: ${element.name}`);
            }
        });
    }

    render() {
        const { loading } = this.props.load;
        const { formatMessage } = this.props.intl;
        return (
            <section>

                <UserModaleComponent
                    showModale={this.state.showEditModale}
                    toggleModal={() => this.toggleEditModale()}
                    user={this.state.dataEdited}
                    saveData={newData => this.saveData(newData)}
                />
                {
                    this.state.showDeleteModale &&
                    <DeleteModaleComponent
                        showModale={this.state.showDeleteModale}
                        toggleModal={() => this.toggleDeleteModale()}
                        element={this.state.dataDeleted}
                        deleteElement={element => this.deleteData(element)}
                        message={`${this.state.dataDeleted.firstName} ${this.state.dataDeleted.lastName}`}
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
                        {
                            !this.state.isUpdating &&
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
                            />
                        }
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

ManagementUsers.defaultProps = {
};

ManagementUsers.propTypes = {
    params: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
};

const ManagementUsersIntl = injectIntl(ManagementUsers);

const MapStateToProps = state => ({
    load: state.load,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});

export default connect(MapStateToProps, MapDispatchToProps)(ManagementUsersIntl);
