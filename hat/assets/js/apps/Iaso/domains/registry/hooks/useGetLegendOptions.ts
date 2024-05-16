import { useTheme } from '@mui/styles';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { hasLocation } from '../../../utils/map/mapUtils';
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
    subOrgUnitTypes: OrgunitTypes,
    selectedChildrenId?: string,
): {
    legendOptions: Legend[];
    setLegendOptions: Dispatch<SetStateAction<Legend[]>>;
} => {
    const [legendOptions, setLegendOptions] = useState<Legend[]>([]);
    const theme = useTheme();

    // Generate initial legend options based on orgUnit and subOrgUnitTypes
    useEffect(() => {
        const options = subOrgUnitTypes.map(subOuType => {
            const orgUnitWithLocationsCount =
                subOuType.orgUnits?.filter(hasLocation).length || 0;
            const orgUnitCount = subOuType.orgUnits?.length || 0;
            const labelCount =
                orgUnitCount === orgUnitWithLocationsCount
                    ? `${orgUnitCount}`
                    : `${orgUnitWithLocationsCount}/${orgUnitCount}`;
            return {
                value: `${subOuType.id}`,
                label: `${subOuType.name} (${labelCount})`,
                color: subOuType.color || '',
                active: true,
            };
        });

        if (orgUnit) {
            options.unshift({
                value: `${orgUnit.id}`,
                label: orgUnit.name,
                color: selectedOrgUnitColor, // Default color
                active: true,
            });
        }
        setLegendOptions(options);
    }, [orgUnit, subOrgUnitTypes]);

    // Adjust the color of the first legend option based on selectedChildrenId
    useEffect(() => {
        if (legendOptions.length > 0) {
            const adjustedOptions = [...legendOptions];

            const color = selectedChildrenId
                ? theme.palette.primary.main
                : selectedOrgUnitColor;
            adjustedOptions[0] = {
                ...adjustedOptions[0],
                color,
            };
            setLegendOptions(adjustedOptions);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedChildrenId, theme.palette.primary.main]);

    return { legendOptions, setLegendOptions };
};
