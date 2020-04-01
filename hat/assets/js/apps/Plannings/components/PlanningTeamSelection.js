/*
 * This component displays the coordinations list and teams list.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import Select from 'react-select';
import { clone, getPossibleYears } from '../../../utils';

const MESSAGES = defineMessages({
    all: {
        defaultMessage: 'All',
        id: 'main.label.all',
    },
    allMale: {
        defaultMessage: 'All',
        id: 'main.label.allMale',
    },
    'years-select': {
        defaultMessage: 'All years',
        id: 'macroplanning.labels.years.select',
    },
});

const PlanningTeamSelection = ({
    intl: {
        formatMessage,
    },
    displayYearsSelect,
    teams,
    coordinations,
    plannings,
    params,
    redirect,
}) => {
    const currentPlanning = plannings.find(p => p.id === parseInt(params.planning_id, 10));
    const possibleYears = getPossibleYears();

    const onChangePlanning = (planningId) => {
        const tempParams = clone(params);
        delete tempParams.team_id;
        delete tempParams.coordination_id;
        redirect({
            ...tempParams,
            planning_id: planningId,
        });
    };

    return (
        <section>
            <div className="widget__content--tier">
                <div>
                    <FormattedMessage id="microplanning.label.planning" defaultMessage="Planning: " />
                    {
                        plannings.length > 0
                        && (
                            <Select
                                simpleValue
                                name="planning_id"
                                value={parseInt(params.planning_id, 10)}
                                placeholder={formatMessage(MESSAGES.allMale)}
                                options={plannings.map(planning => ({ label: planning.name, value: planning.id }))}
                                onChange={event => onChangePlanning(event)}
                            />
                        )

                    }
                </div>
                {
                    params.planning_id
                    && currentPlanning
                    && teams.length > 0
                    && (
                        <div>
                            <FormattedMessage id="microplanning.label.team" defaultMessage="Team" />
                            <Select
                                simpleValue
                                name="team_id"
                                value={parseInt(params.team_id, 10)}
                                placeholder={formatMessage(MESSAGES.all)}
                                options={teams.map(team => ({ label: team.name, value: team.id }))}
                                onChange={event => redirect({
                                    ...params, team_id: event, month_id: 1,
                                })}
                            />
                        </div>
                    )
                }
                <div>
                    {
                        params.planning_id
                        && currentPlanning
                        && coordinations.length > 0
                        && (
                            <section>
                                <FormattedMessage id="main.label.coordination" defaultMessage="Coordination" />
                                <Select
                                    simpleValue
                                    name="coordination_id"
                                    value={parseInt(params.coordination_id, 10)}
                                    placeholder={formatMessage(MESSAGES.all)}
                                    options={coordinations.map(c => ({ label: c.name, value: c.id }))}
                                    onChange={event => redirect({
                                        ...params, coordination_id: event,
                                    })}
                                />
                            </section>
                        )
                    }
                </div>
                {
                    displayYearsSelect
                    && (
                        <div>
                            <FormattedMessage id="main.label.years" defaultMessage="Years" />
                            <Select
                                multi
                                clearable={false}
                                simpleValue
                                autosize={false}
                                name="years"
                                className={params.years.split(',').length === 1 ? 'only-one' : ''}
                                value={params.years || ''}
                                placeholder={formatMessage(MESSAGES['years-select'])}
                                options={possibleYears.map(year => ({ label: year, value: year }))}
                                onChange={(yearsList) => {
                                    redirect({
                                        ...params, years: yearsList,
                                    });
                                }}
                            />
                        </div>
                    )
                }
            </div>
        </section>
    );
};

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
