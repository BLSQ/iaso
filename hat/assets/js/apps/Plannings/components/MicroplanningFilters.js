/*
 * This component displays the coordinations list and teams list.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Grid from '@material-ui/core/Grid';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import Select from 'react-select';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { fetchVillages as fetchVillagesAction } from '../redux/villages';

import { getPossibleYears } from '../../../utils';

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
        defaultMessage: 'Select years',
        id: 'microplanning.labels.years.select',
    },
});

class MicroplanningFilters extends Component {
    constructor(props) {
        super(props);
        this.state = {
            plannings: props.plannings,
            searchDisabled: false,
        };
    }

    componentDidMount() {
        const {
            params,
        } = this.props;
        if (params.planning_id) {
            this.onSearch();
        }
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
        const {
            setCurrentTeam,
        } = this.props;
        this.setState({
            searchDisabled: false,
        });
        const tempParams = {
            ...this.props.params,
            [key]: value,
        };
        setCurrentTeam(null);
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

    onChangeTeam(teamId) {
        const {
            params,
            redirect,
        } = this.props;
        this.setState({
            searchDisabled: false,
        });
        redirect({
            ...params,
            team_id: teamId,
        });
    }

    onSearch() {
        const {
            fetchVillages,
            getAdditionalSelectData,
            setCurrentTeam,
        } = this.props;
        const tempParams = {
            ...this.props.params,
        };
        let url = '/api/villages/?';
        Object.keys(tempParams).forEach((key) => {
            const value = tempParams[key];
            if (value && !url.includes(key)) {
                url += `&${key}=${value}`;
            }
        });
        setCurrentTeam(tempParams.team_id);
        fetchVillages(url);
        getAdditionalSelectData();
        this.setState({
            searchDisabled: true,
        });
    }

    render() {
        const {
            intl: {
                formatMessage,
            },
            params,
        } = this.props;
        const {
            teams,
            plannings,
            currentPlanning,
            coordinations,
            workzones,
            searchDisabled,
        } = this.state;

        let totalCapacity = 0;
        const possibleYears = getPossibleYears();
        if (teams && teams.length > 0) {
            teams.map((team) => {
                totalCapacity += team.capacity;
                return true;
            });
        }
        return (
            <section>
                <div className="widget__container full">
                    <div className="widget__content">
                        <Grid container spacing={4}>
                            <Grid item xs={4}>
                                <div className="margin-bottom--tiny">
                                    <FormattedMessage id="microplanning.label.planning" defaultMessage="Planning: " />
                                </div>
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
                            </Grid>
                            <Grid item xs={4}>
                                <div className="margin-bottom--tiny">
                                    <FormattedMessage
                                        id="microplanning.filter.cases.date"
                                        defaultMessage="Highlight villages with last HAT case in years"
                                    />
                                </div>
                                <Select
                                    multi
                                    simpleValue
                                    autosize={false}
                                    name="years"
                                    value={params.years || ''}
                                    placeholder={formatMessage(MESSAGES['years-select'])}
                                    options={possibleYears.map(value => ({ label: value, value }))}
                                    onChange={value => this.onChangeHandler('years', value)}
                                />
                            </Grid>
                        </Grid>
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
                            <div className="widget__content">
                                <Grid container spacing={4}>
                                    <Grid item xs={4}>
                                        <div className="margin-bottom--tiny">
                                            <FormattedMessage id="main.label.coordination" defaultMessage="Coordination" />
                                            {': '}
                                        </div>
                                        <Select
                                            simpleValue
                                            name="coordination_id"
                                            value={parseInt(params.coordination_id, 10)}
                                            placeholder={formatMessage(MESSAGES.all)}
                                            options={coordinations.map(coordination => ({ label: coordination.name, value: coordination.id }))}
                                            onChange={value => this.onChangeHandler('coordination_id', value)}
                                        />
                                    </Grid>
                                    <Grid item xs={4}>
                                        <div className="margin-bottom--tiny">
                                            <FormattedMessage id="main.label.workzone" defaultMessage="Work zone" />
                                            {': '}
                                        </div>

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
                                    </Grid>
                                    <Grid item xs={4}>
                                        <div className="margin-bottom--tiny">
                                            <FormattedMessage id="microplanning.label.team" defaultMessage="Team" />
                                            {': '}
                                        </div>

                                        <Select
                                            disabled={!params.workzone_id}
                                            simpleValue
                                            name="team_id"
                                            value={parseInt(params.team_id, 10)}
                                            placeholder={`${formatMessage(MESSAGES.all)} - ${totalCapacity}`}
                                            options={teams.map(team => ({ label: `${team.name} - ${team.capacity}`, value: team.id }))}
                                            onChange={teamId => this.onChangeTeam(teamId)}
                                        />
                                    </Grid>
                                </Grid>
                            </div>

                            <div className="widget__content align-right no-padding-top">
                                <button
                                    disabled={searchDisabled}
                                    className="button"
                                    onClick={() => this.onSearch()}
                                >
                                    <FormattedMessage id="main.label.search" defaultMessage="Search" />
                                </button>
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
    fetchVillages: PropTypes.func.isRequired,
    getAdditionalSelectData: PropTypes.func.isRequired,
    setCurrentTeam: PropTypes.func.isRequired,
};


const mapDispatchToProps = dispatch => (
    {
        ...bindActionCreators({
            fetchVillages: fetchVillagesAction,
        }, dispatch),
    }
);

export default connect(() => ({}), mapDispatchToProps)(injectIntl(MicroplanningFilters));
