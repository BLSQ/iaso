import { UseQueryResult } from 'react-query';
import { defineMessages } from 'react-intl';

import { useSafeIntl } from 'bluesquare-components';
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
/** @deprecated
 *
 * use orgUnits/hooks/utils/useGetOrgUnitValidationStatus instead
 *
 * Will be removed: IA-2545
 *
 */
export const useGetValidationStatus = (
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
