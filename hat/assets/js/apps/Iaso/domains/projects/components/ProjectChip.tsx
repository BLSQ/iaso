import React, { FunctionComponent } from 'react';

import { ColorChip } from 'bluesquare-components';
import { Project } from 'Iaso/domains/projects/types/project';

type Props = {
    project: Pick<Project, 'name' | 'color'>;
};

export const ProjectChip: FunctionComponent<Props> = ({ project }) => {
    return <ColorChip label={project.name} color={project.color} />;
};
