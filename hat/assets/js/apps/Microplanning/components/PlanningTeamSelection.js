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

class PlanningTeamSelection extends Component {
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
            plannings: nextProps.plannings,
            teams: nextProps.teams,
        });
    }

    onChangePlanning(planningId) {
        const tempParams = clone(this.props.params);
        delete tempParams.team_id;
        this.props.redirect({
            ...tempParams,
            planning_id: planningId,
        });
    }

    render() {
        const { formatMessage } = this.props.intl;
        return (
            <section>
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
                    {
                        this.props.params.planning_id && this.state.currentPlanning &&
                        <div>
                            <FormattedMessage id="microplanning.label.team" defaultMessage="Unité" />
                            <Select
                                simpleValue
                                name="team_id"
                                value={parseInt(this.props.params.team_id, 10)}
                                placeholder={formatMessage(MESSAGES.all)}
                                options={this.state.teams.map(team =>
                                    ({ label: team.name, value: team.id }))}
                                onChange={event =>
                                    this.props.redirect({
                                        ...this.props.params, team_id: event, month_id: 1,
                                    })}
                            />
                        </div>
                    }
                </div>
            </section>
        );
    }
}
PlanningTeamSelection.defaultProps = {
    params: null,
    plannings: [],
    teams: [],
};
PlanningTeamSelection.propTypes = {
    intl: PropTypes.object.isRequired,
    params: PropTypes.object,
    plannings: PropTypes.arrayOf(PropTypes.object),
    teams: PropTypes.arrayOf(PropTypes.object),
    redirect: PropTypes.func.isRequired,
};

export default injectIntl(PlanningTeamSelection);
