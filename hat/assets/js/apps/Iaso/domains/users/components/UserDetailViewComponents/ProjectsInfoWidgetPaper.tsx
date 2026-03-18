import React from 'react';
import { Alert, Box } from '@mui/material';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import { ProjectChip } from 'Iaso/domains/projects/components/ProjectChip';
import MESSAGES from 'Iaso/domains/users/messages';
import { ProfileRetrieveResponseItem } from 'Iaso/domains/users/types';

type Props = {
    savingProfile?: boolean;
    profile?: ProfileRetrieveResponseItem;
};
export const ProjectsInfoWidgetPaper = ({ savingProfile, profile }: Props) => {
    const { formatMessage } = useSafeIntl();

    return (
        <WidgetPaper
            title={formatMessage(MESSAGES.projects)}
            data-testid={'projects-info-box'}
        >
            {savingProfile && <LoadingSpinner absolute fixed={false} />}
            {profile?.projects?.length && (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        gap: 1,
                        px: 2,
                        pb: 2,
                    }}
                >
                    {profile?.projects?.map(project => {
                        return (
                            <Box key={project.name}>
                                <ProjectChip project={project} />
                            </Box>
                        );
                    })}
                </Box>
            )}
            {!profile?.projects?.length && (
                <Alert color={'info'} severity={'info'} sx={{ mx: 2, mb: 2 }}>
                    {formatMessage(MESSAGES.noResultsFound)}
                </Alert>
            )}
        </WidgetPaper>
    );
};
