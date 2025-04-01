import React, { FunctionComponent } from 'react';
import { Grid, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import InputComponent from '../../../../components/forms/InputComponent';
import MESSAGES from '../../messages';

type Props = {
    ids?: number[];
    idsCound?: number;
    onCheck: (type: string) => void;
};
export const LinkReferenceInstancesCheckBox: FunctionComponent<Props> = ({
    ids,
    idsCound,
    onCheck,
}) => {
    const { formatMessage } = useSafeIntl();
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
                    onChange={() => onCheck('link')}
                    value={(ids?.length || 0) > 0}
                    errors={[]}
                    type="checkbox"
                    labelString=""
                />
            </Grid>
            <Grid item xs={10}>
                <Typography variant="body1" sx={{ color: 'second.main' }}>
                    {formatMessage(
                        MESSAGES.linkReferenceSubmissionsConfirmMessage,
                        {
                            unLinkedCount: idsCound,
                        },
                    )}
                </Typography>
            </Grid>
        </Grid>
    );
};
