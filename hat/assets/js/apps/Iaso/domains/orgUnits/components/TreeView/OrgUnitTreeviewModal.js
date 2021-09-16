import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    bool,
    func,
    object,
    arrayOf,
    oneOfType,
    any,
    string,
} from 'prop-types';
import { isEqual } from 'lodash';
import { TreeViewWithSearch } from './TreeViewWithSearch';
import ConfirmCancelDialogComponent from '../../../../components/dialogs/ConfirmCancelDialogComponent';
import { MESSAGES } from './messages';
import { getRootData, getChildrenData, searchOrgUnits } from './requests';
import { OrgUnitLabel, getOrgUnitAncestors } from '../../utils';
import { OrgUnitTreeviewPicker } from './OrgUnitTreeviewPicker';
import {
    formatInitialSelectedIds,
    formatInitialSelectedParents,
    tooltip,
} from './utils';

const OrgUnitTreeviewModal = ({
    titleMessage,
    toggleOnLabelClick,
    onConfirm,
    multiselect,
    initialSelection,
    source,
    resetTrigger,
    disabled,
    version,
}) => {
    const [selectedOrgUnits, setSelectedOrgUnits] = useState(initialSelection);

    const [selectedOrgUnitsIds, setSelectedOrgUnitsIds] = useState(
        formatInitialSelectedIds(initialSelection),
    );
    const [selectedOrgUnitParents, setSelectedOrgUnitParents] = useState(
        formatInitialSelectedParents(initialSelection),
    );
    // Using a ref because state seems to reset when re-opening modal
    const selectedOrgUnitsIdsCopy = useRef(
        formatInitialSelectedIds(initialSelection),
    );
    const selectedOrgUnitParentsCopy = useRef(
        formatInitialSelectedParents(initialSelection),
    );
    const controlRef = useRef(initialSelection);

    const onOrgUnitSelect = useCallback(
        orgUnit => {
            if (!multiselect) {
                setSelectedOrgUnitsIds(orgUnit);
            }
        },
        [multiselect],
    );

    const onUpdate = (orgUnitIds, parentsData, orgUnits) => {
        setSelectedOrgUnitsIds(orgUnitIds);
        setSelectedOrgUnitParents(parentsData);
        if (orgUnits) {
            setSelectedOrgUnits(orgUnits);
        }
    };

    const onModalConfirm = useCallback(
        async closeDialog => {
            onConfirm(multiselect ? selectedOrgUnits : selectedOrgUnits[0]);
            selectedOrgUnitsIdsCopy.current = selectedOrgUnitsIds;
            selectedOrgUnitParentsCopy.current = selectedOrgUnitParents;
            closeDialog();
        },
        [
            selectedOrgUnitsIds,
            selectedOrgUnitParents,
            selectedOrgUnits,
            onConfirm,
            multiselect,
        ],
    );

    const onModalCancel = useCallback(
        closeDialog => {
            setSelectedOrgUnitsIds(selectedOrgUnitsIdsCopy.current);
            setSelectedOrgUnitParents(selectedOrgUnitParentsCopy.current);
            closeDialog();
        },
        [selectedOrgUnitsIdsCopy, selectedOrgUnitParentsCopy],
    );

    const getRootDataWithSource = useCallback(async () => {
        if (version) return getRootData(version, 'version');
        return getRootData(source);
    }, [source, version]);

    const searchOrgUnitsWithSource = async (value, count) => {
        return searchOrgUnits(value, count, source);
    };

    const resetSelection = useCallback(() => {
        setSelectedOrgUnitsIds([]);
        setSelectedOrgUnitParents(new Map());
        onConfirm(null);
    }, [onConfirm]);

    const setToInitialValues = initialValues => {
        setSelectedOrgUnits(initialValues);
        setSelectedOrgUnitsIds(formatInitialSelectedIds(initialValues));
        setSelectedOrgUnitParents(formatInitialSelectedParents(initialValues));
        selectedOrgUnitsIdsCopy.current =
            formatInitialSelectedIds(initialValues);
        selectedOrgUnitParentsCopy.current =
            formatInitialSelectedParents(initialValues);
        controlRef.current = initialValues;
    };

    // checking for deep equality between controlRef and initialSelection to prevent resetting values on every render
    useEffect(() => {
        if (!isEqual(controlRef.current, initialSelection)) {
            setToInitialValues(initialSelection);
        }
    }, [initialSelection]);

    useEffect(() => {
        if (resetTrigger) {
            setToInitialValues(initialSelection);
            resetSelection();
        }
    }, [resetTrigger, initialSelection, resetSelection]);

    return (
        <ConfirmCancelDialogComponent
            renderTrigger={({ openDialog }) => (
                <OrgUnitTreeviewPicker
                    onClick={disabled ? () => null : openDialog}
                    selectedItems={selectedOrgUnitParents}
                    resetSelection={resetSelection}
                    multiselect={multiselect}
                    placeholder={titleMessage}
                />
            )}
            titleMessage={titleMessage}
            onConfirm={onModalConfirm}
            onCancel={onModalCancel}
            confirmMessage={MESSAGES.confirm}
            cancelMessage={MESSAGES.cancel}
            maxWidth="sm"
            allowConfirm={selectedOrgUnitsIds?.length > 0}
        >
            <TreeViewWithSearch
                labelField="name"
                nodeField="id"
                getChildrenData={getChildrenData}
                getRootData={getRootDataWithSource}
                toggleOnLabelClick={toggleOnLabelClick}
                onSelect={onOrgUnitSelect}
                request={searchOrgUnitsWithSource}
                makeDropDownText={orgUnit => (
                    <OrgUnitLabel orgUnit={orgUnit} withType />
                )}
                toolTip={tooltip}
                parseNodeIds={getOrgUnitAncestors}
                multiselect={multiselect}
                preselected={selectedOrgUnitsIds}
                preexpanded={selectedOrgUnitParents}
                onUpdate={onUpdate}
                selectedData={selectedOrgUnits}
            />
        </ConfirmCancelDialogComponent>
    );
};

OrgUnitTreeviewModal.propTypes = {
    titleMessage: oneOfType([object, string]).isRequired,
    toggleOnLabelClick: bool,
    onConfirm: func,
    multiselect: bool,
    initialSelection: oneOfType([arrayOf(object), object]),
    source: any,
    version: any,
    resetTrigger: bool,
    disabled: bool,
};

OrgUnitTreeviewModal.defaultProps = {
    toggleOnLabelClick: true,
    onConfirm: () => {},
    multiselect: false,
    initialSelection: null,
    source: null,
    version: null,
    resetTrigger: false,
    disabled: false,
};

export { OrgUnitTreeviewModal };
