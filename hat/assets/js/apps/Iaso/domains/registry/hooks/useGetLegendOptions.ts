import { useTheme } from '@mui/styles';
import { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { OrgunitTypes } from '../../orgUnits/types/orgunitTypes';

import { selectedOrgUnitColor } from '../components/map/OrgUnitChildrenMap';

export type Legend = {
    value: string;
    label: string;
    color: string; // has to be an hexa color
    active?: boolean;
};
export const useGetLegendOptions = (
    orgUnit: OrgUnit,
): {
    getLegendOptions: (
        // eslint-disable-next-line no-unused-vars
        subOrgUnitTypes: OrgunitTypes,
        // eslint-disable-next-line no-unused-vars
        selectedChildrenId?: string,
    ) => Legend[];
    setLegendOptions: Dispatch<SetStateAction<Legend[]>>;
    legendOptions: Legend[];
} => {
    const theme = useTheme();
    const [legendOptions, setLegendOptions] = useState<Legend[]>([]);

    const getLegendOptions = useCallback(
        (subOrgUnitTypes: OrgunitTypes, selectedChildrenId?: string) => {
            const options = subOrgUnitTypes.map(subOuType => ({
                value: `${subOuType.id}`,
                label: `${subOuType.name} (${subOuType.orgUnits?.length})`,
                color: subOuType.color || '',
                active: true,
            }));

            if (orgUnit) {
                const color = selectedChildrenId
                    ? theme.palette.primary.main
                    : selectedOrgUnitColor;
                options.unshift({
                    value: `${orgUnit.id}`,
                    label: orgUnit.name,
                    color,
                    active: true,
                });
            }
            setLegendOptions(options);
            return options;
        },
        [orgUnit, theme],
    );

    return { getLegendOptions, setLegendOptions, legendOptions };
};
