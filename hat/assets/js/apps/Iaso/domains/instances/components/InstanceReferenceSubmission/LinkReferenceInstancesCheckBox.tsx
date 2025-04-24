import React, { FunctionComponent } from 'react';
import { Grid, Typography } from '@mui/material';
import InputComponent from '../../../../components/forms/InputComponent';

type Props = {
    actions: string[];
    action: string;
    message: string;
    onCheck: (type: string | undefined) => void;
};
export const LinkReferenceInstancesCheckBox: FunctionComponent<Props> = ({
    actions,
    action,
    message,
    onCheck,
}) => {
    return (
        <Grid
            item
            xs={12}
            container
            spacing={2}
            alignItems="center"
            direction="row"
        >
            <Grid item xs={2} display="flex" justifyContent="flex-end">
                <InputComponent
                    keyValue="read_only"
                    onChange={() => onCheck(action)}
                    value={actions.includes(action)}
                    errors={[]}
                    type="checkbox"
                    labelString=""
                />
            </Grid>
            <Grid item xs={10}>
                <Typography variant="body1" sx={{ color: 'second.main' }}>
                    {message}
                </Typography>
            </Grid>
        </Grid>
    );
};
