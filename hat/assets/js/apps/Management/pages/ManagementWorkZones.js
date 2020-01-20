import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import Select from 'react-select';

import LoadingSpinner from '../../../components/loading-spinner';
import CustomTableComponent from '../../../components/CustomTableComponent';
import { createUrl } from '../../../utils/fetchData';
import WorkzoneModaleComponent from '../components/WorkzoneModaleComponent';
import { loadActions } from '../../../redux/load';
import DeleteModaleComponent from '../../../components/DeleteModaleComponent';
import { saveFull, deleteFull } from '../../../utils/saveData';
import { formatThousand } from '../../../utils';
import { teamsActions } from '../redux/teams';
import { coordinationsActions } from '../redux/coordinations';
import { planningsActions } from '../redux/plannings';

const request = require('superagent');

const baseApiUrl = '/api/workzones/?';

function getBaseURL(props) {
    let url = baseApiUrl;
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
                        defaultMessage: 'Teams',
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
                        defaultMessage: 'Total capacity',
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
                        id: 'main.label.actions',
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
                                <FormattedMessage id="main.label.edit" defaultMessage="Edit" />
                            </button>
                            <button
                                className="button--delete--tiny margin-right"
                                onClick={() => this.showDelete(settings.original)}
                            >
                                <i className="fa fa-trash" />
                                <FormattedMessage id="main.label.delete" defaultMessage="Delete" />
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

    saveWorkzone(newWorkzone) {
        this.setState({
            isUpdating: true,
        });
        saveFull(newWorkzone, `/api/workzones/${newWorkzone.id}/`).then((isSaved) => {
            if (isSaved) {
                this.setState({
                    isUpdating: false,
                    showEditModale: false,
                    workzoneEdited: undefined,
                });
            } else {
                console.error(`One error occured when trying to save workzone: ${newWorkzone.name}`);
            }
        });
    }

    deleteWorkzone(workzone) {
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
        return (
            <section>
                <WorkzoneModaleComponent
                    showModale={this.state.showEditModale}
                    toggleModal={() => this.toggleEditModale()}
                    workzone={this.state.workzoneEdited}
                    teams={this.props.teams}
                    coordinations={this.props.coordinations}
                    plannings={this.props.plannings}
                    saveWorkzone={newWorkzone => this.saveWorkzone(newWorkzone)}
                    isUpdating={this.state.isUpdating}
                />
                {
                    this.state.showDeleteModale &&
                    <DeleteModaleComponent
                        showModale={this.state.showDeleteModale}
                        toggleModal={() => this.toggleDeleteModale()}
                        element={this.state.workzoneDeleted}
                        deleteElement={workzone => this.deleteWorkzone(workzone)}
                    />
                }
                <div className="widget__container management-control">
                    <div className="widget__header with-link">
                        <h2 className="widget__heading">
                            <FormattedMessage
                                id="management.workzone.title"
                                defaultMessage="Work zone"
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
                                noResultsText={<FormattedMessage id="locator.label.noresult" defaultMessage="No result" />}
                            />

                        </div>
                    </div>
                </div>
                <div className="widget__container management-control">
                    {
                        loading &&
                        <LoadingSpinner message={formatMessage({
                            defaultMessage: 'Loading',
                            id: 'main.label.loading',
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
                                canSelect={false}
                            />
                        }
                        <div className="widget__content align-right border-top">
                            <button
                                className="button--add"
                                onClick={() => this.editWorkzone()}
                            >
                                <i className="fa fa-plus" />
                                <FormattedMessage id="main.label.new" defaultMessage="New" />
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

const ManagementWorkzonesIntl = injectIntl(ManagementWorkZones);

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

export default connect(MapStateToProps, MapDispatchToProps)(ManagementWorkzonesIntl);
