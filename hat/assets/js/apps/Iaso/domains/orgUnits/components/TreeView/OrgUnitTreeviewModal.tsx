import { Box, useTheme } from '@mui/material';
import {
    IconButton,
    IntlMessage,
    LoadingSpinner,
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
import { useFetchOrgUnits } from '../../../registry/hooks/useGetOrgUnit';
import { OrgUnit } from '../../types/orgUnit';
import { OrgUnitLabel } from '../OrgUnitLabel';
import { OrgUnitTreeviewPicker } from './OrgUnitTreeviewPicker';
import { Settings, SettingsPopper } from './SettingsPopper';
import { SourceDescription } from './SourceDescription';
import { TreeViewLabel } from './TreeViewLabel';
import { MESSAGES } from './messages';
import { getChildrenData, getRootData, searchOrgUnits } from './requests';
import { DEFAULT_CONFIG, useSourceConfig } from './useSourceConfig';
import {
    formatInitialSelectedIds,
    formatInitialSelectedParents,
    getOrgUnitAncestors,
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
    const { fetchOrgUnit, isFetching: isFetchingOrgUnit } = useFetchOrgUnits();
    const [settings, setSettings] = useState<Settings>({
        displayTypes: true,
        statusSettings: DEFAULT_CONFIG,
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
    const { displayTypes, statusSettings } = settings;
    const { sourceSettings, isFetchingSource, sourceInfos } = useSourceConfig(
        source,
        version,
    );
    const getRootDataWithSource = useCallback(async () => {
        const key = version ? 'version' : 'source';
        const value = version || source;
        return getRootData(value, key, statusSettings);
    }, [source, version, statusSettings]);

    const searchOrgUnitsWithSource = useCallback(
        async (value, count) => {
            return searchOrgUnits({
                value,
                count,
                source,
                version,
                statusSettings,
            });
        },
        [source, version, statusSettings],
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

    useEffect(() => {
        if (sourceSettings && !isFetchingSource) {
            setSettings({
                ...settings,
                statusSettings: sourceSettings,
            });
        }
        // only update status settings if source settings are changed
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFetchingSource, sourceSettings]);

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
                        disabled={disabled || isFetchingSource}
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
            <Box position="relative">
                {isFetchingOrgUnit && <LoadingSpinner absolute />}
                <Box mt={1}>
                    <TreeViewWithSearch
                        getChildrenData={id =>
                            getChildrenData(id, statusSettings)
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
                        dependency={statusSettings}
                        childrenDependency={statusSettings}
                        fetchDetails={fetchOrgUnit}
                    />
                </Box>
            </Box>
            <Box
                sx={{
                    position: 'absolute',
                    width: '60%',
                    display: 'flex',
                    bottom: theme.spacing(2),
                    left: theme.spacing(3),
                }}
            >
                <SourceDescription sourceInfos={sourceInfos} />
            </Box>
        </ConfirmCancelDialogComponent>
    );
};

export { OrgUnitTreeviewModal };
