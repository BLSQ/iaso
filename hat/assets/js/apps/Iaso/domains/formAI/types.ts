export type ConversationEntry = {
    role: 'user' | 'assistant';
    content: string;
};

export type FormAIRequest = {
    message: string;
    conversation_history: ConversationEntry[];
    existing_form_odk_id?: string | null;
};

export type FormAIResponse = {
    assistant_message: string;
    xlsform_uuid: string | null;
    xform_xml: string | null;
    conversation_history: ConversationEntry[];
};

export type LoadFormResponse = {
    form_id: number;
    form_name: string;
    form_odk_id: string;
    version_id: string;
    xlsform_data: {
        survey: Record<string, string>[];
        choices: Record<string, string>[];
        settings: Record<string, string>;
    };
    xform_xml: string | null;
};

export type SaveVersionResponse = {
    id: number;
    version_id: string;
    form_id: number;
    form_name: string;
};

export type CreateFormPayload = {
    name: string;
    project_ids: number[];
    org_unit_type_ids: number[];
    periods_before_allowed: number;
    periods_after_allowed: number;
    single_per_period: boolean;
};

export type CreateFormResponse = {
    id: number;
    name: string;
};
