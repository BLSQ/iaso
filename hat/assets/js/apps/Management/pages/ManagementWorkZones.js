import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import Select from 'react-select';

import LoadingSpinner from '../../../components/loading-spinner';
import CustomTableComponent from '../../../components/CustomTableComponent';
import { createUrl } from '../../../utils/fetchData';
import WokzoneModaleComponent from '../components/WokzoneModaleComponent';
import { loadActions } from '../../../redux/load';
import DeleteModaleComponent from '../components/DeleteModaleComponent';
import { saveFull, deleteFull } from '../../../utils/saveData';
import { formatThousand } from '../../../utils';
import { teamsActions } from '../redux/teams';
import { coordinationsActions } from '../redux/coordinations';
import { planningsActions } from '../redux/plannings';

const request = require('superagent');

const baseApiUrl = '/api/workzones/?';

function getBaseURL(props) {
    let url = baseApiUrl;
    console.log('props.params', props.params);
    if (props.params.planning_id) {
        url = `${url}planning_id=${props.params.planning_id}`;
    }
    return url;
}

class ManagementWorkZones extends React.Component {
    constructor(props) {
        super(props);
        const { formatMessage } = props.intl;
        this.state = {
            tableColumns: [
                {
                    Header: formatMessage({
                        defaultMessage: 'Nom',
                        id: 'main.label.name',
                    }),
                    accessor: 'name',
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Planning',
                        id: 'main.label.planning',
                    }),
                    width: 250,
                    accessor: 'planning_name',
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Coordination',
                        id: 'main.label.coordination',
                    }),
                    width: 250,
                    accessor: 'coordination_name',
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Equipes',
                        id: 'main.label.teams',
                    }),
                    sortable: false,
                    accessor: 'teams',
                    Cell: settings => (
                        <span>
                            {
                                settings.original.teams.map((team, index) => (index === 0 ? team.name : `, ${team.name}`))
                            }
                        </span>
                    ),
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Capacité totale',
                        id: 'main.label.total_capacity',
                    }),
                    width: 100,
                    resizable: false,
                    accessor: 'total_capacity',
                    sortable: false,
                    Cell: settings => (
                        <span>{formatThousand(settings.original.total_capacity)}</span>
                    ),
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'population',
                        id: 'main.label.total_population',
                    }),
                    width: 100,
                    resizable: false,
                    accessor: 'total_population',
                    sortable: false,
                    Cell: settings => (
                        <span>{formatThousand(settings.original.total_population)}</span>
                    ),
                },
                {
                    Header: formatMessage({
                        defaultMessage: 'Actions',
                        id: 'main.actions',
                    }),
                    width: 250,
                    sortable: false,
                    resizable: false,
                    Cell: settings => (
                        <section>
                            <button
                                className="button--tiny margin-right"
                                onClick={() => this.editWorkzone(settings.original)}
                            >
                                <i className="fa fa-pencil-square-o" />
                                <FormattedMessage id="main.label.edit" defaultMessage="Editer" />
                            </button>
                            <button
                                className="button--delete--tiny margin-right"
                                onClick={() => this.showDelete(settings.original)}
                            >
                                <i className="fa fa-trash" />
                                <FormattedMessage id="main.label.delete" defaultMessage="Effacer" />
                            </button>
                        </section>
                    ),
                },
            ],
            tableUrl: getBaseURL(props),
            showEditModale: false,
            showDeleteModale: false,
            workzoneEdited: undefined,
            workzoneDeleted: undefined,
            isUpdating: false,
        };
    }
    componentDidMount() {
        this.fetchTeams();
        this.fetchCoordinations();
        this.fetchPlannings();
    }

    componentWillReceiveProps(props) {
        this.setState({
            tableUrl: getBaseURL(props),
        });
    }

    onChangeFilters(key, value) {
        this.props.redirectTo('workzones', {
            ...this.props.params,
            [key]: value,
        });
    }

    fetchTeams() {
        const { dispatch } = this.props;
        dispatch(loadActions.startLoading());
        return request
            .get('/api/teams/')
            .then((result) => {
                dispatch(teamsActions.loadTeams(result.body));
                dispatch(loadActions.successLoadingNoData());
            })
            .catch((err) => {
                dispatch(loadActions.errorLoading(err));
                console.error('Error when fetching teams', err);
            });
    }

    fetchCoordinations() {
        const { dispatch } = this.props;
        dispatch(loadActions.startLoading());
        return request
            .get('/api/coordinations/')
            .then((result) => {
                dispatch(coordinationsActions.loadCoordinations(result.body));
                dispatch(loadActions.successLoadingNoData());
            })
            .catch((err) => {
                dispatch(loadActions.errorLoading(err));
                console.error('Error when fetching coordinations', err);
            });
    }

    fetchPlannings() {
        const { dispatch } = this.props;
        dispatch(loadActions.startLoading());
        return request
            .get('/api/plannings/')
            .then((result) => {
                dispatch(planningsActions.loadPlannings(result.body));
                dispatch(loadActions.successLoadingNoData());
            })
            .catch((err) => {
                dispatch(loadActions.errorLoading(err));
                console.error('Error when fetching plannings', err);
            });
    }

    editWorkzone(workzone) {
        this.setState({
            showEditModale: true,
            workzoneEdited: workzone,
        });
    }

    showDelete(workzone) {
        this.setState({
            showDeleteModale: true,
            workzoneDeleted: workzone,
        });
    }

    toggleEditModale() {
        this.setState({
            showEditModale: !this.state.showEditModale,
            workzoneEdited:
                !this.state.showEditModale ? this.state.workzoneEdited : undefined,
        });
    }

    toggleDeleteModale() {
        this.setState({
            showDeleteModale: !this.state.showDeleteModale,
            workzoneDeleted:
                !this.state.showDeleteModale ? this.state.workzoneDeleted : undefined,
        });
    }

    saveWorkzone(newWokzone) {
        this.setState({
            isUpdating: true,
        });
        saveFull(newWokzone, `/api/workzones/${newWokzone.id}/`).then((isSaved) => {
            if (isSaved) {
                this.setState({
                    isUpdating: false,
                    showEditModale: false,
                    workzoneEdited: undefined,
                });
            } else {
                console.error(`One error occured when trying to save workzone: ${newWokzone.name}`);
            }
        });
    }

    deleteWokzone(workzone) {
        this.setState({
            isUpdating: true,
        });
        deleteFull(`/api/workzones/${workzone.id}/`).then((isSaved) => {
            if (isSaved) {
                this.setState({
                    isUpdating: false,
                    showDeleteModale: false,
                    workzoneDeleted: undefined,
                });
            } else {
                console.error(`One error occured when trying to delete workzone: ${workzone.name}`);
            }
        });
    }

    render() {
        const { loading } = this.props.load;
        const { formatMessage } = this.props.intl;
        console.log('this.state.tableUrl', this.state.tableUrl);
        return (
            <section>
                <WokzoneModaleComponent
                    showModale={this.state.showEditModale}
                    toggleModal={() => this.toggleEditModale()}
                    workzone={this.state.workzoneEdited}
                    teams={this.props.teams}
                    coordinations={this.props.coordinations}
                    plannings={this.props.plannings}
                    saveWorkzone={newWokzone => this.saveWorkzone(newWokzone)}
                    isUpdating={this.state.isUpdating}
                />
                {
                    this.state.showDeleteModale &&
                    <DeleteModaleComponent
                        showModale={this.state.showDeleteModale}
                        toggleModal={() => this.toggleDeleteModale()}
                        element={this.state.workzoneDeleted}
                        deleteElement={workzone => this.deleteWokzone(workzone)}
                    />
                }
                <div className="widget__container management-control">
                    <div className="widget__header with-link">
                        <h2 className="widget__heading">
                            <FormattedMessage
                                id="management.workzone.title"
                                defaultMessage="Rayon d'actions"
                            />
                        </h2>
                    </div>
                    <div className="widget__content--quarter">
                        <div>
                            <div className="widget__label">
                                <FormattedMessage id="management.label.planning" defaultMessage="Planning" />
                            </div>

                            <Select
                                clearable
                                simpleValue
                                name="planning_id"
                                value={this.props.params.planning_id}
                                placeholder="--"
                                options={this.props.plannings.map(province =>
                                    ({ label: province.name, value: province.id }))}
                                onChange={(value) => {
                                    this.onChangeFilters('planning_id', value);
                                }}
                                noResultsText={<FormattedMessage id="locator.label.noresult" defaultMessage="Aucun planning" />}
                            />

                        </div>
                    </div>
                </div>
                <div className="widget__container management-control">
                    {
                        loading &&
                        <LoadingSpinner message={formatMessage({
                            defaultMessage: 'Chargement en cours',
                            id: 'microWokzone.labels.loading',
                        })}
                        />
                    }
                    <section>
                        {
                            !this.state.isUpdating &&
                            <CustomTableComponent
                                withBorder={false}
                                isSortable
                                showPagination
                                endPointUrl={this.state.tableUrl}
                                columns={this.state.tableColumns}
                                defaultSorted={[{ id: 'name', desc: false }]}
                                params={this.props.params}
                                defaultPath="workzones"
                            />
                        }
                        <div className="widget__content align-right border-top">
                            <button
                                className="button--add"
                                onClick={() => this.editWorkzone()}
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

ManagementWorkZones.defaultProps = {
    teams: [],
    coordinations: [],
    plannings: [],
};

ManagementWorkZones.propTypes = {
    params: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    teams: PropTypes.array,
    coordinations: PropTypes.array,
    plannings: PropTypes.array,
};

const ManagementWokzonesIntl = injectIntl(ManagementWorkZones);

const MapStateToProps = state => ({
    load: state.load,
    teams: state.teams.list,
    coordinations: state.coordinations.list,
    plannings: state.plannings.list,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});

export default connect(MapStateToProps, MapDispatchToProps)(ManagementWokzonesIntl);
