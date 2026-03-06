import MESSAGES from 'Iaso/domains/users/messages';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import { Alert, List, ListItem } from '@mui/material';
import { ProjectChip } from 'Iaso/domains/projects/components/ProjectChip';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import React from 'react';
import { ProfileRetrieveResponseItem } from 'Iaso/domains/users/types';

type Props = {
    savingProfile?: boolean;
    profile?: ProfileRetrieveResponseItem
}
export const ProjectsInfoWidgetPaper = ({
                                            savingProfile,
                                            profile,
                                        }: Props) => {
    const { formatMessage } = useSafeIntl();

    return <WidgetPaper title={formatMessage(MESSAGES.projects)} data-testid={'projects-info-box'}>
        {savingProfile ? <LoadingSpinner absolute={false} fixed={false} /> :

            profile?.projects?.length ? (
                <List>
                    {profile?.projects?.map(project => {
                        return (
                            <ListItem key={project.name}>
                                <ProjectChip project={project}
                                />
                            </ListItem>
                        );
                    })}</List>
            ) : (
                <Alert
                    color={'info'}
                    severity={'info'}
                    sx={{ mx: 2, mb: 2 }}
                >
                    {formatMessage(MESSAGES.noResultsFound)}
                </Alert>
            )
        }
    </WidgetPaper>;
};