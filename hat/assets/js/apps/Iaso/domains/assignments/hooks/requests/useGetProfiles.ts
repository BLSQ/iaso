import { UseQueryResult } from 'react-query';

import { useGetColors, getColor } from 'Iaso/hooks/useGetColors';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { Profile } from '../../../../utils/usersUtils';

export type ProfileWithColor = Profile & {
    color: string;
};
export const useGetProfiles = (): UseQueryResult<
    Array<ProfileWithColor>,
    Error
> => {
    const { data: colors } = useGetColors();
    return useSnackQuery({
        queryKey: ['profiles'],
        queryFn: () => getRequest(`/api/profiles/`),
        options: {
            select: data => {
                if (!data || !data.profiles) return [];
                return data.profiles.map((profile: Profile, index: number) => {
                    return {
                        ...profile,
                        color: getColor(index, colors),
                    };
                });
            },
            enabled: Boolean(colors),
        },
    });
};
