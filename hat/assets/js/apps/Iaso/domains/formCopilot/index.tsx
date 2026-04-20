import React, { FunctionComponent, useCallback, useState } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { Autocomplete, Box, Button, TextField } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import TopBar from '../../components/nav/TopBarComponent';
import { baseUrls } from '../../constants/urls';
import { useGetFormsDropdownOptions } from '../forms/hooks/useGetFormsDropdownOptions';
import { ChatPanel } from './components/ChatPanel';
import { FormPreview } from './components/FormPreview';
import { SaveFormDialog } from './components/SaveFormDialog';
import { useLoadForm } from './hooks/requests/useLoadForm';
import { useSendMessage } from './hooks/requests/useSendMessage';
import MESSAGES from './messages';
import { ConversationEntry, SaveVersionResponse } from './types';

const styles: SxStyles = {
    container: {
        width: '100%',
        height: 'calc(100vh - 65px)',
        display: 'flex',
        padding: 0,
        overflow: 'hidden',
    },
    chatSide: {
        width: '40%',
        height: '100%',
        padding: '8px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
    },
    previewSide: {
        width: '60%',
        height: '100%',
        padding: '8px',
        boxSizing: 'border-box',
    },
    toolbar: {
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        padding: '8px',
        flexShrink: 0,
    },
    chatArea: {
        flex: 1,
        overflow: 'hidden',
    },
    saveButton: {
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 1000,
    },
    formDropdown: { flex: 1 },
};

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

type FormOption = {
    id: number;
    label: string;
};

