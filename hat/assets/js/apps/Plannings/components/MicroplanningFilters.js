/*
 * This component displays the coordinations list and teams list.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import Select from 'react-select';

const MESSAGES = defineMessages({
    all: {
        defaultMessage: 'All',
        id: 'main.label.all',
    },
    allMale: {
        defaultMessage: 'All',
        id: 'main.label.allMale',
    },
});

class MicroplanningFilters extends Component {
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

    onChangeHandler(key, value) {
        const tempParams = {
            ...this.props.params,
            [key]: value,
        };
        if (key === 'planning_id') {
            delete tempParams.coordination_id;
            delete tempParams.workzone_id;
        }
        if (key === 'coordination_id') {
            delete tempParams.workzone_id;
        }
        delete tempParams.team_id;
        delete tempParams.zs_id;
        this.props.deselectAll();
        this.props.closeTooltip();
        this.props.redirect(tempParams);
    }

    render() {
        const {
            intl: {
                formatMessage,
            },
            params,
            redirect,
        } = this.props;
        const {
            teams,
            plannings,
            currentPlanning,
            coordinations,
            workzones,
        } = this.state;

        let totalCapacity = 0;
        if (teams && teams.length > 0) {
            teams.map((team) => {
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
                                plannings.length > 0
                                && (
                                    <Select
                                        simpleValue
                                        name="planning_id"
                                        value={parseInt(params.planning_id, 10)}
                                        placeholder={formatMessage(MESSAGES.allMale)}
                                        options={plannings.map(planning => ({ label: planning.name, value: planning.id }))}
                                        onChange={value => this.onChangeHandler('planning_id', value)}
                                    />
                                )

                            }
                        </div>
                    </div>
                </div>
                {
                    params.planning_id && currentPlanning
                    && (
                        <div className="widget__container full">
                            <div className="widget__header">
                                <h2 className="widget__heading">
                                    <FormattedMessage id="microplanning.label.plannings" defaultMessage="Planning: " />
                                    {currentPlanning.name}
                                    {` (${currentPlanning.year})`}
                                </h2>
                            </div>
                            <div className="widget__content--tier">
                                <div>
                                    <span>
                                        <FormattedMessage id="main.label.coordination" defaultMessage="Coordination" />
                                        {': '}
                                    </span>
                                    <Select
                                        simpleValue
                                        name="coordination_id"
                                        value={parseInt(params.coordination_id, 10)}
                                        placeholder={formatMessage(MESSAGES.all)}
                                        options={coordinations.map(coordination => ({ label: coordination.name, value: coordination.id }))}
                                        onChange={value => this.onChangeHandler('coordination_id', value)}
                                    />
                                </div>
                                <div>
                                    <span>
                                        <FormattedMessage id="main.label.workzone" defaultMessage="Work zone" />
                                        {': '}
                                    </span>

                                    <Select
                                        disabled={!params.coordination_id}
                                        simpleValue
                                        name="workzone_id"
                                        value={parseInt(params.workzone_id, 10)}
                                        placeholder={
                                            formatMessage(
                                                {
                                                    id: 'main.label.workzone',
                                                    defaultMessage: 'Work zone',
                                                },
                                            )
                                        }
                                        options={workzones.map(wz => ({ label: wz.name, value: wz.id }))}
                                        onChange={value => this.onChangeHandler('workzone_id', value)}
                                    />
                                </div>
                                <div>
                                    <FormattedMessage id="microplanning.label.team" defaultMessage="Team" />

                                    <Select
                                        disabled={!params.workzone_id}
                                        simpleValue
                                        name="team_id"
                                        value={parseInt(params.team_id, 10)}
                                        placeholder={`${formatMessage(MESSAGES.all)} - ${totalCapacity}`}
                                        options={teams.map(team => ({ label: `${team.name} - ${team.capacity}`, value: team.id }))}
                                        onChange={event => redirect({
                                            ...params,
                                            team_id: event,
                                        })}
                                    />
                                </div>
                            </div>
                        </div>
                    )
                }
            </section>
        );
    }
}
MicroplanningFilters.defaultProps = {
    params: null,
    plannings: [],
    coordinations: [],
    workzones: [],
    teams: [],
};
MicroplanningFilters.propTypes = {
    intl: PropTypes.object.isRequired,
    params: PropTypes.object,
    plannings: PropTypes.arrayOf(PropTypes.object),
    coordinations: PropTypes.arrayOf(PropTypes.object),
    teams: PropTypes.arrayOf(PropTypes.object),
    workzones: PropTypes.arrayOf(PropTypes.object),
    redirect: PropTypes.func.isRequired,
    deselectAll: PropTypes.func.isRequired,
    closeTooltip: PropTypes.func.isRequired,
};

export default injectIntl(MicroplanningFilters);
