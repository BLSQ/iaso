import React, { FunctionComponent } from 'react';
import { Box, Link, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { Report } from 'Iaso/api/reports';
import MESSAGES from '../../messages';

type Props = {
    report: Report;
};

export const CurrentMobileReport: FunctionComponent<Props> = ({ report }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Box mb={2}>
            <Typography variant="subtitle2">
                {formatMessage(MESSAGES.mobileReportCurrent)}
            </Typography>
            <Typography variant="body2">
                <span>{report.name}</span>
                <Box component="span" mx={0.5}>
                    —
                </Box>
                <span>
                    {formatMessage(MESSAGES.mobileReportPublishedVersion)}:
                </span>
                <Box component="span" ml={0.5}>
                    {report.published_version}
                </Box>
                {report.url && (
                    <Box component="span" ml={1}>
                        <Link href={report.url} download>
                            {formatMessage(MESSAGES.download)}
                        </Link>
                    </Box>
                )}
            </Typography>
        </Box>
    );
};
