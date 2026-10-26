import React, { FC } from 'react';
import { Stack } from '@mui/material';
import { GreyPageWrapper } from 'Iaso/components/GreyPageWrapper';
import { SxStyles } from 'Iaso/types/general';
import { useAssignmentsContext } from '../../contexts/AssignmentsContext';
import { useAssignmentsParams } from '../../hooks/useAssignmentsParams';
import { AssignmentsBreadcrumbs } from './AssignmentsBreadcrumbs';
import { AssignmentsMainPanel } from './mainPanel/AssignmentsMainPanel';
import { ModeToggle } from './ModeToggle';
import { PublishedPlanningWarning } from './PublishedPlanningWarning';
import { TeamsPanel } from './teamsPanel/TeamsPanel';

const styles = {
    fill: {
        flex: 1,
        minHeight: 0,
    },
} satisfies SxStyles;

export const AssignmentsContent: FC = () => {
    const { mode } = useAssignmentsParams();
    const { planning } = useAssignmentsContext();
    return (
        <GreyPageWrapper
            title={<AssignmentsBreadcrumbs />}
            actions={<ModeToggle />}
        >
            <Stack gap={2} sx={styles.fill}>
                {mode === 'assign' && planning.status === 'published' && (
                    <PublishedPlanningWarning />
                )}
                <Stack
                    direction="row"
                    flexWrap="wrap"
                    alignItems="stretch"
                    gap={2}
                    sx={styles.fill}
                >
                    <TeamsPanel />
                    <AssignmentsMainPanel />
                </Stack>
            </Stack>
        </GreyPageWrapper>
    );
};
