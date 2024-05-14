import { useSafeIntl } from 'bluesquare-components';

import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { OrgunitTypes } from '../../orgUnits/types/orgunitTypes';

import { selectedOrgUnitColor } from '../components/map/OrgUnitChildrenMap';
import MESSAGES from '../messages';

export type Legend = {
    value: string;
    label: string;
    color: string; // has to be an hexa color
    active?: boolean;
};
export const useGetlegendOptions = (
    orgUnit: OrgUnit,
    // eslint-disable-next-line no-unused-vars
): ((subOrgUnitTypes: OrgunitTypes) => Legend[]) => {
    const { formatMessage } = useSafeIntl();
    const getLegendOptions = (subOrgUnitTypes: OrgunitTypes): Legend[] => {
        const options = subOrgUnitTypes.map(subOuType => ({
            value: `${subOuType.id}`,
            label: `${subOuType.name} (${subOuType.orgUnits?.length})`,
            color: subOuType.color || '',
            active: true,
        }));
        if (orgUnit) {
            options.unshift({
                value: `${orgUnit.id}`,
                label: formatMessage(MESSAGES.selectedOrgUnit),
                color: selectedOrgUnitColor,
                active: true,
            });
        }
        return options;
    };
    return getLegendOptions;
};
