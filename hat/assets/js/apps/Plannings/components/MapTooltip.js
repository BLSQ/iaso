/*
 * This component displays the properties of a given object.
 *
 * The `ROWS` array includes the properties list.
 *
 * The `MESSAGES` object includes the labels needed. If the row type is `message`
 * the possible property values MUST be included as message entry keys.
 * In our case the key `type` represents the village internal classification,
 * `official`, `other` and `unknown`; with this option those values are changed
 * to user readable/understandable texts.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
    FormattedDate,
    FormattedMessage,
    FormattedNumber,
    defineMessages,
    injectIntl,
} from 'react-intl';

import { capitalize } from '../../../utils';

const request = require('superagent');

export const urls = [{
    name: 'village_detail',
    id: 'village_id',
    url: ' /api/villages/',
    mock: [{
        province: 'Kwilu',
        former_province: '',
        zs: 'Bagata',
        as: 'Bangumi',
        type: 'YES',
        latitude: -3.4995401,
        longitude: 17.681,
        gps_source: 'ITM',
        population: 799,
        population_year: 2016,
        population_source: 'BCZ BAGATA',
    }],
}];

const MESSAGES = defineMessages({
    province: {
        id: 'microplanning.tooltip.province',
        defaultMessage: 'Province',
    },
    former_province: {
        id: 'microplanning.tooltip.province.former',
        defaultMessage: 'Former province',
    },
    zs: {
        id: 'microplanning.tooltip.zone',
        defaultMessage: 'Zone de sante',
    },
    as: {
        id: 'microplanning.tooltip.area',
        defaultMessage: 'Aire de sante',
    },
    name: {
        id: 'microplanning.tooltip.village',
        defaultMessage: 'Village',
    },
    villagesOfficial: {
        id: 'microplanning.tooltip.villages.official',
        defaultMessage: 'Villages Z.S.',
    },
    villagesOther: {
        id: 'microplanning.tooltip.villages.other',
        defaultMessage: 'Villages non-Z.S.',
    },
    villagesUnknown: {
        id: 'microplanning.tooltip.villages.unknown',
        defaultMessage: 'Villages satellite',
    },
    village_official: {
        id: 'microplanning.tooltip.type',
        defaultMessage: 'Classification',
    },
    latitude: {
        id: 'microplanning.tooltip.latitude',
        defaultMessage: 'Latitude',
    },
    longitude: {
        id: 'microplanning.tooltip.longitude',
        defaultMessage: 'Longitude',
    },
    gps_source: {
        id: 'microplanning.tooltip.gps.source',
        defaultMessage: 'GPS source',
    },

    population: {
        id: 'microplanning.tooltip.population',
        defaultMessage: 'Population',
    },
    population_source: {
        id: 'microplanning.tooltip.population.source',
        defaultMessage: 'Source de la population',
    },
    population_year: {
        id: 'microplanning.tooltip.population.year',
        defaultMessage: 'Année relevé population',
    },

    lastConfirmedCaseDate: {
        id: 'microplanning.tooltip.case.date',
        defaultMessage: 'Last confirmed HAT case date',
    },
    lastConfirmedCaseYear: {
        id: 'microplanning.tooltip.case.year',
        defaultMessage: 'Last confirmed HAT case year',
    },
    nr_positive_cases: {
        id: 'microplanning.tooltip.cases',
        defaultMessage: 'Confirmed HAT cases',
    },
    team_all: {
        defaultMessage: 'None',
        id: 'microplanning.label.team.all',
    },
    team_select: {
        defaultMessage: 'Unité',
        id: 'microplanning.label.team',
    },
    add_as: {
        defaultMessage: 'Ajouter l\'aire de santé à l\'équipe',
        id: 'microplanning.label.add_as',
    },
    remove_as: {
        defaultMessage: 'Supprimer l\'aire de santé de l\'équipe',
        id: 'microplanning.label.remove_as',
    },

    // type values
    YES: {
        id: 'microplanning.tooltip.village.type.official',
        defaultMessage: 'from Z.S.',
    },
    NO: {
        id: 'microplanning.tooltip.village.type.notofficial',
        defaultMessage: 'not from Z.S.',
    },
    OTHER: {
        id: 'microplanning.tooltip.village.type.other',
        defaultMessage: 'found during campaigns',
    },
    NA: {
        id: 'microplanning.tooltip.village.type.unknown',
        defaultMessage: 'visible from satellite',
    },
});

const ROWS = [
    { key: 'name' },
    { key: 'zs' },
    { key: 'as' },
    { key: 'province' },
    { key: 'former_province' },
    { key: 'villagesOfficial', type: 'integer' },
    { key: 'villagesOther', type: 'integer' },
    { key: 'villagesUnknown', type: 'integer' },
    { key: 'village_official', type: 'message' },
    { key: 'latitude', type: 'coordinates' },
    { key: 'longitude', type: 'coordinates' },
    { key: 'gps_source' },
    { key: 'population', type: 'integer' },
    { key: 'population_year' },
    { key: 'population_source' },
    { key: 'lastConfirmedCaseDate', type: 'date' },
    { key: 'lastConfirmedCaseYear' },
    { key: 'nr_positive_cases', type: 'integer' },
];

class MapTooltip extends Component {
    constructor(props) {
        super(props);
        this.state = {
            item: props.item,
            teams: props.teams,
            // areas: props.areas,
            isloading: true,
            // isVillage: false,
        };
    }

    componentDidMount() {
        // If this is a village we need to fetch the detail of it
        if (this.state.item.name) {
            this.loadVillageDetail(this.state.item.id);
        } else {
            this.setState({ isloading: false });// eslint-disable-line
        }
    }

    componentWillReceiveProps(newProps) {
        this.setState({
            item: newProps.item,
        });
        if (newProps.item.name) {
            this.loadVillageDetail(newProps.item.id);
        }
    }

    onChangeTeam(selectedTeamId) {
        this.setState({ selectedTeamId });
        const villageId = parseInt(this.state.item.id, 10);
        const newAssignations = [];
        this.props.assignations.map((a) => {
            const newAssignation = Object.assign({}, a);
            if (a.village_id === villageId) {
                newAssignation.team_id = parseInt(selectedTeamId, 10);
                if (selectedTeamId !== 'none') {
                    newAssignations.push(newAssignation);
                }
            } else {
                newAssignations.push(newAssignation);
            }
            return null;
        });
        if (!this.state.selectedTeamId && (selectedTeamId !== 'none')) {
            newAssignations.push({
                team_id: parseInt(selectedTeamId, 10),
                village_id: villageId,
            });
        }
        this.props.selectItems(newAssignations, true);
    }


    updateItemField(value) {
        this.setState({
            item: Object.assign({}, this.state.item, value),
        });
    }

    loadVillageDetail(itemId) {
        this.setState({
            isloading: true,
            // isVillage: true,
        });
        if (itemId) {
            request
                .get(`/api/villages/${itemId}`)
                .query({ planning_id: this.props.planningId })
                .then((result) => {
                    this.updateItemField(result.body);
                    const existingTeamId = this.props.assignations.filter(a => a.village_id === parseInt(itemId, 10));
                    this.setState({
                        isloading: false,
                        selectedTeamId: existingTeamId.length > 0 ? existingTeamId[0].team_id : null,
                    });
                })
                .catch((err) => {
                    console.error('Error when fetching villages details');
                });
        }
    }


    render() {
        const { formatMessage } = this.props.intl;
        if (!this.state.item || this.state.isloading) {
            return null;
        }
        let selectedTeam = {
            name: '--',
        };
        if (this.state.selectedTeamId) {
            [selectedTeam] = this.state.teams.filter(t => t.id === parseInt(this.state.selectedTeamId, 10));
        }
        return (
            <div key={this.state.item.id} className="map__tooltip">
                {this.state.item.name && this.props.planningId ? (
                    <div className="property">
                        <div className={`label${this.props.workzoneId !== '' ? ' select-team' : ''}`}>
                            <FormattedMessage
                                id="microplanning.label.team"
                                defaultMessage="Unité"
                            />
                        </div>
                        <div className="value">
                            {
                                this.props.workzoneId === '' &&
                                selectedTeam.name
                            }
                            {
                                this.props.workzoneId !== '' &&
                                <select
                                    value={this.state.selectedTeamId || ''}
                                    className="styled-select"
                                    onChange={event => this.onChangeTeam(event.currentTarget.value)}
                                >
                                    <option value="none">{formatMessage(MESSAGES.team_all)}</option>
                                    {
                                        this.state.teams.map(value =>
                                            (
                                                <option key={value.id} value={value.id}>
                                                    {value.name}
                                                </option>
                                            ))}
                                </select>
                            }
                        </div>
                    </div>) :
                    null}
                {
                    ROWS
                        .filter(row => this.state.item[row.key] && this.state.item[row.key] !== '')
                        .map((row) => {
                            let value = this.state.item[row.key];
                            switch (row.type) {
                                case 'date':
                                    value = <FormattedDate value={value} year="numeric" month="long" day="numeric" />;
                                    break;
                                case 'capitalize':
                                    value = capitalize(value);
                                    break;
                                case 'coordinates':
                                    value = (
                                        <FormattedNumber
                                            value={value}
                                            minimumFractionDigits={8}
                                        />
                                    );
                                    break;
                                case 'float':
                                    value = (
                                        <FormattedNumber
                                            value={value}
                                            minimumFractionDigits={2}
                                        />
                                    );
                                    break;
                                case 'integer':
                                    value = <FormattedNumber value={value} />;
                                    break;
                                case 'message':
                                    value = <FormattedMessage {...MESSAGES[value]} />;
                                    const temp = <FormattedMessage {...MESSAGES[row.key]} />;
                                    break;
                                default:
                                    break;
                            }

                            return (
                                <div key={row.key} className="property">
                                    <div className="label">
                                        <FormattedMessage {...MESSAGES[row.key]} />
                                    </div>
                                    <div className="value">
                                        {value}
                                    </div>
                                </div>
                            );
                        })
                }
            </div>
        );
    }
}

MapTooltip.defaultProps = {
    teamId: '',
    teams: [],
    planningId: '',
    assignations: [],
};


MapTooltip.propTypes = {
    intl: PropTypes.object.isRequired,
    item: PropTypes.object.isRequired,
    teamId: PropTypes.string,
    teams: PropTypes.arrayOf(PropTypes.object),
    planningId: PropTypes.string,
    assignations: PropTypes.array,
    selectItems: PropTypes.func.isRequired,
    workzoneId: PropTypes.string.isRequired,
};

export default injectIntl(MapTooltip);

