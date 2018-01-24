/*
 * This component displays the coordinations list and teams list.
 */

import React, { Component, PropTypes } from 'react';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import { createUrl } from '../../../utils/fetchData';
import Select from 'react-select';
import { clone } from '../../../utils';


const MESSAGES = defineMessages({
    'all': {
        defaultMessage: 'Toutes',
        id: 'microplanning.all'
    }
})

class TeamSelectionTool extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    componentWillReceiveProps(nextProps) {
        let currentPlanning = null;
        nextProps.plannings.map(p => {
            if (p.id == nextProps.params.planning_id) {
                currentPlanning = p;
            }
        });
        this.setState({
            currentPlanning,
            coordinations: nextProps.coordinations,
            teams: nextProps.teams,
        })
    }

    onChangeCoordination(coordination_id) {
        let tempParams = clone(this.props.params);
        delete tempParams.team_id;
        delete tempParams.zs_id;
        this.props.deselectAll();
        this.props.redirect({
            ...tempParams,
            coordination_id
         });
    }

    render() {
        const { formatMessage } = this.props.intl;
        if (!this.props.params.planning_id || !this.state.currentPlanning) {
            return null;
        }
        var totalCapacity = 0;
        this.state.teams.map(team => {totalCapacity += team.capacity})
        return (
            <div className='widget__container'>
                <div className='widget__header'>
                    <h2 className='widget__heading'>
                        <FormattedMessage id='microplanning.label.plannings' defaultMessage='Planning: ' />
                        {this.state.currentPlanning.name}
                        {` (${this.state.currentPlanning.year})`}
                    </h2>
                </div>
                <div className="widget__content--tier">
                    <div>
                        <FormattedMessage id='microplanning.label.team' defaultMessage='Coordination: ' />
                        <Select
                            simpleValue
                            name='coordination_id'
                            value={this.props.params.coordination_id}
                            placeholder={formatMessage(MESSAGES['all'])}
                            options={this.state.coordinations.map(coordination => ({ label: coordination.name, value: coordination.id }))}
                            onChange={event => this.onChangeCoordination(event)}
                        />
                    </div>
                    <div>
                        <FormattedMessage id='microplanning.label.team' defaultMessage='Unité: ' />

                        <Select
                            disabled={!this.props.params.coordination_id}
                            simpleValue
                            name='team_id'
                            value={this.props.params.team_id}
                            placeholder={formatMessage(MESSAGES['all']) + ' - ' + totalCapacity}
                            options={this.state.teams.map(team => ({ label: team.name + ' - ' + team.capacity, value: team.id }))}
                            onChange={event => this.props.redirect({ ...this.props.params, team_id: event })}
                        />
                    </div>
                </div>
            </div>
        )
    }
}
TeamSelectionTool.defaultProps = {
    params: null,
    plannings: [],
    coordinations: [],
    teams: []
};
TeamSelectionTool.propTypes = {
    params: PropTypes.object,
    plannings: PropTypes.arrayOf(PropTypes.object),
    coordinations: PropTypes.arrayOf(PropTypes.object),
    teams: PropTypes.arrayOf(PropTypes.object),
    redirect: PropTypes.func.isRequired,
    deselectAll: PropTypes.func.isRequired
}

export default injectIntl(TeamSelectionTool)
