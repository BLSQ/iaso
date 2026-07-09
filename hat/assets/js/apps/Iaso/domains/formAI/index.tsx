import React, { FunctionComponent, useCallback, useState } from 'react';
import { Grid } from '@mui/material';
import {
    LoadingSpinner,
    useRedirectToReplace,
    useSafeIntl,
} from 'bluesquare-components';
import { MainWrapper } from 'Iaso/components/MainWrapper';
import TopBar from '../../components/nav/TopBarComponent';
import { baseUrls } from '../../constants/urls';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { Actions } from './components/Actions';
import { ChatPanel } from './components/ChatPanel';
import { FormPreview } from './components/FormPreview';
import { useLoadForm } from './hooks/requests/useLoadForm';
import { useSendMessage } from './hooks/requests/useSendMessage';
import MESSAGES from './messages';
import { ConversationEntry, SaveVersionResponse } from './types';

type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
};

export type FormOption = {
    id: number;
    label: string;
};

const FormAI: FunctionComponent = () => {
    const params = useParamsObject(baseUrls.formAI);
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
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const { mutate: sendMessage, isLoading: isLoadingSendMessage } =
        useSendMessage();

    const { mutate: loadForm, isLoading: isLoadingForm } = useLoadForm();
    const redirectToReplace = useRedirectToReplace();

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
                        {
                            role: 'assistant',
                            content: displayMsg,
                            id: crypto.randomUUID(),
                        },
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
        setMessages(prev => [
            ...prev,
            { role: 'assistant', content: msg, id: crypto.randomUUID() },
        ]);
    }, []);

    const handleSaveNewForm = useCallback(
        (formId: number, formName: string, formOdkId: string) => {
            setSelectedFormId(formId);
            setSelectedFormName(formName);
            setSelectedFormOdkId(formOdkId || undefined);
            setSelectedFormOption({ id: formId, label: formName });
            setHasUnsavedChanges(false);
            const msg = `Created form "${formName}"`;
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: msg, id: crypto.randomUUID() },
            ]);
        },
        [],
    );

    const handleSendMessage = useCallback(
        (message: string) => {
            setMessages(prev => [
                ...prev,
                { role: 'user', content: message, id: crypto.randomUUID() },
            ]);
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
                                id: crypto.randomUUID(),
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
                                id: crypto.randomUUID(),
                            },
                        ]);
                    },
                },
            );
        },
        [conversationHistory, selectedFormOdkId, sendMessage, formatMessage],
    );

    const handleFormChange = useCallback(
        (_event: any, newValue: FormOption | null) => {
            redirectToReplace(baseUrls.formAI, {
                formId: newValue?.id?.toString() ?? '',
            });
            setSelectedFormOption(newValue ?? undefined);
            if (newValue) {
                handleLoadForm(newValue.id);
            }
        },
        [handleLoadForm, redirectToReplace],
    );

    return (
        <>
            <TopBar title={formatMessage(MESSAGES.title)} />
            <MainWrapper
                sx={{
                    paddingBottom: 0,
                }}
            >
                {isLoadingForm && <LoadingSpinner />}
                <Grid
                    container
                    spacing={0}
                    sx={{
                        height: '100%',
                    }}
                >
                    <Grid item xs={4}>
                        <ChatPanel
                            messages={messages}
                            isLoading={isLoadingSendMessage || isLoadingForm}
                            onSendMessage={handleSendMessage}
                        />
                    </Grid>
                    <Grid item xs={8}>
                        <Actions
                            formId={params.formId}
                            selectedFormOption={selectedFormOption}
                            handleFormChange={handleFormChange}
                            isLoadingForm={isLoadingForm}
                            xlsformUuid={xlsformUuid ?? null}
                            hasUnsavedChanges={hasUnsavedChanges}
                            selectedFormId={selectedFormId ?? 0}
                            selectedFormName={selectedFormName ?? ''}
                            handleSaveNewForm={handleSaveNewForm}
                            handleSaveNewVersion={handleSaveNewVersion}
                        />
                        <FormPreview xformXml={xformXml ?? null} />
                    </Grid>
                </Grid>
            </MainWrapper>
        </>
    );
};

export default FormAI;
