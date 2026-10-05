import { iasoFetch } from '../../../../libs/Api';
import { FormVersionDiff, previewFormVersion } from '../../../forms/requests';

// The diff the generated XLSForm would introduce as a new version of the form, as on a regular upload
export const previewFormAIVersion = async (
    formId: number,
    xlsformUuid: string,
): Promise<FormVersionDiff> => {
    const response = await iasoFetch(`/api/form_ai/download/${xlsformUuid}/`);
    const xlsFile = new File([await response.blob()], 'form.xlsx');
    return previewFormVersion({
        data: { form_id: formId },
        xls_file: xlsFile,
    });
};
