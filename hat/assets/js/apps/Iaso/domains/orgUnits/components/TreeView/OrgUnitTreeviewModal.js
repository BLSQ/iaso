import React, { useState, useCallback, useRef } from 'react';
import { bool, func, object } from 'prop-types';
import { TreeViewWithSearch } from './TreeViewWithSearch';
import ConfirmCancelDialogComponent from '../../../../components/dialogs/ConfirmCancelDialogComponent';
import { MESSAGES } from './messages';
import { getRootData, getChildrenData, searchOrgUnits } from './requests';
import { OrgUnitLabel, getOrgUnitAncestors } from '../../utils';
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
    onConfirm,
    multiselect,
}) => {
    const [selectedOrgUnits, setSelectedOrgUnits] = useState([]);
    const [selectedOrgUnitParents, setSelectedOrgUnitParents] = useState(
        new Map(),
    );
    // Using a ref because state seems to reset when re-opening modal
    const selectedOrgUnitsCopy = useRef([]);
    const selectedOrgUnitParentsCopy = useRef(new Map());

    const onOrgUnitSelect = useCallback(
        orgUnit => {
            if (!multiselect) {
                setSelectedOrgUnits(orgUnit);
            }
        },
        [multiselect],
    );

    const onLabelClick = useCallback(
        (orgUnitIds, parentsData) => {
            setSelectedOrgUnits(orgUnitIds);
            setSelectedOrgUnitParents(parentsData);
        },
        [multiselect, selectedOrgUnits, selectedOrgUnitParents],
    );

    const onModalConfirm = useCallback(
        async closeDialog => {
            onConfirm(selectedOrgUnits);
            selectedOrgUnitsCopy.current = selectedOrgUnits;
            selectedOrgUnitParentsCopy.current = selectedOrgUnitParents;
            closeDialog();
        },
        [selectedOrgUnits, onConfirm],
    );

    const onModalCancel = useCallback(
        closeDialog => {
            setSelectedOrgUnits(selectedOrgUnitsCopy.current);
            setSelectedOrgUnitParents(selectedOrgUnitParentsCopy.current);
            closeDialog();
        },
        [selectedOrgUnitsCopy, selectedOrgUnitParentsCopy],
    );

    const resetSelection = () => {
        setSelectedOrgUnits(null);
        setSelectedOrgUnitParents(new Map());
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
            onCancel={onModalCancel}
            confirmMessage={MESSAGES.confirm}
            cancelMessage={MESSAGES.cancel}
            maxWidth="sm"
            allowConfirm={selectedOrgUnits?.length > 0}
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
                parseNodeIds={getOrgUnitAncestors}
                multiselect={multiselect}
                preselected={selectedOrgUnits}
                preexpanded={selectedOrgUnitParents}
                onLabelClick={onLabelClick}
            />
        </ConfirmCancelDialogComponent>
    );
};

OrgUnitTreeviewModal.propTypes = {
    titleMessage: object.isRequired,
    toggleOnLabelClick: bool,
    // onSelect: func,
    onConfirm: func,
    multiselect: bool,
};

OrgUnitTreeviewModal.defaultProps = {
    toggleOnLabelClick: true,
    // onSelect: () => {},
    onConfirm: () => {},
    multiselect: false,
};

export { OrgUnitTreeviewModal };
