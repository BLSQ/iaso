/*
 * This component displays a modal ti assing As to team.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import isEqual from 'lodash/isEqual';

import VillageSearchModal from '../../../components/VillageSearchModal';
import columns from '../utils/constants/MicroplanningVillageSearchColumns';

const getModalTitle = (count, selectedCount, formatMessage) => (
    <span>
        {
            selectedCount !== 0
            && (
                `${selectedCount} ${formatMessage({
                    defaultMessage: 'village(s) selected',
                    id: 'main.label.villages.selectedMulti',
                })}  ${formatMessage(({
                    defaultMessage: 'on',
                    id: 'main.label.on',
                }))} `
            )
        }
        {count}
        {
            selectedCount === 0
            && (
                ` ${formatMessage({
                    defaultMessage: 'village(s)',
                    id: 'main.label.villages.smallCapsMulti',
                })}`
            )
        }
    </span>
);

const getMappedVillages = (villages, assignations, teams) => villages.map((v) => {
    const assignation = assignations.find(a => a.village_id === v.id);
    let team = {
        name: 'zz',
    };
    if (assignation) {
        team = teams.find(t => t.id === assignation.team_id);
    }
    return ({
        ...v,
        assignation,
        assignationTeamId: assignation ? assignation.team_id : null,
        assignationTeamName: team && team.name,
    });
});

class MicroplanningVillageSearch extends Component {
    constructor(props) {
        super(props);
        this.state = {
            searchString: '',
            results: [],
        };
    }

    componentDidUpdate(prevProps) {
        if (!isEqual(prevProps.assignations, this.props.assignations)) {
            this.handleSearch(this.state.searchString, this.props.assignations);
        }
    }

    displayItem(village) {
        const {
            displayItem,
            toggleSearchModal,
        } = this.props;
        toggleSearchModal();
        displayItem({
            ...village,
            _latlon: [village.latitude, village.longitude],
        });
    }

    handleSearch(
        searchString,
        assignations = this.props.assignations,
    ) {
        const {
            villages,
            teams,
        } = this.props;
        let mappedVillages = getMappedVillages(villages, assignations, teams);
        if (searchString !== '') {
            this.setState({
                searchString,
            });
            const regex = RegExp(searchString.toLowerCase());
            mappedVillages = mappedVillages.filter(v => regex.test(v.name.toLowerCase()));
        }
        this.setState({
            results: mappedVillages,
        });
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
        } = this.props;
        const filters = {
            workzone_id: workZoneId,
            years,
            planningId,
        };
        const {
            results,
        } = this.state;
        if (teamId) {
            filters.team_id = teamId;
        }
        const assignationLength = results.filter(r => r.assignationTeamId !== null).length;
        return (
            <VillageSearchModal
                showModal={showSearchModal}
                showButton={false}
                toggleModal={() => toggleSearchModal()}
                columns={columns(formatMessage, this)}
                filters={filters}
                autoLoad
                results={results}
                getResutText={count => getModalTitle(count, assignationLength, formatMessage)}
                onSearch={searchString => this.handleSearch(searchString)}
                defaultSortKey="assignationTeamName"
                defaultPageSize={20}
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
    displayItem: PropTypes.func.isRequired,
    villages: PropTypes.array.isRequired,
    teams: PropTypes.array.isRequired,
};


export default injectIntl(MicroplanningVillageSearch);
