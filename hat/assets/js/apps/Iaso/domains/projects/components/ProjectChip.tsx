import React, { FunctionComponent } from 'react';
import { Chip } from '@mui/material';
import Color from 'color';
import { Project } from 'Iaso/domains/projects/types/project';

type Props = {
    project: Project;
};

export const ProjectChip: FunctionComponent<Props> = ({ project }) => {
    const textColor = Color(project.color).isDark() ? 'white' : 'black';
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
