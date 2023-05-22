import { useSafeIntl } from 'bluesquare-components';
import { useTheme } from '@material-ui/core';

import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { OrgunitTypes } from '../../orgUnits/types/orgunitTypes';

import MESSAGES from '../messages';

export type Legend = {
    value: string;
    label: string;
    color: string; // has to be an hexa color
    active?: boolean;
};
export const useGetlegendOptions = (
    orgUnit: OrgUnit,
    subOrgUnitTypes: OrgunitTypes,
): (() => Legend[]) => {
    const { formatMessage } = useSafeIntl();
    const theme = useTheme();
    const getLegendOptions = (): Legend[] => {
        const options = subOrgUnitTypes.map(subOuType => ({
            value: `${subOuType.id}`,
            label: subOuType.name,
            color: subOuType.color || '',
            active: true,
        }));
        if (orgUnit) {
            options.unshift({
                value: `${orgUnit.id}`,
                label: formatMessage(MESSAGES.selectedOrgUnit),
                color: theme.palette.secondary.main,
                active: true,
            });
        }
        return options;
    };
    return getLegendOptions;
};
