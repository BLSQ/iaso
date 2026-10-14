import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useState,
} from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Tab,
    Tabs,
    TextField,
    Typography,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import { useGetGroupDropdown } from '../../../domains/orgUnits/hooks/requests/useGetGroups';
import { useGetOrgUnitTypesDropdownOptions } from '../../../domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import { useGetProjectsDropdownOptions } from '../../../domains/projects/hooks/requests';
import { useCreateForm } from '../hooks/requests/useCreateForm';
import { useSaveFormVersion } from '../hooks/requests/useSaveFormVersion';
import MESSAGES from '../messages';
import { SaveVersionResponse } from '../types';

const sanitizeOdkId = (value: string): string =>
    value.toLowerCase().replace(/[^a-z0-9_]/g, '_');

const canSaveNewForm = (
    formName: string,
    selectedProjects: unknown[],
    selectedOrgUnitTypes: unknown[],
    selectedOrgUnitGroups: unknown[],
): boolean =>
    formName.trim().length > 0 &&
    selectedProjects.length > 0 &&
    (selectedOrgUnitTypes.length > 0 || selectedOrgUnitGroups.length > 0);

const options = <T extends { value: unknown }>(
    current: T[],
    options: { value: unknown }[],
): T[] => {
    const values = new Set(options.map(option => option.value));
    const filtered = current.filter(option => values.has(option.value));
    return filtered.length === current.length ? current : filtered;
};

const styles: SxStyles = {
    newFormFields: {
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        pt: 1,
    },
    tabs: { mb: 2 },
};

type Props = {
    open: boolean;
    onClose: () => void;
    xlsformUuid: string;
    selectedFormId: number | undefined;
    selectedFormName: string | undefined;
    onSaveNewVersion: (result: SaveVersionResponse) => void;
    onSaveNewForm: (
        formId: number,
        formName: string,
        formOdkId: string,
    ) => void;
};

