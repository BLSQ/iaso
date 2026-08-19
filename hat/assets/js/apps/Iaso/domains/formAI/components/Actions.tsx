import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { Autocomplete, Box, Button, TextField } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { baseUrls } from 'Iaso/constants/urls';
import { FormOption } from 'Iaso/domains/formAI';
import MESSAGES from 'Iaso/domains/formAI/messages';
import {
    FormsDropdownOptions,
    useGetFormsDropdownOptions,
} from 'Iaso/domains/forms/hooks/useGetFormsDropdownOptions';
import { SxStyles } from 'Iaso/types/general';
import { SaveVersionResponse } from '../types';
import { SaveFormDialog } from './SaveFormDialog';
export const ACTIONS_HEIGHT = 80;
export const ACTIONS_HEIGHT_MOBILE = 144;

const styles: SxStyles = {
    root: {
        height: {
            xs: ACTIONS_HEIGHT_MOBILE,
            lg: ACTIONS_HEIGHT,
        },
        borderBottom: theme => `1px solid ${theme.palette.divider}`,
        display: 'flex',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
        position: 'relative',
        zIndex: 1,
        width: '100%',
        justifyContent: 'space-between',
        flexDirection: {
            xs: 'column',
            lg: 'row',
        },
    },
    item: {
        padding: theme => theme.spacing(2),
        width: {
            xs: '100%',
            lg: '350px',
        },
    },
    itemRight: {
        borderTop: theme => ({
            xs: `1px solid ${theme.palette.lightGray.border}`,
            lg: 'none',
        }),
        padding: theme => theme.spacing(2),
    },
    buttonsContainer: {
        display: 'flex',
        gap: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: '100%',
    },
};
type Props = {
    formId: string;
    selectedFormOption?: FormOption;
    handleFormChange: (event: any, newValue: FormOption | null) => void;
    isLoadingForm: boolean;
    xlsformUuid: string | null;
    hasUnsavedChanges: boolean;
    selectedFormId: number;
    selectedFormName: string;
    handleSaveNewForm: (
        formId: number,
        formName: string,
        formOdkId: string,
    ) => void;
    handleSaveNewVersion: (result: SaveVersionResponse) => void;
};
export const Actions: FunctionComponent<Props> = ({
    formId,
    selectedFormOption,
    handleFormChange,
    isLoadingForm,
    xlsformUuid,
    hasUnsavedChanges,
    selectedFormId,
    selectedFormName,
    handleSaveNewForm,
    handleSaveNewVersion,
}) => {
    const { formatMessage } = useSafeIntl();
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const handleFormsDropdownSuccess = useCallback(
        (data: FormsDropdownOptions) => {
            if (formId && !selectedFormOption) {
                const form = data.find(f => f.value === parseInt(formId, 10));
                if (form) {
                    handleFormChange(null, {
                        id: form.value,
                        label: form.label,
                    });
                }
            }
        },
        [formId, selectedFormOption, handleFormChange],
    );

    const { data: forms, isLoading: isLoadingForms } =
        useGetFormsDropdownOptions({
            extraFields: ['form_id', 'latest_form_version'],
            onSuccess: handleFormsDropdownSuccess,
        });
    const formOptions: FormOption[] = useMemo(() => {
        return (
            forms
                ?.filter(
                    f => (f.original?.latest_form_version as any)?.xls_file,
                )
                .map(f => ({
                    id: f.value,
                    label: `${f.label} (${(f.original?.form_id as string) || 'no id'})`,
                })) ?? []
        );
    }, [forms]);
    return (
        <Box sx={styles.root}>
            <Box sx={styles.item}>
                <Autocomplete
                    size="small"
                    options={formOptions}
                    getOptionLabel={option => option.label}
                    value={selectedFormOption ?? null}
                    onChange={handleFormChange}
                    renderInput={props => (
                        <TextField
                            {...props}
                            label={formatMessage(MESSAGES.selectForm)}
                            variant="outlined"
                        />
                    )}
                    isOptionEqualToValue={(option, value) =>
                        option.id === value.id
                    }
                    loading={isLoadingForm || isLoadingForms}
                />
            </Box>
            <Box sx={styles.itemRight}>
                <Box sx={styles.buttonsContainer}>
                    {selectedFormOption && (
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<EditIcon />}
                            href={`/dashboard/${baseUrls.formDetail}/formId/${selectedFormOption.id}`}
                            target="_blank"
                        >
                            {formatMessage(MESSAGES.editProperties)}
                        </Button>
                    )}
                    {xlsformUuid && (
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<DownloadIcon />}
                            href={`/api/form_ai/download/${xlsformUuid}/`}
                            download={`${selectedFormName}.xlsx`}
                        >
                            {formatMessage(MESSAGES.downloadXlsForm)}
                        </Button>
                    )}
                    {xlsformUuid && hasUnsavedChanges && (
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={<SaveIcon />}
                            onClick={() => setSaveDialogOpen(true)}
                        >
                            {formatMessage(MESSAGES.saveForm)}
                        </Button>
                    )}
                </Box>
            </Box>
            {xlsformUuid && (
                <SaveFormDialog
                    open={saveDialogOpen}
                    onClose={() => setSaveDialogOpen(false)}
                    xlsformUuid={xlsformUuid}
                    selectedFormId={selectedFormId}
                    selectedFormName={selectedFormName}
                    onSaveNewForm={handleSaveNewForm}
                    onSaveNewVersion={handleSaveNewVersion}
                />
            )}
        </Box>
    );
};
