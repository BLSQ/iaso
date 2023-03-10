/* eslint-disable camelcase */
import { UseMutationResult } from 'react-query';
import { useSnackMutation } from '../../../../libs/apiHooks';
import { waitFor } from '../../../../utils';

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

export const useIgnoreDuplicate = (): UseMutationResult => {
    return useSnackMutation({
        mutationFn: args => ignoreDuplicate(args),
    });
};
