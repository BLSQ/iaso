import React, { FunctionComponent } from 'react';
import { Grid } from '@material-ui/core';

import { AssignmentsMap } from './AssignmentsMap';

import { AssignmentsApi } from '../types/assigment';

type Props = {
    assignments: AssignmentsApi;
};

export const AssignmentsMapTab: FunctionComponent<Props> = ({
    assignments,
}) => {
    return (
        <Grid container spacing={2}>
            <Grid item xs={7}>
                <AssignmentsMap assignments={assignments} />
            </Grid>
            <Grid item xs={5}>
                ICI
            </Grid>
        </Grid>
    );
};
