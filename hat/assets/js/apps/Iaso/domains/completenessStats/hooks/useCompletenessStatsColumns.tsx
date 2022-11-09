// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';

export const useCompletenessStatsColumns = () => {
    const { formatMessage } = useSafeIntl();
    return [
        {
            Header: formatMessage(MESSAGES.id),
            id: 'created_at',
            accessor: 'created_at',
            sortable: false,
        },
    ];
};
