import React, { FunctionComponent } from 'react';
import Box from '@mui/material/Box/Box';
import Button from '@mui/material/Button/Button';
import Chip from '@mui/material/Chip/Chip';
import Link from '@mui/material/Link/Link';
import Table from '@mui/material/Table/Table';
import TableBody from '@mui/material/TableBody/TableBody';
import TableCell from '@mui/material/TableCell/TableCell';
import TableHead from '@mui/material/TableHead/TableHead';
import TableRow from '@mui/material/TableRow/TableRow';
import Typography from '@mui/material/Typography/Typography';
import { useSafeIntl } from 'bluesquare-components';
import {
    Report,
    ReportVersion,
    useApiReportsPublishCreate,
} from 'Iaso/api/reports';
import { convertToDateTimeRfc } from '../../../../components/Cells/DateTimeCell';
import MESSAGES from '../../messages';

type Props = {
    report: Report;
    versions: ReportVersion[];
};

export const MobileReportVersionsTable: FunctionComponent<Props> = ({
    report,
    versions,
}) => {
    const { formatMessage } = useSafeIntl();
    const { mutate: publish, isLoading: isPublishing } =
        useApiReportsPublishCreate();

    return (
        <>
            <Typography variant="subtitle2">
                {formatMessage(MESSAGES.mobileReportVersions)}
            </Typography>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>
                            {formatMessage(MESSAGES.mobileReportVersionName)}
                        </TableCell>
                        <TableCell>
                            {formatMessage(MESSAGES.mobileReportUploadedAt)}
                        </TableCell>
                        <TableCell>{formatMessage(MESSAGES.status)}</TableCell>
                        <TableCell />
                    </TableRow>
                </TableHead>
                <TableBody>
                    {versions.map(version => {
                        const isPublished =
                            version.id === report.published_version_id;
                        return (
                            <TableRow
                                key={version.id}
                                data-testid={`mobile-report-version-${version.id}`}
                            >
                                <TableCell>
                                    {version.url ? (
                                        <Link href={version.url} download>
                                            {version.name}
                                        </Link>
                                    ) : (
                                        version.name
                                    )}
                                </TableCell>
                                <TableCell>
                                    <span>
                                        {convertToDateTimeRfc(
                                            version.created_at,
                                        )}
                                    </span>
                                    {version.created_by && (
                                        <Box component="span" ml={1}>
                                            {version.created_by}
                                        </Box>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        size="small"
                                        color={
                                            isPublished ? 'success' : 'default'
                                        }
                                        label={formatMessage(
                                            isPublished
                                                ? MESSAGES.mobileReportPublished
                                                : MESSAGES.mobileReportUnpublished,
                                        )}
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    {!isPublished && (
                                        <Button
                                            size="small"
                                            onClick={() =>
                                                publish({
                                                    id: String(report.id),
                                                    data: {
                                                        version_id: version.id,
                                                    },
                                                })
                                            }
                                            disabled={isPublishing}
                                        >
                                            {formatMessage(
                                                MESSAGES.mobileReportPublish,
                                            )}
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </>
    );
};
