import { useSafeIntl } from 'bluesquare-components';
import { defineMessages } from 'react-intl';
import { UseQueryResult } from 'react-query';

import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { DropdownOptions } from '../../../../types/utils';
import { OrgUnitStatus } from '../../types/orgUnit';

const MESSAGES = defineMessages({
    all: {
        id: 'iaso.forms.all',
        defaultMessage: 'All',
    },
    REJECTED: {
        defaultMessage: 'Rejected',
        id: 'iaso.forms.rejectedCap',
    },
    NEW: {
        defaultMessage: 'New',
        id: 'iaso.forms.newCap',
    },
    VALID: {
        defaultMessage: 'Valid',
        id: 'iaso.forms.valid',
    },
});

export const useGetOrgUnitValidationStatus = (
    includeAll = false,
    enabled = true,
): UseQueryResult<DropdownOptions<string>[], Error> => {
    const queryKey: any[] = ['validationStatus'];
    const { formatMessage } = useSafeIntl();
    return useSnackQuery({
        queryKey,
        queryFn: () => getRequest('/api/validationstatus/'),
        options: {
            retry: false,
            enabled,
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
