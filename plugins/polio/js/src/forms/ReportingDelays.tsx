import {
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
} from '@material-ui/core';
import React, { FunctionComponent } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../constants/messages';

type Props = { round: any };

export const ReportingDelays: FunctionComponent<Props> = ({ round }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>
                        {formatMessage(MESSAGES.reportingDelays)}
                    </TableCell>
                    <TableCell>{formatMessage(MESSAGES.days)}</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                <TableRow>
                    <TableCell>
                        {formatMessage(MESSAGES.healthCentreToDistrict)}
                    </TableCell>
                    <TableCell>I am editable</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        {formatMessage(MESSAGES.districtToRegionalLevel)}
                    </TableCell>
                    <TableCell>I am editable</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        {formatMessage(MESSAGES.regionalToNationalLevel)}
                    </TableCell>
                    <TableCell>I am editable</TableCell>
                </TableRow>
            </TableBody>
        </Table>
    );
};
