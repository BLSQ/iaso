import { UseQueryResult } from 'react-query';

import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { Profile } from '../../../../utils/usersUtils';

import { getColor } from '../../constants/colors';

export const useGetProfiles = (): UseQueryResult<Array<Profile>, Error> => {
    return useSnackQuery(
        ['profiles'],
        () => getRequest(`/api/profiles/`),
        undefined,
        {
            select: data => {
                if (!data || !data.profiles) return [];
                return data.profiles.map((profile: Profile, index: number) => {
                    return {
                        ...profile,
                        color: getColor(index),
                    };
                });
            },
        },
    );
};
