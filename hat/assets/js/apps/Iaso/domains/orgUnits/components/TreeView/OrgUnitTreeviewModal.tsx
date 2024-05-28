import { Box, useTheme } from '@mui/material';
import {
    IconButton,
    IntlMessage,
    TreeViewWithSearch,
} from 'bluesquare-components';
import { isEqual } from 'lodash';
import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import ConfirmCancelDialogComponent from '../../../../components/dialogs/ConfirmCancelDialogComponent';
import { OrgUnit, OrgUnitStatus } from '../../types/orgUnit';
import { getOrgUnitAncestors } from '../../utils';
import { OrgUnitLabel } from '../OrgUnitLabel';
import { OrgUnitTreeviewPicker } from './OrgUnitTreeviewPicker';
import { SettingsPopper } from './SettingsPopper';
import { TreeViewLabel } from './TreeViewLabel';
import { MESSAGES } from './messages';
import { getChildrenData, getRootData, searchOrgUnits } from './requests';
import {
    formatInitialSelectedIds,
    formatInitialSelectedParents,
    tooltip,
} from './utils';

type Props = {
    titleMessage: string | IntlMessage;
    toggleOnLabelClick?: boolean;
    // eslint-disable-next-line no-unused-vars
    onConfirm: (selectedOrgUnits: any) => void;
    multiselect?: boolean;
    initialSelection?: OrgUnit | OrgUnit[];
    source?: number | string;
    version?: number | string;
    resetTrigger?: boolean;
    hardReset?: boolean;
    disabled?: boolean;
    required?: boolean;
    showStatusIconInTree?: boolean;
    showStatusIconInPicker?: boolean;
    clearable?: boolean;
    allowedTypes?: number[];
    errors?: string[];
    defaultOpen?: boolean;
    useIcon?: boolean;
};

const OrgUnitTreeviewModal: FunctionComponent<Props> = ({
    titleMessage,
    toggleOnLabelClick = true,
    onConfirm = () => undefined,
    multiselect = false,
    initialSelection = undefined,
    source = undefined,
    version = undefined,
    resetTrigger = false,
    hardReset = false,
    disabled = false,
    required = false,
    showStatusIconInTree = true,
    showStatusIconInPicker = true,
    clearable = true,
    allowedTypes = [],
    errors = [],
    defaultOpen = false,
    useIcon = false,
}) => {
    const theme = useTheme();
    const [settings, setSettings] = useState({
        displayTypes: true,
        // those three need to be prefilled with source config
        displayValid: false,
        displayRejected: true,
        displayNew: false,
    });

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
            let confirmValue;
            if (multiselect) {
                confirmValue = selectedOrgUnits;
            } else if (selectedOrgUnits) {
                confirmValue = Array.isArray(selectedOrgUnits)
                    ? selectedOrgUnits[0]
                    : selectedOrgUnits;
            }
            onConfirm(confirmValue);
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

    const { displayTypes, displayValid, displayRejected, displayNew } =
        settings;

    const validationStatus = useMemo(() => {
        return [
            ...(displayValid ? ['VALID'] : []),
            ...(displayRejected ? ['REJECTED'] : []),
            ...(displayNew ? ['NEW'] : []),
        ] as OrgUnitStatus[];
    }, [displayValid, displayRejected, displayNew]);

    const getRootDataWithSource = useCallback(async () => {
        if (version) return getRootData(version, 'version', validationStatus);
        return getRootData(source, 'source', validationStatus);
    }, [source, version, validationStatus]);

    const searchOrgUnitsWithSource = useCallback(
        async (value, count) => {
            return searchOrgUnits({
                value,
                count,
                source,
                version,
                validationStatus,
            });
        },
        [source, version, validationStatus],
    );

    const resetSelection = useCallback(() => {
        setSelectedOrgUnitsIds([]);
        setSelectedOrgUnitParents(new Map());
        if (multiselect) {
            onConfirm([]);
        } else {
            onConfirm(undefined);
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
        // @ts-ignore
        <ConfirmCancelDialogComponent
            renderTrigger={({ openDialog }) =>
                useIcon ? (
                    <IconButton
                        size="small"
                        tooltipMessage={
                            multiselect
                                ? MESSAGES.selectMultiple
                                : MESSAGES.selectSingle
                        }
                        icon="orgUnit"
                        onClick={openDialog}
                        disabled={disabled}
                    />
                ) : (
                    <OrgUnitTreeviewPicker
                        onClick={openDialog}
                        selectedItems={selectedOrgUnitParents}
                        resetSelection={resetSelection}
                        multiselect={multiselect}
                        placeholder={titleMessage}
                        required={required}
                        disabled={disabled}
                        label={(orgUnit: OrgUnit) => (
                            <TreeViewLabel
                                orgUnit={orgUnit}
                                withStatusIcon={showStatusIconInPicker}
                                withType={displayTypes}
                            />
                        )}
                        clearable={clearable}
                        errors={errors}
                    />
                )
            }
            titleMessage={titleMessage}
            onConfirm={onModalConfirm}
            onCancel={onModalCancel}
            confirmMessage={MESSAGES.confirm}
            cancelMessage={MESSAGES.cancel}
            maxWidth="sm"
            allowConfirm={selectedOrgUnitsIds?.length > 0}
            defaultOpen={defaultOpen}
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: theme.spacing(1),
                    right: theme.spacing(2),
                }}
            >
                <SettingsPopper setSettings={setSettings} settings={settings} />
            </Box>
            <Box mt={1}>
                <TreeViewWithSearch
                    getChildrenData={id =>
                        getChildrenData(id, validationStatus)
                    }
                    getRootData={getRootDataWithSource}
                    label={(orgUnit: OrgUnit) => (
                        <TreeViewLabel
                            orgUnit={orgUnit}
                            withStatusIcon={showStatusIconInTree}
                            withType={displayTypes}
                        />
                    )}
                    toggleOnLabelClick={toggleOnLabelClick}
                    onSelect={onOrgUnitSelect}
                    request={searchOrgUnitsWithSource}
                    makeDropDownText={orgUnit => (
                        <OrgUnitLabel orgUnit={orgUnit} />
                    )}
                    toolTip={tooltip}
                    parseNodeIds={getOrgUnitAncestors}
                    multiselect={multiselect}
                    queryOptions={{ keepPreviousData: true }}
                    childrenQueryOptions={{ keepPreviousData: true }}
                    preselected={selectedOrgUnitsIds}
                    preexpanded={selectedOrgUnitParents}
                    selectedData={selectedOrgUnits}
                    onUpdate={onUpdate}
                    allowSelection={item => {
                        if (allowedTypes.length === 0) return true;
                        return allowedTypes.includes(item.org_unit_type_id);
                    }}
                    dependency={validationStatus}
                    childrenDependency={validationStatus}
                />
            </Box>
        </ConfirmCancelDialogComponent>
    );
};

export { OrgUnitTreeviewModal };
