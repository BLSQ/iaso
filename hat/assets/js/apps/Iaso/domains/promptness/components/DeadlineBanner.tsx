import React, { FunctionComponent } from 'react';
import { CalendarMonth, HourglassEmpty, Settings } from '@mui/icons-material';
import { Box, Button, Chip, Grid, Paper, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';
import { Link as RouterLink } from 'react-router-dom';
import { DisplayIfUserHasPerm } from 'Iaso/components/DisplayIfUserHasPerm';
import { baseUrls } from 'Iaso/constants/urls';
import { SxStyles } from 'Iaso/types/general';
import { FORMS } from 'Iaso/utils/permissions';
import { Form } from '../../forms/types/forms';
import MESSAGES from '../messages';
import { PromptnessPeriod } from '../types';

type Props = {
    period: PromptnessPeriod;
    periodLabel: string;
    form?: Partial<Form>;
};

const styles: SxStyles = {
    root: {
        px: 2,
        py: 1.5,
        bgcolor: 'background.paper',
    },
    deadline: {
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        '& svg': {
            color: 'text.secondary',
            fontSize: 20,
        },
    },
};

const formatDate = (date: string): string => moment(date).format('L');

export const DeadlineBanner: FunctionComponent<Props> = ({
    period,
    periodLabel,
    form,
}) => {
    const { formatMessage } = useSafeIntl();
    const orgUnitTypesString = form?.org_unit_types
        ?.map(orgUnitType => orgUnitType.name)
        .join(', ');
    return (
        <Paper sx={styles.root}>
            <Grid container>
                <Grid item xs={8}>
                    <Box sx={styles.deadline}>
                        <CalendarMonth />
                        <Typography variant="body2">
                            <FormattedMessage
                                {...MESSAGES.deadline}
                                values={{
                                    period: periodLabel,
                                    deadline: formatDate(period.deadline),
                                    b: chunks => <b>{chunks}</b>,
                                }}
                            />
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        {formatMessage(MESSAGES.deadlineDetails, {
                            days: `${period.grace_period_days}`,
                            periodEnd: formatDate(period.end),
                        })}
                    </Typography>
                    {orgUnitTypesString && (
                        <Typography variant="body2" color="text.secondary">
                            {formatMessage(MESSAGES.configuredFor, {
                                orgUnitTypesString,
                            })}
                        </Typography>
                    )}
                </Grid>
                <Grid item xs={4} sx={{ textAlign: 'right' }}>
                    {period.is_provisional && (
                        <Chip
                            size="small"
                            icon={<HourglassEmpty />}
                            label={formatMessage(MESSAGES.periodProvisional)}
                        />
                    )}
                    {form?.id && (
                        <DisplayIfUserHasPerm permissions={[FORMS]}>
                            <Button
                                size="small"
                                color="primary"
                                startIcon={<Settings />}
                                component={RouterLink}
                                to={`/${baseUrls.formDetail}/formId/${form.id}`}
                            >
                                {formatMessage(MESSAGES.formSettings)}
                            </Button>
                        </DisplayIfUserHasPerm>
                    )}
                </Grid>
            </Grid>
        </Paper>
    );
};
