/*
 * This component displays the coordinations list and teams list.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import Select from 'react-select';
import { clone } from '../../../utils';


const MESSAGES = defineMessages({
    all: {
        defaultMessage: 'Toutes',
        id: 'microplanning.all',
    },
    allMale: {
        defaultMessage: 'Tous',
        id: 'microplanning.allMale',
    },
});

class TeamSelectionTool extends Component {
    constructor(props) {
        super(props);
        this.state = {
            plannings: props.plannings,
        };
    }

    componentWillReceiveProps(nextProps) {
        let currentPlanning = null;
        nextProps.plannings.map((p) => {
            if (p.id === parseInt(nextProps.params.planning_id, 10)) {
                currentPlanning = p;
            }
            return true;
        });
        this.setState({
            currentPlanning,
            workzones: nextProps.workzones,
            coordinations: nextProps.coordinations,
            plannings: nextProps.plannings,
            teams: nextProps.teams,
        });
    }
    onChangeWorkZone(workzoneId) {
        const tempParams = clone(this.props.params);
        delete tempParams.team_id;
        delete tempParams.zs_id;
        this.props.deselectAll();
        this.props.redirect({
            ...tempParams,
            workzone_id: workzoneId,
        });
    }
    onChangeCoordination(coordinationId) {
        const tempParams = clone(this.props.params);
        delete tempParams.team_id;
        delete tempParams.zs_id;
        this.props.deselectAll();
        this.props.redirect({
            ...tempParams,
            coordination_id: coordinationId,
        });
    }

    onChangePlanning(planningId) {
        const tempParams = clone(this.props.params);
        delete tempParams.coordination_id;
        delete tempParams.team_id;
        delete tempParams.zs_id;
        this.props.deselectAll();
        this.props.redirect({
            ...tempParams,
            planning_id: planningId,
        });
    }

    render() {
        const { formatMessage } = this.props.intl;
        let totalCapacity = 0;
        if (this.state.teams && this.state.teams.length > 0) {
            this.state.teams.map((team) => {
                totalCapacity += team.capacity;
                return true;
            });
        }
        return (
            <section>
                <div className="widget__container full">
                    <div className="widget__content--tier">
                        <div>
                            <FormattedMessage id="microplanning.label.planning" defaultMessage="Planning: " />
                            {
                                this.state.plannings.length > 0 &&
                                <Select
                                    simpleValue
                                    name="planning_id"
                                    value={parseInt(this.props.params.planning_id, 10)}
                                    placeholder={formatMessage(MESSAGES.allMale)}
                                    options={this.state.plannings.map(planning =>
                                        ({ label: planning.name, value: planning.id }))}
                                    onChange={event => this.onChangePlanning(event)}
                                />

                            }
                        </div>
                    </div>
                </div>
                {
                    this.props.params.planning_id && this.state.currentPlanning &&
                    <div className="widget__container full">
                        <div className="widget__header">
                            <h2 className="widget__heading">
                                <FormattedMessage id="microplanning.label.plannings" defaultMessage="Planning: " />
                                {this.state.currentPlanning.name}
                                {` (${this.state.currentPlanning.year})`}
                            </h2>
                        </div>
                        <div className="widget__content--tier">
                            <div>
                                <FormattedMessage id="microplanning.label.coordination" defaultMessage="Coordination: " />
                                <Select
                                    simpleValue
                                    name="coordination_id"
                                    value={parseInt(this.props.params.coordination_id, 10)}
                                    placeholder={formatMessage(MESSAGES.all)}
                                    options={this.state.coordinations.map(coordination =>
                                        ({ label: coordination.name, value: coordination.id }))}
                                    onChange={event => this.onChangeCoordination(event)}
                                />
                            </div>
                            <div>
                                <FormattedMessage id="microplanning.label.workzone" defaultMessage="Champs de travail" />

                                <Select
                                    disabled={!this.props.params.coordination_id}
                                    simpleValue
                                    name="workzone_id"
                                    value={parseInt(this.props.params.workzone_id, 10)}
                                    placeholder="Champs de travail"
                                    options={this.state.workzones.map(wz => ({ label: `${wz.name}`, value: wz.id }))}
                                    onChange={event => this.onChangeWorkZone(event)}
                                />
                            </div>
                            <div>
                                <FormattedMessage id="microplanning.label.team" defaultMessage="Unité" />

                                <Select
                                    disabled={!this.props.params.workzone_id}
                                    simpleValue
                                    name="team_id"
                                    value={parseInt(this.props.params.team_id, 10)}
                                    placeholder={`${formatMessage(MESSAGES.all)} - ${totalCapacity}`}
                                    options={this.state.teams.map(team => ({ label: `${team.name} - ${team.capacity}`, value: team.id }))}
                                    onChange={event =>
                                        this.props.redirect({
                                            ...this.props.params, team_id: event,
                                        })}
                                />
                            </div>
                        </div>
                    </div>
                }
            </section>
        );
    }
}
TeamSelectionTool.defaultProps = {
    params: null,
    plannings: [],
    coordinations: [],
    workzones: [],
    teams: [],
};
TeamSelectionTool.propTypes = {
    intl: PropTypes.object.isRequired,
    params: PropTypes.object,
    plannings: PropTypes.arrayOf(PropTypes.object),
    coordinations: PropTypes.arrayOf(PropTypes.object),
    teams: PropTypes.arrayOf(PropTypes.object),
    workzones: PropTypes.arrayOf(PropTypes.object),
    redirect: PropTypes.func.isRequired,
    deselectAll: PropTypes.func.isRequired,
};

export default injectIntl(TeamSelectionTool);
