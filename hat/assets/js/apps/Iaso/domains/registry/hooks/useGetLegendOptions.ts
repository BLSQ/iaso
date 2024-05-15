import { useTheme } from '@mui/styles';
import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { OrgunitTypes } from '../../orgUnits/types/orgunitTypes';

import { selectedOrgUnitColor } from '../components/map/OrgUnitChildrenMap';

export type Legend = {
    value: string;
    label: string;
    color: string; // has to be an hexa color
    active?: boolean;
};
export const useGetlegendOptions = (
    orgUnit: OrgUnit,
): ((
    // eslint-disable-next-line no-unused-vars
    subOrgUnitTypes: OrgunitTypes,
    // eslint-disable-next-line no-unused-vars
    selectedChildren?: OrgUnit,
) => Legend[]) => {
    const theme = useTheme();
    const getLegendOptions = (subOrgUnitTypes, selectedChildren?): Legend[] => {
        const options = subOrgUnitTypes.map(subOuType => ({
            value: `${subOuType.id}`,
            label: `${subOuType.name} (${subOuType.orgUnits?.length})`,
            color: subOuType.color || '',
            active: true,
        }));
        if (orgUnit) {
            // console.log('selectedChildren', selectedChildren);
            const color = selectedChildren
                ? theme.palette.primary.main
                : selectedOrgUnitColor;
            options.unshift({
                value: `${orgUnit.id}`,
                label: orgUnit.name,
                color,
                active: true,
            });
        }
        return options;
    };
    return getLegendOptions;
};
