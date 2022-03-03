import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    bool,
    func,
    object,
    arrayOf,
    oneOfType,
    number,
    string,
    array,
} from 'prop-types';
import { isEqual } from 'lodash';
import { makeStyles } from '@material-ui/core/styles';
import { TreeViewWithSearch } from 'bluesquare-components';
import ConfirmCancelDialogComponent from '../../../../components/dialogs/ConfirmCancelDialogComponent';
import { MESSAGES } from './messages';
import { getRootData, getChildrenData, searchOrgUnits } from './requests';
import { OrgUnitLabel, getOrgUnitAncestors } from '../../utils';

import { OrgUnitTreeviewPicker } from './OrgUnitTreeviewPicker';
import {
    formatInitialSelectedIds,
    formatInitialSelectedParents,
    tooltip,
    makeTreeviewLabel,
    orgUnitTreeviewStatusIconsStyle,
} from './utils';

const useStyles = makeStyles(orgUnitTreeviewStatusIconsStyle);

const OrgUnitTreeviewModal = ({
    titleMessage,
    toggleOnLabelClick,
    onConfirm,
    multiselect,
    initialSelection,
    source,
    resetTrigger,
    hardReset,
    disabled,
    version,
    required,
    showStatusIconInTree,
    showStatusIconInPicker,
    clearable,
    allowedTypes,
}) => {
    const classes = useStyles();
    const [selectedOrgUnits, setSelectedOrgUnits] = useState(initialSelection);

    const [selectedOrgUnitsIds, setSelectedOrgUnitsIds] = useState(
        formatInitialSelectedIds(initialSelection),
    );
    // Using this value to generate TruncatedTree and tell the Treeview which nodes are already expanded
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

    const searchOrgUnitsWithSource = useCallback(
        async (value, count) => {
            return searchOrgUnits({value, count, source, version});
        },
        [source, version],
    );

    const resetSelection = useCallback(() => {
        setSelectedOrgUnitsIds([]);
        setSelectedOrgUnitParents(new Map());
        if (multiselect) {
            onConfirm([]);
        } else {
            onConfirm(null);
        }
    }, [onConfirm, multiselect]);

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
        }
    }, [resetTrigger, initialSelection, resetSelection]);

    useEffect(() => {
        if (resetTrigger && hardReset) {
            resetSelection();
        }
    }, [resetTrigger, hardReset, resetSelection]);

    return (
        <ConfirmCancelDialogComponent
            renderTrigger={({ openDialog }) => (
                <OrgUnitTreeviewPicker
                    onClick={openDialog}
                    selectedItems={selectedOrgUnitParents}
                    resetSelection={resetSelection}
                    multiselect={multiselect}
                    placeholder={titleMessage}
                    required={required}
                    disabled={disabled}
                    label={makeTreeviewLabel(classes, showStatusIconInPicker)}
                    clearable={clearable}
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
                getChildrenData={getChildrenData}
                getRootData={getRootDataWithSource}
                label={makeTreeviewLabel(classes, showStatusIconInTree)}
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
                selectedData={selectedOrgUnits}
                onUpdate={onUpdate}
                allowSelection={item => {
                    if (allowedTypes.length === 0) return true;
                    if (allowedTypes.includes(item.org_unit_type_id)) return true;
                    return false;
                }}
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
    source: oneOfType([number, string]),
    version: oneOfType([number, string]),
    resetTrigger: bool,
    hardReset: bool, // when true, it will clear the selectedOrgUnits on reset, emptying the TreeviewPIcker selection
    disabled: bool,
    required: bool,
    showStatusIconInTree: bool,
    showStatusIconInPicker: bool,
    clearable: bool,
    allowedTypes: array,
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
    required: false,
    hardReset: false,
    showStatusIconInTree: true,
    showStatusIconInPicker: true,
    clearable: true,
    allowedTypes: [],
};

export { OrgUnitTreeviewModal };