export const SaveFormDialog: FunctionComponent<Props> = ({
    open,
    onClose,
    xlsformUuid,
    selectedFormId,
    selectedFormName,
    onSaveNewVersion,
    onSaveNewForm,
}) => {
    const { formatMessage } = useSafeIntl();
    const [tab, setTab] = useState<number>(selectedFormId ? 0 : 1);
    const [formName, setFormName] = useState('');
    const [formOdkId, setFormOdkId] = useState('');
    const [selectedProjects, setSelectedProjects] = useState<
        { value: number; label: string }[]
    >([]);
    const [selectedOrgUnitTypes, setSelectedOrgUnitTypes] = useState<
        { value: string; label: string }[]
    >([]);
    const [selectedOrgUnitGroups, setSelectedOrgUnitGroups] = useState<
        { value: number; label: string }[]
    >([]);

    const { data: projectOptions } = useGetProjectsDropdownOptions();
    const selectedProjectIds = selectedProjects.map(p => p.value);
    const { data: orgUnitTypeOptions, isFetching: isFetchingOrgUnitTypes } =
        useGetOrgUnitTypesDropdownOptions({
            projectIds: selectedProjectIds,
            enabled: selectedProjectIds.length > 0,
        });

    useEffect(() => {
        if (isFetchingOrgUnitTypes || !orgUnitTypeOptions) return;
        setSelectedOrgUnitTypes(current =>
            options(current, orgUnitTypeOptions),
        );
    }, [orgUnitTypeOptions, isFetchingOrgUnitTypes]);

    const { data: orgUnitGroupOptions, isFetching: isFetchingOrgUnitGroups } =
        useGetGroupDropdown(
            { projectIds: selectedProjectIds.join(',') },
            selectedProjectIds.length > 0,
        );

    useEffect(() => {
        if (isFetchingOrgUnitGroups || !orgUnitGroupOptions) return;
        setSelectedOrgUnitGroups(current =>
            options(current, orgUnitGroupOptions),
        );
    }, [orgUnitGroupOptions, isFetchingOrgUnitGroups]);

    const { mutateAsync: createForm, isLoading: isCreating } = useCreateForm();
    const { mutateAsync: saveVersion, isLoading: isSavingVersion } =
        useSaveFormVersion();

    const isSaving = isCreating || isSavingVersion;

    const handleEnter = useCallback(() => {
        setTab(selectedFormId ? 0 : 1);
    }, [selectedFormId]);

    const handleSaveNewVersion = useCallback(async () => {
        if (!selectedFormId) return;
        try {
            const result = await saveVersion({
                formId: selectedFormId,
                xlsformUuid,
            });
            onSaveNewVersion(result);
            onClose();
        } catch {
            // error already displayed by useSnackMutation
        }
    }, [selectedFormId, xlsformUuid, saveVersion, onSaveNewVersion, onClose]);

    const handleSaveNewForm = useCallback(async () => {
        if (
            !canSaveNewForm(
                formName,
                selectedProjects,
                selectedOrgUnitTypes,
                selectedOrgUnitGroups,
            )
        )
            return;
        try {
            const newForm = await createForm({
                name: formName.trim(),
                project_ids: selectedProjects.map(p => p.value),
                org_unit_type_ids: selectedOrgUnitTypes.map(orgUnitType =>
                    Number(orgUnitType.value),
                ),
                org_unit_group_ids: selectedOrgUnitGroups.map(
                    orgUnitGroup => orgUnitGroup.value,
                ),
                periods_before_allowed: 0,
                periods_after_allowed: 0,
                single_per_period: false,
            });
            await saveVersion({
                formId: newForm.id,
                xlsformUuid,
                formOdkId: formOdkId.trim() || undefined,
            });
            onSaveNewForm(newForm.id, formName.trim(), formOdkId.trim());
            onClose();
            setFormName('');
            setFormOdkId('');
            setSelectedProjects([]);
            setSelectedOrgUnitTypes([]);
            setSelectedOrgUnitGroups([]);
        } catch {
            // error already displayed by useSnackMutation
        }
    }, [
        formName,
        selectedProjects,
        selectedOrgUnitTypes,
        selectedOrgUnitGroups,
        xlsformUuid,
        formOdkId,
        createForm,
        saveVersion,
        onSaveNewForm,
        onClose,
    ]);

    const isNewFormSaveEnabled =
        canSaveNewForm(
            formName,
            selectedProjects,
            selectedOrgUnitTypes,
            selectedOrgUnitGroups,
        ) && !isSaving;
    const isOrgUnitTypeOrGroupMissing =
        selectedOrgUnitTypes.length === 0 && selectedOrgUnitGroups.length === 0;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            TransitionProps={{ onEnter: handleEnter }}
        >
            <DialogTitle>{formatMessage(MESSAGES.saveForm)}</DialogTitle>
            <DialogContent>
                <Tabs
                    value={tab}
                    onChange={(_e, v) => setTab(v)}
                    sx={styles.tabs}
                >
                    <Tab
                        label={formatMessage(MESSAGES.saveAsNewVersion)}
                        disabled={!selectedFormId}
                    />
                    <Tab label={formatMessage(MESSAGES.saveAsNewForm)} />
                </Tabs>

                {tab === 0 && selectedFormId && (
                    <Typography>
                        {formatMessage(MESSAGES.saveNewVersionOf)}{' '}
                        <strong>{selectedFormName}</strong>
                    </Typography>
                )}

                {tab === 1 && (
                    <Box sx={styles.newFormFields}>
                        <TextField
                            label={formatMessage(MESSAGES.formName)}
                            value={formName}
                            onChange={e => setFormName(e.target.value)}
                            fullWidth
                            required
                        />
                        <TextField
                            label={formatMessage(MESSAGES.formOdkId)}
                            value={formOdkId}
                            onChange={e =>
                                setFormOdkId(sanitizeOdkId(e.target.value))
                            }
                            fullWidth
                            helperText={formatMessage(MESSAGES.formOdkIdHelp)}
                        />
                        <Autocomplete
                            multiple
                            options={projectOptions ?? []}
                            getOptionLabel={(option: any) => option.label ?? ''}
                            value={selectedProjects}
                            onChange={(_event, newValue) => {
                                setSelectedProjects(newValue as any);
                                if (newValue.length === 0) {
                                    setSelectedOrgUnitTypes([]);
                                    setSelectedOrgUnitGroups([]);
                                }
                            }}
                            renderInput={params => (
                                <TextField
                                    {...params}
                                    label={formatMessage(MESSAGES.projects)}
                                    required
                                />
                            )}
                            isOptionEqualToValue={(option: any, value: any) =>
                                option.value === value.value
                            }
                        />
                        <Autocomplete
                            multiple
                            options={orgUnitTypeOptions ?? []}
                            getOptionLabel={(option: any) => option.label ?? ''}
                            value={selectedOrgUnitTypes}
                            onChange={(_event, newValue) =>
                                setSelectedOrgUnitTypes(newValue as any)
                            }
                            loading={isFetchingOrgUnitTypes}
                            disabled={selectedProjects.length === 0}
                            renderInput={params => (
                                <TextField
                                    {...params}
                                    label={formatMessage(MESSAGES.orgUnitTypes)}
                                    required={isOrgUnitTypeOrGroupMissing}
                                />
                            )}
                            isOptionEqualToValue={(option: any, value: any) =>
                                option.value === value.value
                            }
                        />
                        <Autocomplete
                            multiple
                            options={orgUnitGroupOptions ?? []}
                            getOptionLabel={(option: any) => option.label ?? ''}
                            value={selectedOrgUnitGroups}
                            onChange={(_event, newValue) =>
                                setSelectedOrgUnitGroups(newValue as any)
                            }
                            loading={isFetchingOrgUnitGroups}
                            disabled={selectedProjects.length === 0}
                            renderInput={params => (
                                <TextField
                                    {...params}
                                    label={formatMessage(
                                        MESSAGES.orgUnitGroups,
                                    )}
                                    required={isOrgUnitTypeOrGroupMissing}
                                />
                            )}
                            isOptionEqualToValue={(option: any, value: any) =>
                                option.value === value.value
                            }
                        />
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={isSaving}>
                    {formatMessage(MESSAGES.cancel)}
                </Button>
                {tab === 0 && (
                    <Button
                        onClick={handleSaveNewVersion}
                        variant="contained"
                        disabled={!selectedFormId || isSaving}
                        startIcon={
                            isSaving ? (
                                <CircularProgress size={16} />
                            ) : undefined
                        }
                    >
                        {formatMessage(MESSAGES.save)}
                    </Button>
                )}
                {tab === 1 && (
                    <Button
                        onClick={handleSaveNewForm}
                        variant="contained"
                        disabled={!isNewFormSaveEnabled}
                        startIcon={
                            isSaving ? (
                                <CircularProgress size={16} />
                            ) : undefined
                        }
                    >
                        {formatMessage(MESSAGES.save)}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};
