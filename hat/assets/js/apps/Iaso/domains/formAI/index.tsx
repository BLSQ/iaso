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
                    const formJson = JSON.stringify(data.xlsform_data);
                    const displayMsg = formatMessage(MESSAGES.formLoaded, {
                        formName: data.form_name,
                        versionId: data.version_id,
                    });

                    setMessages(prev => [
                        ...prev,
                        {
                            role: 'assistant',
                            content: displayMsg,
                            id: crypto.randomUUID(),
                        },
                    ]);

                    const userCtx = formatMessage(
                        MESSAGES.loadFormUserContext,
                        {
                            formName: data.form_name,
                            formOdkId: data.form_odk_id,
                            versionId: data.version_id,
                            formJson,
                        },
                    );
                    const assistantCtx = formatMessage(
                        MESSAGES.loadFormAssistantContext,
                        {
                            formName: data.form_name,
                            versionId: data.version_id,
                        },
                    );
                    setConversationHistory(prev => [
                        ...prev,
                        { role: 'user', content: userCtx },
                        { role: 'assistant', content: assistantCtx },
                    ]);
                },
            });
        },
        [loadForm, formatMessage],
    );

    const handleSaveNewVersion = useCallback(
        (result: SaveVersionResponse) => {
            setHasUnsavedChanges(false);
            const msg = formatMessage(MESSAGES.versionSavedAs, {
                versionId: result.version_id,
            });
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: msg, id: crypto.randomUUID() },
            ]);
        },
        [formatMessage],
    );

    const handleSaveNewForm = useCallback(
        (formId: number, formName: string, formOdkId: string) => {
            setSelectedFormId(formId);
            setSelectedFormName(formName);
            setSelectedFormOdkId(formOdkId || undefined);
            setSelectedFormOption({ id: formId, label: formName });
            setHasUnsavedChanges(false);
            const msg = formatMessage(MESSAGES.formCreated, { formName });
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: msg, id: crypto.randomUUID() },
            ]);
        },
        [formatMessage],
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
