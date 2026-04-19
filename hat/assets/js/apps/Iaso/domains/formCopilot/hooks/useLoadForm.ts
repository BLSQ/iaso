import { useMutation } from 'react-query';
import { getRequest, postRequest } from '../../../libs/Api';

type LoadFormResponse = {
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

type SaveVersionResponse = {
    id: number;
    version_id: string;
    form_id: number;
    form_name: string;
    message: string;
};

export const useLoadForm = () => {
    return useMutation<LoadFormResponse, Error, number>((formId: number) =>
        getRequest(`/api/form_copilot/load/${formId}/`),
    );
};

export const useSaveFormVersion = () => {
    return useMutation<
        SaveVersionResponse,
        Error,
        { formId: number; xlsformUuid: string; formOdkId?: string }
    >(async ({ formId, xlsformUuid, formOdkId }) => {
        const result = await postRequest('/api/form_copilot/save/', {
            form_id: formId,
            xlsform_uuid: xlsformUuid,
            ...(formOdkId ? { form_odk_id: formOdkId } : {}),
        });
        return {
            id: result.id,
            version_id: result.version_id,
            form_id: result.form_id,
            form_name: result.form_name,
            message: `Saved as version ${result.version_id}`,
        };
    });
};
