import { useSnackMutation } from 'Iaso/libs/apiHooks.ts';
import { postRequest } from 'Iaso/libs/Api';

export const useCreateExportMobileSetup = () =>
    useSnackMutation(
        body => postRequest('/api/tasks/create/exportmobilesetup/', body),
        undefined,
        undefined,
        ['profiles'],
    );
