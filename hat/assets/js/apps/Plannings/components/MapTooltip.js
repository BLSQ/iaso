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
    injectIntl,
} from 'react-intl';

import { capitalize } from '../../../utils';
import { MESSAGES, ROWS } from '../constants/maptooltip';

const request = require('superagent');

class MapTooltip extends Component {
    constructor(props) {
        super(props);
        this.state = {
            fullItem: null,
            teams: props.teams,
            isloading: true,
        };
    }

    componentDidMount() {
        this.loadVillageDetail(this.props.item.id, this.props.item);
    }

    componentDidUpdate(prevProps) {
        const {
            item,
        } = this.props;
        if (prevProps.item.id !== item.id) {
            this.loadVillageDetail(item.id);
        }
    }

    onChangeTeam(selectedTeamId) {
        this.setState({ selectedTeamId });
        const villageId = parseInt(this.props.item.id, 10);
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
            fullItem: Object.assign({}, this.state.fullItem, value),
        });
    }

    loadVillageDetail(itemId) {
        this.setState({
            isloading: true,
            fullItem: null,
            // isVillage: true,
        });
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


    render() {
        const {
            intl: {
                formatMessage,
            },
            workzoneId,
            planningId,
            item,
        } = this.props;
        const {
            fullItem,
            selectedTeamId,
            teams,
            isloading,
        } = this.state;
        let selectedTeam = {
            name: '--',
        };
        if (selectedTeamId) {
            [selectedTeam] = teams.filter(t => t.id === parseInt(selectedTeamId, 10));
        }
        return (
            <div key={item.id} className="map__tooltip microplanning">
                {
                    (!fullItem || isloading)
                    && (
                        <div className="loading-map__tooltip">
                            <i className="fa fa-spinner" />
                        </div>
                    )
                }
                {
                    (fullItem && !isloading)
                    && (
                        <section>
                            {fullItem.name && planningId ? (
                                <div className="property">
                                    <div className={`label${workzoneId !== '' ? ' select-team' : ''}`}>
                                        <FormattedMessage
                                            id="microplanning.label.team"
                                            defaultMessage="Team"
                                        />
                                    </div>
                                    <div className="value">
                                        {
                                            workzoneId === ''
                                            && selectedTeam.name
                                        }
                                        {
                                            workzoneId !== ''
                                            && (
                                                <select
                                                    value={selectedTeamId || ''}
                                                    className="styled-select"
                                                    onChange={event => this.onChangeTeam(event.currentTarget.value)}
                                                >
                                                    <option value="none">{formatMessage(MESSAGES.team_all)}</option>
                                                    {
                                                        teams.map(value => (
                                                            <option key={value.id} value={value.id}>
                                                                {value.name}
                                                            </option>
                                                        ))}
                                                </select>
                                            )
                                        }
                                    </div>
                                </div>
                            )
                                : null}
                            {
                                ROWS
                                    .filter(row => fullItem[row.key] && fullItem[row.key] !== '')
                                    .map((row) => {
                                        let value = fullItem[row.key];
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
                        </section>
                    )
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
