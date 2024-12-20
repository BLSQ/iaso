import { Button, Grid, Typography } from '@mui/material';
import { LinkWithLocation, useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import MESSAGES from '../messages';

type Props = {
    condition: boolean;
    message: { defaultMessage: string; id: string };
    linkTo: string;
    approveCondition: boolean;
    onApproveClick: () => void;
};
const PushBulkGpsWarning: FunctionComponent<Props> = ({
    condition,
    message,
    linkTo,
    approveCondition,
    onApproveClick,
}) => {
    const { formatMessage } = useSafeIntl();
    if (!condition) return null;

    return (
        <Grid
            item
            xs={12}
            container
            spacing={2}
            alignItems="center"
            direction="row"
        >
            <Grid item xs={8}>
                <Typography component="ul" sx={{ color: 'warning.main' }}>
                    <Typography component="li">
                        {formatMessage(message)}
                    </Typography>
                </Typography>
            </Grid>
            <Grid item xs={2} display="flex" justifyContent="flex-start">
                <LinkWithLocation to={linkTo}>
                    {formatMessage(MESSAGES.seeAll)}
                </LinkWithLocation>
            </Grid>
            <Grid item xs={2} display="flex" justifyContent="flex-end">
                <Button
                    data-test="search-button"
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
