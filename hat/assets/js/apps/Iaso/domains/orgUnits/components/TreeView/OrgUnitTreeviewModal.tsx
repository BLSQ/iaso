import { Box, useTheme } from '@mui/material';
import { makeStyles } from '@mui/styles';
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
    useRef,
    useState,
} from 'react';
import ConfirmCancelDialogComponent from '../../../../components/dialogs/ConfirmCancelDialogComponent';
import { OrgUnit } from '../../types/orgUnit';
import { OrgUnitLabel, getOrgUnitAncestors } from '../../utils';
import { OrgUnitTreeviewPicker } from './OrgUnitTreeviewPicker';
import { SettingsPopper } from './SettingsPopper';
import { MESSAGES } from './messages';
import { getChildrenData, getRootData, searchOrgUnits } from './requests';
import {
    formatInitialSelectedIds,
    formatInitialSelectedParents,
    makeTreeviewLabel,
    orgUnitTreeviewStatusIconsStyle,
    tooltip,
} from './utils';

const useStyles = makeStyles(orgUnitTreeviewStatusIconsStyle);

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
    onConfirm = () => null,
    multiselect = false,
    initialSelection = null,
    source = null,
    version = null,
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
    const classes = useStyles();
    const [settings, setSettings] = useState({
        displayTypes: true,
        displayRejected: false,
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

    const { displayTypes, displayRejected, displayNew } = settings;

    const validationStatus = `VALID${displayRejected ? ',REJECTED' : ''}${
        displayNew ? ',NEW' : ''
    }`;

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

    console.log('selectedOrgUnitParents', selectedOrgUnitParents);
    console.log('initialSelection', initialSelection);
    return (
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
                        label={makeTreeviewLabel(
                            classes,
                            showStatusIconInPicker,
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
                    label={makeTreeviewLabel(
                        classes,
                        showStatusIconInTree,
                        displayTypes,
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
