import React, { FunctionComponent } from 'react';
import moment from 'moment';
import { Box, Button, Grid, Paper, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import getDisplayName from '../../../../utils/usersUtils';
import MESSAGES from '../../messages';
import InputComponent from '../../../../components/forms/InputComponent';
import { PaymentLot } from '../../types';
import { SxStyles } from '../../../../types/general';

type Props = {
    name: string;
    comment?: string | null;
    paymentLot: PaymentLot;
    // eslint-disable-next-line no-unused-vars
    onChange: (keyValue: 'name' | 'comment', newValue: string) => void;
    onSave: () => void;
    allowSave: boolean;
};

const componentStyle: SxStyles = {
    infos: {
        // p: theme => `28px ${theme.spacing()}`,
        '& span': {
            fontWeight: 'bold',
            display: 'inline-block',
            mr: 1,
        },
    },
    paperTitle: {
        padding: theme => theme.spacing(2),
        display: 'flex',
    },
    title: {
        // [theme.breakpoints.down('md')]: {
        //     fontSize: '1.4rem',
        // },
        paddingLeft: theme => theme.spacing(2),
    },
};

export const PaymentLotInfos: FunctionComponent<Props> = ({
    name,
    comment,
    onChange,
    onSave,
    paymentLot,
    allowSave,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Grid container>
            {/* Styling with sx wouldn't override the width */}
            <Grid container item xs={12} md={6} lg={5} xl={4} spacing={2}>
                <Paper style={{ width: '100%' }} elevation={2}>
                    <Box ml={2} my={2}>
                        <Typography color="primary" variant="h5">
                            {formatMessage(MESSAGES.paymentLotInfos)}
                        </Typography>
                    </Box>
                    <Grid item xs={12}>
                        <Box mx={2}>
                            <InputComponent
                                type="text"
                                required
                                keyValue="name"
                                labelString={formatMessage(MESSAGES.name)}
                                value={name}
                                onChange={onChange}
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={12}>
                        <Box mx={2}>
                            <InputComponent
                                type="text"
                                multiline
                                keyValue="comment"
                                labelString={formatMessage(MESSAGES.comment)}
                                value={comment}
                                onChange={onChange}
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={12}>
                        <Box sx={componentStyle.infos} ml={2} mt={2}>
                            <span>{formatMessage(MESSAGES.date)}:</span>
                            {moment().format('L')}
                        </Box>
                    </Grid>
                    <Grid item xs={12}>
                        <Box sx={componentStyle.infos} ml={2} mt={2}>
                            <span>{formatMessage(MESSAGES.created_by)}:</span>
                            {getDisplayName(paymentLot.created_by)}
                        </Box>
                    </Grid>
                    <Grid container item xs={12} justifyContent="flex-end">
                        <Box mr={2} mb={2}>
                            <Button
                                color="primary"
                                variant="contained"
                                size="medium"
                                onClick={onSave}
                                disabled={!allowSave}
                            >
                                {formatMessage(MESSAGES.save)}
                            </Button>
                        </Box>
                    </Grid>
                </Paper>
            </Grid>
        </Grid>
    );
};
