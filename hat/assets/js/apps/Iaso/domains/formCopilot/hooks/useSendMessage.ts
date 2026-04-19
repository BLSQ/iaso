import { useMutation } from 'react-query';
import { postRequest } from '../../../libs/Api';

type ConversationEntry = {
    role: 'user' | 'assistant';
    content: string;
};

type FormCopilotRequest = {
    message: string;
    conversation_history: ConversationEntry[];
    existing_form_odk_id?: string | null;
};

type FormCopilotResponse = {
    assistant_message: string;
    xlsform_uuid: string | null;
    xform_xml: string | null;
    conversation_history: ConversationEntry[];
};

export const useSendMessage = () => {
    return useMutation<FormCopilotResponse, Error, FormCopilotRequest>(
        (data: FormCopilotRequest) => postRequest('/api/form_copilot/', data),
    );
};
