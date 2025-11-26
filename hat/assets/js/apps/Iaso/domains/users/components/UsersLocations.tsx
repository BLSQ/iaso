import React, { FunctionComponent } from 'react';
import MESSAGES from '../messages';
import { OrgUnitTreeviewModal } from '../../orgUnits/components/TreeView/OrgUnitTreeviewModal';

type Props = {
    handleChange: (value: any[]) => void;
    currentUser: any;
};
const UsersLocations: FunctionComponent<Props> = ({
    handleChange,
    currentUser,
}) => {
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

export default UsersLocations;
