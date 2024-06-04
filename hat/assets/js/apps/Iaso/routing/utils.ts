import { createUrl } from 'bluesquare-components';
import { baseUrls } from '../constants/urls';
import { getChipColors } from '../constants/chipColors';
import { locationLimitMax } from '../domains/orgUnits/constants/orgUnitConstants';

// TODO replace createUrl to avoid multiple methods with same use
export const getOrgUnitsUrl = (accountId: string | number): string =>
    `/${baseUrls.orgUnits}${createUrl(
        {
            accountId,
            locationLimit: locationLimitMax,
            order: 'id',
            pageSize: 50,
            page: 1,
            searchTabIndex: 0,
            searches: `[{"validation_status":"all", "color":"${getChipColors(
                0,
            ).replace('#', '')}"}]`,
        },
        '',
    )}`;
