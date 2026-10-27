import React, { FunctionComponent } from 'react';
import { Chip } from '@mui/material';
import Color from 'color';
import { Project } from 'Iaso/domains/projects/types/project';

export type ProjectChipProps = {
    project: Pick<Project, 'name' | 'color'>;
};

export const ProjectChip: FunctionComponent<ProjectChipProps> = ({
    project,
}) => {
    const textColor = Color(project?.color || undefined).isDark()
        ? 'white'
        : 'black';
    return (
        <Chip
            label={project.name}
            size="small"
            sx={{
                backgroundColor: project.color,
                color: textColor,
                fontSize: '0.8rem',
            }}
        />
    );
};
