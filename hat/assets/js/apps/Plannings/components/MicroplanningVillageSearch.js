/*
 * This component displays a modal ti assing As to team.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';

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

const getColumns = (formatMessage) => {
    const originalColumns = columns(formatMessage);
    return originalColumns;
};

class MicroplanningVillageSearch extends Component {
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
            selectedVillages,
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
                onSelectVillage={(village) => {
                    console.log(village);
                }}
                showModal={showSearchModal}
                showButton={false}
                toggleModal={() => toggleSearchModal()}
                columns={getColumns(formatMessage)}
                filters={filters}
                autoLoad
                getResutText={count => getModalTitle(count, selectedVillages.length, formatMessage)}
            />
        );
    }
}

MicroplanningVillageSearch.propTypes = {
    showSearchModal: PropTypes.bool.isRequired,
    toggleSearchModal: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    selectedVillages: PropTypes.array.isRequired,
    filters: PropTypes.object.isRequired,
};


export default injectIntl(MicroplanningVillageSearch);
