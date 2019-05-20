import React from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import moment from 'moment';

import LoadingSpinner from '../../../components/loading-spinner';
import CustomTableComponent from '../../../components/CustomTableComponent';
import { createUrl, getRequest } from '../../../utils/fetchData';
import TeamModaleComponent from '../components/TeamModaleComponent';
import DeleteModaleComponent from '../components/DeleteModaleComponent';
import { saveFull, deleteFull } from '../../../utils/saveData';
import { teamsActions } from '../redux/teams';
import { detailsActions } from '../redux/details';
import managementTeamsColumns from '../constants/managementTeamsColumns';
import FiltersComponent from '../../../components/FiltersComponent';
import { teamType, coordinations, screenTeamType } from '../../../utils/constants/filters';

const baseUrl = 'teams';

class ManagementTeams extends React.Component {
    constructor(props) {
        super(props);
        const { formatMessage } = props.intl;
        this.state = {
            tableColumns: managementTeamsColumns(formatMessage, this),
            coordinations: props.coordinations,
            showEditModale: false,
            showDeleteModale: false,
            teamEdited: undefined,
            teamDeleted: undefined,
            isUpdating: false,
        };
    }

    componentDidMount() {
        this.fetchCoordinations();
    }

    componentWillReceiveProps(newProps) {
        this.setState({
            coordinations: newProps.coordinations,
        });
    }

    getEndpointUrl() {
        let url = '/api/teams/?';
        const {
            params,
        } = this.props;

        const urlParams = {
            ...params,
        };

        if (!urlParams.team_type) {
            url += 'team_type=all';
        }

        Object.keys(urlParams).forEach((key) => {
            const value = urlParams[key];
            if (value && !url.includes(key)) {
                url += `&${key}=${value}`;
            }
        });
        return url;
    }


    fetchCoordinations() {
        const { dispatch } = this.props;
        getRequest('/api/coordinations/', dispatch).then((coordinations) => {
            dispatch(teamsActions.loadCoordinations(coordinations));
        });
    }

    editTeam(team) {
        this.setState({
            showEditModale: true,
            teamEdited: team,
        });
    }

    showDelete(team) {
        this.setState({
            showDeleteModale: true,
            teamDeleted: team,
        });
    }

    toggleEditModale() {
        this.setState({
            showEditModale: !this.state.showEditModale,
            teamEdited: !this.state.showEditModale ? this.state.teamEdited : undefined,
        });
    }

    toggleDeleteModale() {
        this.setState({
            showDeleteModale: !this.state.showDeleteModale,
            teamDeleted: !this.state.showDeleteModale ? this.state.teamDeleted : undefined,
        });
    }

    saveTeam(team) {
        this.setState({
            isUpdating: true,
        });
        saveFull(team, `/api/teams/${team.id}/`).then((isSaved) => {
            if (isSaved) {
                this.setState({
                    isUpdating: false,
                    showEditModale: false,
                    teamEdited: undefined,
                });
            } else {
                console.error(`One error occured when trying to save team: ${team.name}`);
            }
        });
    }

    deleteTeam(team) {
        this.setState({
            isUpdating: true,
        });
        deleteFull(`/api/teams/${team.id}/`).then((isSaved) => {
            if (isSaved) {
                this.setState({
                    isUpdating: false,
                    showDeleteModale: false,
                    teamDeleted: undefined,
                });
            } else {
                console.error(`One error occured when trying to delete team: ${team.name}`);
            }
        });
    }

    selectTeam(team) {
        const { dispatch } = this.props;
        const from = moment().startOf('year').format('YYYY-MM-DD');
        const to = moment().format('YYYY-MM-DD');
        dispatch(detailsActions.loadCurrentDetail(team));
        const { order, coordination_id, type } = this.props.params;
        const tempParams = this.props.params;
        delete tempParams.order;
        this.props.redirectTo('detail', {
            ...tempParams,
            teamOrder: order,
            teamId: team.id,
            from,
            to,
            coordination_id,
            type,
        });
    }

    render() {
        const {
            intl: {
                formatMessage,
            },
            load: {
                loading,
            },
            params,
        } = this.props;

        return (
            <section>
                {
                    this.state.coordinations &&
                    <TeamModaleComponent
                        showModale={this.state.showEditModale}
                        toggleModal={() => this.toggleEditModale()}
                        team={this.state.teamEdited}
                        coordinations={this.state.coordinations}
                        saveTeam={team => this.saveTeam(team)}
                        isUpdating={this.state.isUpdating}
                    />
                }
                {
                    this.state.showDeleteModale &&
                    <DeleteModaleComponent
                        showModale={this.state.showDeleteModale}
                        toggleModal={() => this.toggleDeleteModale()}
                        element={this.state.teamDeleted}
                        deleteElement={team => this.deleteTeam(team)}
                    />
                }
                <div className="widget__container management-control">
                    <div className="widget__header">
                        <h2 className="widget__heading">
                            <FormattedMessage
                                id="management.teams.title"
                                defaultMessage="Equipes"
                            />
                        </h2>

                    </div>
                    <div className="widget__content--tier">
                        <div>
                            <FiltersComponent
                                params={params}
                                baseUrl={baseUrl}
                                filters={[
                                    coordinations(this.state.coordinations, false),
                                ]}
                            />
                        </div>
                        <div>
                            <FiltersComponent
                                params={params}
                                baseUrl={baseUrl}
                                filters={[
                                    screenTeamType(),
                                ]}
                            />
                        </div>
                        <div>
                            <FiltersComponent
                                params={params}
                                baseUrl={baseUrl}
                                filters={[
                                    teamType(formatMessage, defineMessages),
                                ]}
                            />
                        </div>
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
                        {
                            !this.state.isUpdating &&
                            <CustomTableComponent
                                withBorder={false}
                                multiSort
                                isSortable
                                showPagination
                                endPointUrl={this.getEndpointUrl()}
                                columns={this.state.tableColumns}
                                defaultSorted={[{ id: 'name', desc: false }]}
                                params={this.props.params}
                                defaultPath="teams"
                                canSelect={false}
                            />
                        }
                        <div className="widget__content align-right border-top">
                            <button
                                className="button--add"
                                onClick={() => this.editTeam()}
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

ManagementTeams.defaultProps = {
};

ManagementTeams.propTypes = {
    params: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    coordinations: PropTypes.array.isRequired,
};

const ManagementTeamsIntl = injectIntl(ManagementTeams);

const MapStateToProps = state => ({
    load: state.load,
    coordinations: state.teams.coordinations,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});

export default connect(MapStateToProps, MapDispatchToProps)(ManagementTeamsIntl);
