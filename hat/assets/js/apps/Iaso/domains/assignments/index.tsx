import React, { FunctionComponent } from 'react';
import { Box, makeStyles } from '@material-ui/core';
import {
    // @ts-ignore
    commonStyles,
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    LoadingSpinner,
} from 'bluesquare-components';

import { useGetPlanning } from './hooks/requests/useGetPlanning';
import { useGetAssignments } from './hooks/requests/useGetAssignments';

import TopBar from '../../components/nav/TopBarComponent';

import { AssignmentParams, AssignmentApi } from './types/assigment';
import { Planning } from './types/planning';

import MESSAGES from './messages';

type Props = {
    params: AssignmentParams;
};

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

export const Assignments: FunctionComponent<Props> = ({ params }) => {
    const { formatMessage } = useSafeIntl();
    const { planningId } = params;
    const classes: Record<string, string> = useStyles();

    const {
        data: planning,
        isLoading: isLoadingPlanning,
    }: {
        data?: Planning;
        isLoading: boolean;
    } = useGetPlanning(planningId);
    const {
        data: assignments = [],
        isLoading: isLoadingAssignments,
    }: {
        data?: AssignmentApi[];
        isLoading: boolean;
    } = useGetAssignments({ planningId });

    const isLoading = isLoadingPlanning || isLoadingAssignments;
    return (
        <>
            <TopBar
                title={`${formatMessage(MESSAGES.title)}: ${
                    planning?.name ?? ''
                }`}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                {isLoading && <LoadingSpinner />}
                {assignments.length} assignments
            </Box>
        </>
    );
};
