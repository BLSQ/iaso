import { Box, Divider, Grid } from '@material-ui/core';
import React, { FunctionComponent } from 'react';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';

type Props = {
    sourceversionId: number;
};

export const DeleteSourceVersion: FunctionComponent<Props> = ({
    sourceVersionId,
}) => {
    return (
    <ConfirmCancelDialogComponent>
          <>
                <Box mb={2}>
                    <Divider />
                </Box>
                <Grid
                    container
                    spacing={2}
                    direction="row"
                    justifyContent="space-around"
                >

                </Grid>
    </ConfirmCancelDialogComponent>)
};
