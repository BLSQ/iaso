/*
 * This component displays a modal ti assing As to team.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import Select from 'react-select';

import VillageSearchModal from '../../../components/VillageSearchModal';
import columns from '../utils/constants/MicroplanningVillageSearchColumns';

const getModalTitle = (count, selectedCount, formatMessage) => (
    `${selectedCount} ${formatMessage({
        defaultMessage: 'villages',
        id: 'main.label.villages.selected',
    })}  ${formatMessage(({
        defaultMessage: 'on',
        id: 'main.label.on',
    }))} ${count}`
);


class MicroplanningVillageSearch extends Component {
    onChangeTeam(selectedTeamId, villageId) {
        const {
            assignations,
        } = this.props;
        const newAssignations = [];
        let existingAssignation = false;
        assignations.forEach((a) => {
            const newAssignation = {
                ...a,
            };
            if (a.village_id === villageId) {
                existingAssignation = true;
                newAssignation.team_id = parseInt(selectedTeamId, 10);
                if (selectedTeamId) {
                    newAssignations.push(newAssignation);
                }
            } else {
                newAssignations.push(newAssignation);
            }
        });
        if (selectedTeamId && !existingAssignation) {
            newAssignations.push({
                team_id: parseInt(selectedTeamId, 10),
                village_id: villageId,
            });
        }
        this.props.selectItems(newAssignations, true);
    }

    getColumns() {
        const {
            intl: {
                formatMessage,
            },
            assignations,
            teams,
        } = this.props;
        const selectedColumns = [{
            Header: formatMessage({
                defaultMessage: 'Team',
                id: 'main.label.team',
            }),
            className: 'small select',
            width: 300,
            accessor: 'team',
            Cell: (settings) => {
                const villageSelected = assignations.find(sv => sv.village_id === settings.original.id);
                return (
                    <section className="width-full">

                        <Select
                            multi={false}
                            clearable
                            simpleValue
                            value={villageSelected && villageSelected.team_id}
                            placeholder={formatMessage({
                                id: 'vector.label.notAssigned',
                                defaultMessage: 'Not assigned',
                            })}
                            options={teams.map((t => (
                                {
                                    value: t.id,
                                    label: t.name,
                                }
                            )))}
                            onChange={teamId => this.onChangeTeam(teamId, settings.original.id)}
                        />
                    </section>
                );
            },
        },
        {
            Header: formatMessage({
                defaultMessage: 'Selected Id',
                id: 'main.label.selected.id',
            }),
            className: 'small',
            accessor: 'selected_id',
            Cell: (settings) => {
                const villageSelected = assignations.find(sv => sv.village_id === settings.original.id);
                return (
                    <section>
                        {
                            villageSelected
                            && (villageSelected.index || villageSelected.index === 0)
                            && `${villageSelected.index + 1}`
                        }
                        {
                            !villageSelected
                            && '-'
                        }

                        {
                            villageSelected
                            && !villageSelected.index && villageSelected.index !== 0
                            && (
                                <span className="error-text">
                                    {formatMessage({
                                        defaultMessage: 'Not saved',
                                        id: 'main.label.notSaved',
                                    })}
                                </span>
                            )
                        }
                    </section>
                );
            },
        },
        ];

        const originalColumns = selectedColumns.concat(columns(formatMessage));
        return originalColumns;
    }

    render() {
        const {
            showSearchModal,
            toggleSearchModal,
            intl: {
                formatMessage,
            },
            filters: {
                planningId,
                workZoneId,
                years,
                teamId,
            },
            assignations,
            saveButton,
        } = this.props;
        const filters = {
            workzone_id: workZoneId,
            years,
            planningId,
        };
        if (teamId) {
            filters.team_id = teamId;
        }

        return (
            <VillageSearchModal
                showModal={showSearchModal}
                showButton={false}
                toggleModal={() => toggleSearchModal()}
                columns={this.getColumns()}
                filters={filters}
                autoLoad
                getResutText={count => getModalTitle(count, assignations.length, formatMessage)}
                extraButtons={[saveButton]}
            />
        );
    }
}

MicroplanningVillageSearch.propTypes = {
    showSearchModal: PropTypes.bool.isRequired,
    toggleSearchModal: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    assignations: PropTypes.array.isRequired,
    filters: PropTypes.object.isRequired,
    teams: PropTypes.array.isRequired,
    selectItems: PropTypes.func.isRequired,
    saveButton: PropTypes.object.isRequired,
};


export default injectIntl(MicroplanningVillageSearch);
