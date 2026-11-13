import React, { ReactElement, useCallback } from 'react';
import { ChipList, ChipListItem, textPlaceholder } from 'bluesquare-components';
import { OrgunitType } from '../../types/orgunitTypes';

/** Subset of OrgunitType needed to render chips — any payload with these fields works. */
export type OrgUnitTypeChipSource = Pick<OrgunitType, 'id'> &
    Partial<Pick<OrgunitType, 'short_name' | 'name'>>;

export const useGetOrgUnitTypeChips = (): ((
    orgUnitTypes?: OrgUnitTypeChipSource[] | null,
) => ReactElement | string) => {
    return useCallback((orgUnitTypes?: OrgUnitTypeChipSource[] | null) => {
        if (!orgUnitTypes?.length) {
            return textPlaceholder;
        }
        const items: ChipListItem[] = orgUnitTypes.map(orgUnitType => ({
            id: orgUnitType.id,
            label: orgUnitType.short_name || orgUnitType.name || '',
        }));
        return <ChipList items={items} color="secondary" />;
    }, []);
};
