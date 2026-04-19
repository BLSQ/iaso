import React, { FunctionComponent, useCallback, useState } from 'react';
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
import { useGetProjectsDropdownOptions } from '../../../domains/projects/hooks/requests';
import { useSaveFormVersion } from '../hooks/useLoadForm';
import { useCreateForm } from '../hooks/useSaveNewForm';
import MESSAGES from '../messages';

type SaveResult = {
    formId: number;
    formName: string;
    formOdkId: string;
    message: string;
};

type Props = {
    open: boolean;
    onClose: () => void;
    xlsformUuid: string;
    selectedFormId: number | null;
    selectedFormName: string | null;
    onSaveNewForm: (result: SaveResult) => void;
    onSaveNewVersion: (message: string) => void;
};

export const SaveFormDialog: FunctionComponent<Props> = ({
    open,
    onClose,
    xlsformUuid,
    selectedFormId,
    selectedFormName,
    onSaveNewForm,
    onSaveNewVersion,
}) => {
    const { formatMessage } = useSafeIntl();
    const [tab, setTab] = useState(selectedFormId ? 0 : 1);
    const [formName, setFormName] = useState('');
    const [formOdkId, setFormOdkId] = useState('');
    const [selectedProjects, setSelectedProjects] = useState<
        { value: number; label: string }[]
    >([]);

    const { data: projectOptions } = useGetProjectsDropdownOptions();
    const { mutateAsync: createForm, isLoading: isCreating } = useCreateForm();
    const { mutateAsync: saveVersion, isLoading: isSavingVersion } =
        useSaveFormVersion();

    const isSaving = isCreating || isSavingVersion;

    // Reset tab when dialog opens based on whether a form is selected
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
            onSaveNewVersion(result.message);
            onClose();
        } catch (err: any) {
            const detail =
                err?.details?.error || err?.message || 'Unknown error';
            onSaveNewVersion(`Failed to save version: ${detail}`);
        }
    }, [selectedFormId, xlsformUuid, saveVersion, onSaveNewVersion, onClose]);

    const handleSaveNewForm = useCallback(async () => {
        if (!formName.trim() || selectedProjects.length === 0) return;

        try {
            const newForm = await createForm({
                name: formName.trim(),
                project_ids: selectedProjects.map(p => p.value),
                org_unit_type_ids: [],
                periods_before_allowed: 0,
                periods_after_allowed: 0,
                single_per_period: false,
            });

            const versionResult = await saveVersion({
                formId: newForm.id,
                xlsformUuid,
                formOdkId: formOdkId.trim() || undefined,
            });

            const msg =
                `Created form "${formName.trim()}"` +
                ` with version ${versionResult.version_id}`;
            onSaveNewForm({
                formId: newForm.id,
                formName: formName.trim(),
                formOdkId: formOdkId.trim(),
                message: msg,
            });
            onClose();
            setFormName('');
            setFormOdkId('');
            setSelectedProjects([]);
        } catch (err: any) {
            const detail =
                err?.details?.error || err?.message || 'Unknown error';

            console.error('Save new form error:', err);
            onSaveNewForm({
                formId: 0,
                formName: '',
                formOdkId: '',
                message: `Failed to create form: ${detail}`,
            });
        }
    }, [
        formName,
        selectedProjects,
        xlsformUuid,
        createForm,
        saveVersion,
        onSaveNewForm,
        onClose,
    ]);

    const canSaveNewForm =
        formName.trim().length > 0 && selectedProjects.length > 0 && !isSaving;

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
                    sx={{ mb: 2 }}
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
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            pt: 1,
                        }}
                    >
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
                                setFormOdkId(
                                    e.target.value
                                        .toLowerCase()
                                        .replace(/[^a-z0-9_]/g, '_'),
                                )
                            }
                            fullWidth
                            helperText={formatMessage(MESSAGES.formOdkIdHelp)}
                        />
                        <Autocomplete
                            multiple
                            options={projectOptions ?? []}
                            getOptionLabel={(option: any) => option.label ?? ''}
                            value={selectedProjects}
                            onChange={(_event, newValue) =>
                                setSelectedProjects(newValue as any)
                            }
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
                        disabled={!canSaveNewForm}
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
