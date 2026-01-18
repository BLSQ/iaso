import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { Round } from '../../../../constants/types';
import { UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import moment from 'moment';
import { SubActivityFormValues } from '../../SubActivities/types';

const apiUrl = '/api/polio/campaigns_subactivities';
type Args = {
    round?: Round;
};

export const useGetLatestSubActivityDate = ({
    round,
}: Args): UseQueryResult<moment.Moment> => {
    const queryString = new URLSearchParams({
        round__id: `${round?.id}`,
    }).toString();
    const url = `${apiUrl}/?${queryString}`;
    return useSnackQuery({
        queryKey: ['subActivities', queryString],
        queryFn: () => getRequest(url),
        options: {
            select: data =>
                data?.results
                    .map((subActivity: SubActivityFormValues) =>
                        moment(subActivity.start_date, 'YYYY-MM-DD', 'day'),
                    )
                    .sort((a: moment.Moment, b: moment.Moment) =>
                        b.isAfter(a) ? 1 : -1,
                    )?.[0],
            // Not keeping previous data as it would show wrong data when switching tabs to a round without subactivities
            staleTime: 60000,
            cacheTime: 45000,
            enabled: Boolean(round?.id),
        },
    });
};
