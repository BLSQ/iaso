/* eslint-disable camelcase */
import { UseMutationResult } from 'react-query';
import { useSnackMutation } from '../../../../../libs/apiHooks';
import { waitFor } from '../../../../../utils';

type IgnoreDuplicateArgs = {
    entity1_id: number;
    entity2_id: number;
    reason?: string;
};

const apiUrl = '/api/entityduplicates';

const ignoreDuplicate = async (args: IgnoreDuplicateArgs) => {
    const query = { ...args, ignore: true };

    waitFor(2000);
    console.log('PATCH', apiUrl, query);
};

export const useIgnoreDuplicate = (
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    onSuccess: (data: any) => void = _data => {},
): UseMutationResult => {
    return useSnackMutation({
        mutationFn: args => ignoreDuplicate(args),
        options: { onSuccess },
    });
};
