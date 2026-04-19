import React, { FunctionComponent, useCallback, useState } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { Autocomplete, Box, Button, TextField } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useSafeIntl } from 'bluesquare-components';
import TopBar from '../../components/nav/TopBarComponent';
import { baseUrls } from '../../constants/urls';
import { ChatPanel } from './components/ChatPanel';
import { FormPreview } from './components/FormPreview';
import { SaveFormDialog } from './components/SaveFormDialog';
import { useGetFormsList } from './hooks/requests/useGetFormsList';
import { useLoadForm } from './hooks/requests/useLoadForm';
import { useSendMessage } from './hooks/requests/useSendMessage';
import MESSAGES from './messages';
import { ConversationEntry, SaveVersionResponse } from './types';

const useStyles = makeStyles(() => ({
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
        flexDirection: 'column' as const,
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
}));

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

type FormOption = {
    id: number;
    name: string;
    label: string;
};

const FormCopilot: FunctionComponent = () => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversationHistory, setConversationHistory] = useState<
        ConversationEntry[]
    >([]);
    const [xformXml, setXformXml] = useState<string | null>(null);
    const [xlsformUuid, setXlsformUuid] = useState<string | null>(null);
    const [selectedFormId, setSelectedFormId] = useState<number | null>(null);
    const [selectedFormName, setSelectedFormName] = useState<string | null>(
        null,
    );
    const [selectedFormOdkId, setSelectedFormOdkId] = useState<string | null>(
        null,
    );
    const [selectedFormOption, setSelectedFormOption] =
        useState<FormOption | null>(null);
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const { mutate: sendMessage, isLoading } = useSendMessage();
    const { data: formsData } = useGetFormsList();
    const { mutate: loadForm, isLoading: isLoadingForm } = useLoadForm();

    const formOptions: FormOption[] =
        formsData?.forms
            ?.filter(f => f.latest_form_version?.xls_file)
            .map(f => ({
                id: f.id,
                name: f.name,
                label: `${f.name} (${f.form_id || 'no id'})`,
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
            setSelectedFormOdkId(formOdkId || null);
            setSelectedFormOption({
                id: formId,
                name: formName,
                label: formName,
            });
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
            <Box className={classes.container}>
                <Box className={classes.chatSide}>
                    <Box className={classes.toolbar}>
                        <Autocomplete
                            size="small"
                            options={formOptions}
                            getOptionLabel={option => option.label}
                            value={selectedFormOption}
                            onChange={(_event, newValue) => {
                                setSelectedFormOption(newValue);
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
                            sx={{ flex: 1 }}
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
                    <Box sx={{ flex: 1, overflow: 'hidden' }}>
                        <ChatPanel
                            messages={messages}
                            isLoading={isLoading || isLoadingForm}
                            onSendMessage={handleSendMessage}
                        />
                    </Box>
                </Box>
                <Box className={classes.previewSide}>
                    <FormPreview
                        xlsformUuid={xlsformUuid}
                        xformXml={xformXml}
                    />
                </Box>
            </Box>
            {xlsformUuid && hasUnsavedChanges && (
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={() => setSaveDialogOpen(true)}
                    sx={{
                        position: 'fixed',
                        bottom: 16,
                        right: 16,
                        zIndex: 1000,
                    }}
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
