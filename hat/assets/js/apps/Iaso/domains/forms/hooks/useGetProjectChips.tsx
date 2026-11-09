import React, { ReactElement, useCallback } from 'react';
import { ChipList, ChipListItem, textPlaceholder } from 'bluesquare-components';
import { Project } from 'Iaso/domains/projects/types/project';

/** Subset of Project needed to render chips — any payload with these fields works. */
export type ProjectChipSource = Pick<Project, 'id' | 'name'> &
    Partial<Pick<Project, 'color'>>;

export const useGetProjectChips = (): ((
    projects?: ProjectChipSource[] | null,
) => ReactElement | string) => {
    return useCallback((projects?: ProjectChipSource[] | null) => {
        if (!projects?.length) {
            return textPlaceholder;
        }
        const items: ChipListItem[] = projects.map(project => ({
            id: project.id,
            label: project.name,
            color: project.color ?? undefined,
        }));
        return <ChipList items={items} />;
    }, []);
};
