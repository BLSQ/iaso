import React from 'react';
import PropTypes from 'prop-types';
import MESSAGES from '../messages';
import { OrgUnitTreeviewModal } from '../../orgUnits/components/TreeView/OrgUnitTreeviewModal';

const UsersLocations = ({ handleChange, currentUser }) => {
    const onConfirm = orgUnitsList => {
        if (!orgUnitsList) {
            handleChange([]);
            return;
        }
        handleChange(orgUnitsList);
    };
    return (
        <OrgUnitTreeviewModal
            toggleOnLabelClick={false}
            titleMessage={MESSAGES.chooseLocation}
            onConfirm={onConfirm}
            multiselect
            initialSelection={currentUser.org_units.value}
        />
    );
};

UsersLocations.propTypes = {
    handleChange: PropTypes.func.isRequired,
    currentUser: PropTypes.object.isRequired,
};

export default UsersLocations;
