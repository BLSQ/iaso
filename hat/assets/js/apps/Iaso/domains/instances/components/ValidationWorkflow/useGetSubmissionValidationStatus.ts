import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { waitFor } from 'Iaso/utils';

const getSubmissionValidationStatus = async (id: number) => {
    const url = `/api/validation-workflows/instance/${id}`;
    console.log('GET request: ', url);
    await waitFor(1000);
    return {
        validationStatus: 'APPROVED',
        rejectionComment: null,
        slug: 'dat_workflow',
        userRoles: [{ label: 'Data manager', value: 7 }],
        history: [
            {
                level: 'Aire de santé',
                color: '#FFFFFF',
                created_at: 1024.123,
                updated_at: 1024.123,
                status: 'ACCEPTED',
                comment: 'LGTM',
                updated_by: 'George Michael',
                created_by: 'Gregory House',
            },
        ],
    };

    // return getRequest(url)
};

export const useGetSubmissionValidationStatus = (id: number) => {
    return useSnackQuery({
        queryKey: ['submission-validation-status', id],
        queryFn: () => getSubmissionValidationStatus(id),
    });
};
