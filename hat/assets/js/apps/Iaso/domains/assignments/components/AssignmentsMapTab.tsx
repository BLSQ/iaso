import React, { FunctionComponent } from 'react';
import { Grid } from '@material-ui/core';

import { AssignmentsMap } from './AssignmentsMap';

import { AssignmentsApi } from '../types/assigment';
import { Planning } from '../types/planning';

type Props = {
    assignments: AssignmentsApi;
    planning: Planning | undefined;
};

export const AssignmentsMapTab: FunctionComponent<Props> = ({
    assignments,
    planning,
}) => {
    return (
        <Grid container spacing={2}>
            <Grid item xs={7}>
                <AssignmentsMap assignments={assignments} planning={planning} />
            </Grid>
            <Grid item xs={5}>
                ICI
            </Grid>
        </Grid>
    );
};
