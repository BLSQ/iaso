import React, { useState, useCallback } from 'react';
import { bool, func, object } from 'prop-types';
import { TreeViewWithSearch } from './TreeViewWithSearch';
import ConfirmCancelDialogComponent from '../../../../components/dialogs/ConfirmCancelDialogComponent';
import { MESSAGES } from './messages';
import {
    getRootData,
    getChildrenData,
    searchOrgUnits,
    getOrgUnit,
} from './requests';
import {
    OrgUnitLabel,
    getOrgUnitAncestorsIds,
    getOrgUnitAncestorsNames,
} from '../../utils';
import OrgUnitTooltip from '../OrgUnitTooltip';
import { OrgUnitTreeviewPicker } from './OrgUnitTreeviewPicker';

const tooltip = (orgUnit, icon) => (
    <OrgUnitTooltip orgUnit={orgUnit} enterDelay={0} enterNextDelay={0}>
        {icon}
    </OrgUnitTooltip>
);

const OrgUnitTreeviewModal = ({
    titleMessage,
    toggleOnLabelClick,
    // onSelect,
    onConfirm,
}) => {
    const [allowConfirm, setAllowConfirm] = useState(false);
    const [selectedOrgUnit, setSelectedOrgUnit] = useState(null);
    const [selectedOrgUnitParents, setSelectedOrgUnitParents] = useState(null);

    const onOrgUnitSelect = orgUnit => {
        setSelectedOrgUnit(orgUnit);
        setAllowConfirm(true);
    };

    const onModalConfirm = useCallback(
        async closeDialog => {
            const fullOrgUnit = await getOrgUnit(selectedOrgUnit);
            const genealogy = getOrgUnitAncestorsNames(fullOrgUnit);
            setSelectedOrgUnitParents(genealogy);
            onConfirm(selectedOrgUnit);
            closeDialog();
        },
        [selectedOrgUnit, onConfirm, getOrgUnit, getOrgUnitAncestorsNames],
    );

    const onModalClose = () => {
        setSelectedOrgUnit(null);
    };

    const resetSelection = () => {
        setSelectedOrgUnit(null);
        setSelectedOrgUnitParents(null);
        onConfirm(null);
    };

    return (
        <ConfirmCancelDialogComponent
            renderTrigger={({ openDialog }) => (
                <OrgUnitTreeviewPicker
                    onClick={openDialog}
                    selectedItems={selectedOrgUnitParents}
                    resetSelection={resetSelection}
                />
            )}
            titleMessage={titleMessage}
            onConfirm={onModalConfirm}
            onClosed={onModalClose}
            confirmMessage={MESSAGES.confirm}
            cancelMessage={MESSAGES.cancel}
            maxWidth="sm"
            allowConfirm={allowConfirm}
        >
            <TreeViewWithSearch
                labelField="name"
                nodeField="id"
                getChildrenData={getChildrenData}
                getRootData={getRootData}
                toggleOnLabelClick={toggleOnLabelClick}
                onSelect={onOrgUnitSelect}
                request={searchOrgUnits}
                makeDropDownText={orgUnit => (
                    <OrgUnitLabel orgUnit={orgUnit} withType />
                )}
                toolTip={tooltip}
                parseNodeIds={getOrgUnitAncestorsIds}
                // onIconClick={setSelectedOrgUnitParents}
                // onLabelClick={setSelectedOrgUnitParents}
            />
        </ConfirmCancelDialogComponent>
    );
};

OrgUnitTreeviewModal.propTypes = {
    titleMessage: object.isRequired,
    toggleOnLabelClick: bool,
    // onSelect: func,
    onConfirm: func,
};

OrgUnitTreeviewModal.defaultProps = {
    toggleOnLabelClick: true,
    // onSelect: () => {},
    onConfirm: () => {},
};

export { OrgUnitTreeviewModal };