const FormCopilot: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversationHistory, setConversationHistory] = useState<
        ConversationEntry[]
    >([]);
    const [xformXml, setXformXml] = useState<string | undefined>(undefined);
    const [xlsformUuid, setXlsformUuid] = useState<string | undefined>(
        undefined,
    );
    const [selectedFormId, setSelectedFormId] = useState<number | undefined>(
        undefined,
    );
    const [selectedFormName, setSelectedFormName] = useState<
        string | undefined
    >(undefined);
    const [selectedFormOdkId, setSelectedFormOdkId] = useState<
        string | undefined
    >(undefined);
    const [selectedFormOption, setSelectedFormOption] = useState<
        FormOption | undefined
    >(undefined);
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const { mutate: sendMessage, isLoading } = useSendMessage();
    const { data: forms } = useGetFormsDropdownOptions({
        extraFields: ['form_id', 'latest_form_version'],
    });
    const { mutate: loadForm, isLoading: isLoadingForm } = useLoadForm();

    const formOptions: FormOption[] =
        forms
            ?.filter(f => (f.original?.latest_form_version as any)?.xls_file)
            .map(f => ({
                id: f.value,
                label: `${f.label} (${(f.original?.form_id as string) || 'no id'})`,
            })) ?? [];

    const handleLoadForm = useCallback(
        (formId: number) => {
            loadForm(formId, {
                onSuccess: data => {
                    setSelectedFormId(data.form_id);
                    setSelectedFormName(data.form_name);
                    setSelectedFormOdkId(data.form_odk_id);
                    setHasUnsavedChanges(false);
                    if (data.xform_xml) {
                        setXformXml(data.xform_xml);
                    }
                    const formJson = JSON.stringify(data.xlsform_data, null, 2);
                    const displayMsg =
                        `Form "${data.form_name}"` +
                        ` (version ${data.version_id})` +
                        ` loaded. You can now ask me to modify it.`;

                    setMessages(prev => [
                        ...prev,
                        { role: 'assistant', content: displayMsg },
                    ]);

                    const userCtx =
                        `I'm loading an existing form` +
                        ` called "${data.form_name}"` +
                        ` (ODK form_id: "${data.form_odk_id}",` +
                        ` version: "${data.version_id}").` +
                        ` Here is its current XLSForm structure in JSON:` +
                        `\n\n${formJson}\n\n` +
                        `Please remember this form structure. When I ask you to` +
                        ` modify it, return the COMPLETE updated form in the` +
                        ` standard JSON format.`;
                    const assistantCtx =
                        `I've loaded the form "${data.form_name}"` +
                        ` (version ${data.version_id}).` +
                        ` I can see its complete structure with all questions,` +
                        ` choices, and settings. What changes would you like me` +
                        ` to make?`;
                    setConversationHistory(prev => [
                        ...prev,
                        { role: 'user', content: userCtx },
                        { role: 'assistant', content: assistantCtx },
                    ]);
                },
            });
        },
        [loadForm],
    );

    const handleSaveNewVersion = useCallback((result: SaveVersionResponse) => {
        setHasUnsavedChanges(false);
        const msg = `Saved as version ${result.version_id}`;
        setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
    }, []);

    const handleSaveNewForm = useCallback(
        (formId: number, formName: string, formOdkId: string) => {
            setSelectedFormId(formId);
            setSelectedFormName(formName);
            setSelectedFormOdkId(formOdkId || undefined);
            setSelectedFormOption({ id: formId, label: formName });
            setHasUnsavedChanges(false);
            const msg = `Created form "${formName}"`;
            setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
        },
        [],
    );

    const handleSendMessage = useCallback(
        (message: string) => {
            setMessages(prev => [...prev, { role: 'user', content: message }]);

            sendMessage(
                {
                    message,
                    conversation_history: conversationHistory,
                    existing_form_odk_id: selectedFormOdkId,
                },
                {
                    onSuccess: data => {
                        setMessages(prev => [
                            ...prev,
                            {
                                role: 'assistant',
                                content: data.assistant_message,
                            },
                        ]);
                        if (data.conversation_history) {
                            setConversationHistory(data.conversation_history);
                        }
                        if (data.xform_xml) {
                            setXformXml(data.xform_xml);
                            setHasUnsavedChanges(true);
                        }
                        if (data.xlsform_uuid) {
                            setXlsformUuid(data.xlsform_uuid);
                        }
                    },
                    onError: () => {
                        setMessages(prev => [
                            ...prev,
                            {
                                role: 'assistant',
                                content: formatMessage(
                                    MESSAGES.errorGenerating,
                                ),
                            },
                        ]);
                    },
                },
            );
        },
        [conversationHistory, selectedFormOdkId, sendMessage, formatMessage],
    );

    return (
        <>
            <TopBar title={formatMessage(MESSAGES.title)} />
            <Box sx={styles.container}>
                <Box sx={styles.chatSide}>
                    <Box sx={styles.toolbar}>
                        <Autocomplete
                            size="small"
                            options={formOptions}
                            getOptionLabel={option => option.label}
                            value={selectedFormOption ?? null}
                            onChange={(_event, newValue) => {
                                setSelectedFormOption(newValue ?? undefined);
                                if (newValue) {
                                    handleLoadForm(newValue.id);
                                }
                            }}
                            renderInput={params => (
                                <TextField
                                    {...params}
                                    label={formatMessage(MESSAGES.selectForm)}
                                    variant="outlined"
                                />
                            )}
                            sx={styles.formDropdown}
                            isOptionEqualToValue={(option, value) =>
                                option.id === value.id
                            }
                            loading={isLoadingForm}
                        />
                        {selectedFormId && (
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={<EditIcon />}
                                href={`/dashboard/${baseUrls.formDetail}/formId/${selectedFormId}`}
                                target="_blank"
                            >
                                {formatMessage(MESSAGES.editProperties)}
                            </Button>
                        )}
                    </Box>
                    <Box sx={styles.chatArea}>
                        <ChatPanel
                            messages={messages}
                            isLoading={isLoading || isLoadingForm}
                            onSendMessage={handleSendMessage}
                        />
                    </Box>
                </Box>
                <Box sx={styles.previewSide}>
                    <FormPreview
                        xlsformUuid={xlsformUuid ?? null}
                        xformXml={xformXml ?? null}
                    />
                </Box>
            </Box>
            {xlsformUuid && hasUnsavedChanges && (
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={() => setSaveDialogOpen(true)}
                    sx={styles.saveButton}
                >
                    {formatMessage(MESSAGES.saveForm)}
                </Button>
            )}
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
        </>
    );
};

export default FormCopilot;
