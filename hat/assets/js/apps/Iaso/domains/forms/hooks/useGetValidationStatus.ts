import { UseQueryResult } from 'react-query';
import { defineMessages } from 'react-intl';

import { useSafeIntl, Pagination } from 'bluesquare-components';
import { useSnackQuery } from '../../../libs/apiHooks';
import { getRequest } from '../../../libs/Api';
import { DropdownOptions } from '../../../types/utils';
import { OrgUnitStatus } from '../../orgUnits/types/orgUnit';

const MESSAGES = defineMessages({
    all: {
        id: 'iaso.forms.all',
        defaultMessage: 'All',
    },
    REJECTED: {
        defaultMessage: 'Rejected',
        id: 'iaso.forms.rejected',
    },
    NEW: {
        defaultMessage: 'New',
        id: 'iaso.forms.new',
    },
    VALID: {
        defaultMessage: 'Validated',
        id: 'iaso.forms.validated',
    },
});

export const useGetValidationStatus = (
    includeAll = false,
): UseQueryResult<DropdownOptions<string>[], Error> => {
    const queryKey: any[] = ['validationStatus'];
    const { formatMessage } = useSafeIntl();
    return useSnackQuery({
        queryKey,
        queryFn: () => getRequest('/api/validationstatus/'),
        options: {
            retry: false,
            keepPreviousData: true,
            select: (data: OrgUnitStatus[]) => {
                const options: DropdownOptions<string>[] = data.map(
                    (status: OrgUnitStatus) => ({
                        value: status,
                        label: MESSAGES[status]
                            ? formatMessage(MESSAGES[status])
                            : status,
                    }),
                );
                if (includeAll) {
                    options.unshift({
                        value: 'all',
                        label: formatMessage(MESSAGES.all),
                    });
                }
                return options;
            },
        },
    });
};
