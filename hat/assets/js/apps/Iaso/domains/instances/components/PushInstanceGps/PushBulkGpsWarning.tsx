import React, { FunctionComponent } from 'react';
import { Button, Grid, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../messages';

type Props = {
    condition: boolean;
    message: { defaultMessage: string; id: string };
    approveCondition: boolean;
    onApproveClick: () => void;
};

const PushBulkGpsWarning: FunctionComponent<Props> = ({
    condition,
    message,
    approveCondition,
    onApproveClick,
}) => {
    const { formatMessage } = useSafeIntl();
    if (!condition) return null;

    return (
        <Grid
            container
            spacing={2}
            direction="row"
            size={12}
            sx={{
                alignItems: 'center',
            }}
        >
            <Grid size={8}>
                <Typography component="ul" sx={{ color: 'warning.main' }}>
                    <Typography component="li">
                        {formatMessage(message)}
                    </Typography>
                </Typography>
            </Grid>
            <Grid
                size={1}
                sx={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                }}
            >
                {/* <LinkWithLocation to={linkTo}>
                    {formatMessage(MESSAGES.seeAll)}
                </LinkWithLocation> */}
            </Grid>
            <Grid
                size={3}
                sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                }}
            >
                <Button
                    variant="outlined"
                    color={approveCondition ? 'primary' : 'warning'}
                    onClick={onApproveClick}
                >
                    {formatMessage(
                        approveCondition ? MESSAGES.approved : MESSAGES.approve,
                    )}
                </Button>
            </Grid>
        </Grid>
    );
};

export default PushBulkGpsWarning;
