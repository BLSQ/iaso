import React, { FunctionComponent } from 'react';

import { ColorChip } from 'bluesquare-components';
import { Project } from 'Iaso/domains/projects/types/project';

export type ProjectChipProps = {
    project: Pick<Project, 'name' | 'color'>;
};

export const ProjectChip: FunctionComponent<ProjectChipProps> = ({
    project,
}) => {
    return (
        <ColorChip label={project.name} color={project?.color || undefined} />
    );
};
