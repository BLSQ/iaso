/*
 * This component displays the coordinations list and teams list.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import Select from 'react-select';
import { clone, getPossibleYears } from '../../../utils';


const MESSAGES = defineMessages({
    all: {
        defaultMessage: 'Toutes',
        id: 'microplanning.all',
    },
    allMale: {
        defaultMessage: 'Tous',
        id: 'microplanning.allMale',
    },
    'years-select': {
        defaultMessage: 'Toutes les années',
        id: 'macroplanning.labels.years.select',
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
            coordinations: nextProps.coordinations,
        });
    }

    onChangePlanning(planningId) {
        const tempParams = clone(this.props.params);
        delete tempParams.team_id;
        delete tempParams.coordination_id;
        this.props.redirect({
            ...tempParams,
            planning_id: planningId,
        });
    }

    render() {
        const {
            intl: {
                formatMessage,
            },
            params: {
                planning_id,
            },
            displayYearsSelect,
        } = this.props;
        const possibleYears = getPossibleYears();
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
                        planning_id &&
                        this.state.currentPlanning &&
                        this.state.teams.length > 0 &&
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
                    <div>
                        {
                            planning_id &&
                            this.state.currentPlanning &&
                            this.state.coordinations.length > 0 &&
                            <section>
                                <FormattedMessage id="microplanning.label.coordinations" defaultMessage="Coordination" />
                                <Select
                                    simpleValue
                                    name="coordination_id"
                                    value={parseInt(this.props.params.coordination_id, 10)}
                                    placeholder={formatMessage(MESSAGES.all)}
                                    options={this.state.coordinations.map(c =>
                                        ({ label: c.name, value: c.id }))}
                                    onChange={event =>
                                        this.props.redirect({
                                            ...this.props.params, coordination_id: event,
                                        })}
                                />
                            </section>
                        }
                    </div>
                    {
                        displayYearsSelect &&
                        <div>
                            <FormattedMessage id="microplanning.label.years" defaultMessage="Années" />
                            <Select
                                multi
                                clearable={false}
                                simpleValue
                                autosize={false}
                                name="years"
                                className={this.props.params.years.split(',').length === 1 ? 'only-one' : ''}
                                value={this.props.params.years || ''}
                                placeholder={formatMessage(MESSAGES['years-select'])}
                                options={possibleYears.map(year =>
                                    ({ label: year, value: year }))}
                                onChange={(yearsList) => {
                                    this.props.redirect({
                                        ...this.props.params, years: yearsList,
                                    });
                                }}
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
    coordinations: [],
    displayYearsSelect: false,
};
PlanningTeamSelection.propTypes = {
    intl: PropTypes.object.isRequired,
    params: PropTypes.object,
    plannings: PropTypes.arrayOf(PropTypes.object),
    teams: PropTypes.arrayOf(PropTypes.object),
    coordinations: PropTypes.arrayOf(PropTypes.object),
    redirect: PropTypes.func.isRequired,
    displayYearsSelect: PropTypes.bool,
};

export default injectIntl(PlanningTeamSelection);
