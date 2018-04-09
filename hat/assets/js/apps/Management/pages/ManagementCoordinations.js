import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import moment from 'moment';

import LoadingSpinner from '../../../components/loading-spinner';
import CustomTableComponent from '../../../components/CustomTableComponent';
import { createUrl } from '../../../utils/fetchData';
import CoordinationModaleComponent from '../components/CoordinationModaleComponent';
import DeleteModaleComponent from '../components/DeleteModaleComponent';
import { saveFull, deleteFull } from '../../../utils/saveData';
import { loadActions } from '../../../redux/load';
import { coordinationsActions } from '../redux/coordinations';

const request = require('superagent');

const baseApiUrl = '/api/coordinations/?';


class ManagementCoordinations extends React.Component {
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
                        defaultMessage: 'Nom',
                        id: 'main.label.name',
                    }),
                    accessor: 'name',
                },
                {
                    Header: 'ZS',
                    accessor: 'zs',
                    Cell: settings => (
                        <span>
                            {
                                settings.original.zs.map((zs, index) => (index === 0 ? zs.name : `, ${zs.name}`))
                            }
                        </span>
                    ),
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Date de création',
                        id: 'main.label.creationDate',
                    }),
                    accessor: 'created_at',
                    Cell: settings => (
                        <span>{moment(settings.original.created_at).format('YYYY-MM-DD HH:mm')}</span>
                    ),
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Actions',
                        id: 'main.actions',
                    }),
                    sortable: false,
                    resizable: false,
                    Cell: settings => (
                        <section>
                            <button
                                className="button--edit"
                                onClick={() => this.editCoordination(settings.original)}
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
            coordinationEdited: undefined,
            coordinationDeleted: undefined,
            isUpdating: false,
        };
    }

    componentDidMount() {
        this.fetchLocations();
    }

    componentWillReceiveProps() {
        this.setState({
            tableUrl: baseApiUrl,
        });
    }

    onChangeFilters(key, value) {
        this.props.redirectTo('coordinations', {
            ...this.props.params,
            [key]: value,
        });
    }

    fetchLocations() {
        const { dispatch } = this.props;
        dispatch(loadActions.startLoading());
        return request
            .get('/api/zs/')
            .then((result) => {
                dispatch(coordinationsActions.loadLocations(result.body));
                dispatch(loadActions.successLoadingNoData());
            })
            .catch((err) => {
                dispatch(loadActions.errorLoading(err));
                console.error('Error when fetching locations', err);
            });
    }

    editCoordination(coordination) {
        this.setState({
            showEditModale: true,
            coordinationEdited: coordination,
        });
    }

    showDelete(coordination) {
        this.setState({
            showDeleteModale: true,
            coordinationDeleted: coordination,
        });
    }

    toggleEditModale() {
        this.setState({
            showEditModale: !this.state.showEditModale,
            coordinationEdited:
                !this.state.showEditModale ? this.state.coordinationEdited : undefined,
        });
    }

    toggleDeleteModale() {
        this.setState({
            showDeleteModale: !this.state.showDeleteModale,
            coordinationDeleted:
                !this.state.showDeleteModale ? this.state.coordinationDeleted : undefined,
        });
    }

    saveCoordination(newCoordination) {
        this.setState({
            isUpdating: true,
        });
        saveFull(newCoordination, `/api/coordinations/${newCoordination.id}/`).then((isSaved) => {
            if (isSaved) {
                this.setState({
                    isUpdating: false,
                    showEditModale: false,
                    coordinationEdited: undefined,
                });
            } else {
                console.error(`One error occured when trying to save coordination: ${newCoordination.name}`);
            }
        });
    }

    deleteCoordination(coordination) {
        this.setState({
            isUpdating: true,
        });
        deleteFull(`/api/coordinations/${coordination.id}/`).then((isSaved) => {
            if (isSaved) {
                this.setState({
                    isUpdating: false,
                    showDeleteModale: false,
                    coordinationDeleted: undefined,
                });
            } else {
                console.error(`One error occured when trying to delete coordination: ${coordination.name}`);
            }
        });
    }

    render() {
        const { loading } = this.props.load;
        const { formatMessage } = this.props.intl;
        return (
            <section>

                <CoordinationModaleComponent
                    showModale={this.state.showEditModale}
                    toggleModal={() => this.toggleEditModale()}
                    coordination={this.state.coordinationEdited}
                    locations={this.props.locations}
                    saveCoordination={newCoordination => this.saveCoordination(newCoordination)}
                />
                {
                    this.state.showDeleteModale &&
                    <DeleteModaleComponent
                        showModale={this.state.showDeleteModale}
                        toggleModal={() => this.toggleDeleteModale()}
                        element={this.state.coordinationDeleted}
                        deleteElement={coordination => this.deleteCoordination(coordination)}
                    />
                }
                <div className="widget__container management-control">
                    <div className="widget__header">
                        <h2 className="widget__heading">
                            <FormattedMessage
                                id="management.coord.title"
                                defaultMessage="Coordinations"
                            />
                        </h2>

                    </div>
                </div>
                <div className="widget__container management-control">
                    {
                        loading &&
                        <LoadingSpinner message={formatMessage({
                            defaultMessage: 'Chargement en cours',
                            id: 'microplanning.labels.loading',
                        })}
                        />
                    }
                    <section>
                        <div className="widget__content">
                            {
                                !this.state.isUpdating &&
                                <CustomTableComponent
                                    isSortable
                                    showPagination
                                    endPointUrl={this.state.tableUrl}
                                    columns={this.state.tableColumns}
                                    defaultSorted={[{ id: 'id', desc: false }]}
                                    params={this.props.params}
                                    defaultPath="coordinations"
                                />
                            }
                        </div>
                        <div className="widget__content align-right">
                            <button
                                className="button--add"
                                onClick={() => this.editCoordination()}
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

ManagementCoordinations.defaultProps = {
};

ManagementCoordinations.propTypes = {
    params: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    locations: PropTypes.array.isRequired,
};

const ManagementCoordinationsIntl = injectIntl(ManagementCoordinations);

const MapStateToProps = state => ({
    load: state.load,
    locations: state.coordinations.locations,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});

export default connect(MapStateToProps, MapDispatchToProps)(ManagementCoordinationsIntl);
