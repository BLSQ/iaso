import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { waitFor } from 'Iaso/utils';
import { API_URL } from '../../validationWorkflow/constants';

const getSubmissionValidationStatus = async (id: number) => {
    await waitFor(1000);
    // return {
    //     validationStatus: 'APPROVED',
    //     rejectionComment: null,
    //     slug: 'dat_workflow',
    //     userRoles: [{ label: 'Data manager', value: 7 }],
    //     history: [
    //         {
    //             level: 'District',
    //             color: '#FFF000',
    //             created_at: 1025.13,
    //             updated_at: 1025.123,
    //             status: 'ACCEPTED',
    //             comment: 'LGTM',
    //             updated_by: 'George Michael',
    //             created_by: 'Gregory House',
    //         },
    //         {
    //             level: 'Aire de santé',
    //             color: '#000FFF',
    //             created_at: 1024.123,
    //             updated_at: 1024.123,
    //             status: 'ACCEPTED',
    //             comment: 'LGTM',
    //             updated_by: 'George Michael',
    //             created_by: 'Gregory House',
    //         },
    //     ],
    //     nextTasks: [
    //         {
    //             id: 5,
    //             name: 'next',
    //             userRoles: [
    //                 {
    //                     id: 7,
    //                     name: 'Data manager',
    //                 },
    //             ],
    //         },
    //     ],
    //     nextBypass: [
    //         {
    //             slug: 'last',
    //             name: 'last',
    //             userRoles: [
    //                 {
    //                     id: 8,
    //                     name: 'test',
    //                 },
    //             ],
    //         },
    //     ],
    // };
    return getRequest(`/api/validation-workflows/instance/${id}/`);
};

export const useGetSubmissionValidationStatus = (id?: number) => {
    return useSnackQuery({
        queryKey: ['submission-validation-status', id],
        queryFn: () => getSubmissionValidationStatus(id),
        options: {
            staleTime: Infinity,
            cacheTime: Infinity,
            retry: false,
            keepPreviousData: true,
            enabled: Boolean(id),
        },
    });
};

const getNodes = (workflowSlug?: string) => {
    // return {
    //     validationStatus: 'APPROVED',
    //     rejectionComment: 'string',
    //     history: [
    //         {
    //             validation_status: 'APPROVED',
    //             rejection_comment: 'Not enough data',
    //             nextTasks: [
    //                 {
    //                     userRoles: [
    //                         {
    //                             id: 0,
    //                             name: 'string',
    //                         },
    //                     ],
    //                     name: 'string',
    //                     id: 0,
    //                 },
    //             ],
    //             history: [
    //                 {
    //                     level: 'Aire de santé',
    //                     color: '#FFFFFF',
    //                     created_at: 1024.123,
    //                     updated_at: 1024.123,
    //                     status: 'ACCEPTED',
    //                     comment: 'LGTM',
    //                     updated_by: 'George Michael',
    //                     created_by: 'Gregory House',
    //                 },
    //             ],
    //         },
    //     ],
    // };
    return getRequest(`${API_URL}${workflowSlug}/`);
};

export const useGetNodesList = (workflowSlug?: string) => {
    return useSnackQuery({
        queryKey: ['submission-validation-nodes', workflowSlug], // TODO invalidate on WF save
        queryFn: () => getNodes(workflowSlug),
        options: {
            staleTime: Infinity,
            cacheTime: Infinity,
            retry: false,
            keepPreviousData: true,
            enabled: Boolean(workflowSlug),
        },
    });
};
