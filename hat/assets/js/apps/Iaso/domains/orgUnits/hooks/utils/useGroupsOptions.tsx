import { useMemo } from 'react';
import { DropdownOptions } from '../../../../types/utils';
import { GroupWithDataSource } from '../../types/orgUnit';

export const useGroupsOptions = (
    groups: GroupWithDataSource[],
): DropdownOptions<number>[] => {
    return useMemo(() => {
        return groups
            .map(a => ({
                label: a.source_version
                    ? `${a.name} - ${a.source_version.data_source.name} ${a.source_version.number}`
                    : a.name,
                value: a.id,
            }))
            .sort((a, b) =>
                a.label.localeCompare(b.label, undefined, {
                    sensitivity: 'accent',
                }),
            );
    }, [groups]);
};
