import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';
import { textPlaceholder } from 'bluesquare-components';
import { Project } from 'Iaso/domains/projects/types/project';
import { ProjectChip } from './ProjectChip';

type Props = {
    projects?: Project[];
};

export const ProjectChips: FunctionComponent<Props> = ({ projects }) => {
    if (!projects || projects.length === 0) {
        return <span>{textPlaceholder}</span>;
    }
    return (
        <Box
            sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.5,
                justifyContent: 'center',
            }}
        >
            {projects.map(p => (
                <Box key={p.id}>
                    <ProjectChip project={p} />
                </Box>
            ))}
        </Box>
    );
};
