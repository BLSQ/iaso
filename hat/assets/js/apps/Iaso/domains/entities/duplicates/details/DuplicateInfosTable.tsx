import React, { FunctionComponent } from 'react';
import { Table, TableBody, TableCell, TableRow } from '@material-ui/core';
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';
import { StarsComponent } from '../../../../components/stars/StarsComponent';
import MESSAGES from '../messages';

type Props = {
    similarityScore?: number;
    isLoading: boolean;
    entityIds: [number, number];
    algorithmsUsed: string[];
    algorithmRuns: number;
    unmatchedRemaining: number;
};

export const DuplicateInfosTable: FunctionComponent<Props> = ({
    similarityScore,
    isLoading,
    entityIds,
    unmatchedRemaining,
    algorithmsUsed,
    algorithmRuns,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Table size="small">
            <TableBody>
                <TableRow>
                    <TableCell>
                        {formatMessage(MESSAGES.similarityScore)}
                    </TableCell>
                    <TableCell>
                        {isLoading && (
                            <LoadingSpinner
                                fixed={false}
                                transparent
                                padding={4}
                                size={25}
                            />
                        )}
                        <StarsComponent
                            starCount={5}
                            fullStars={similarityScore ?? 5}
                        />
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>{formatMessage(MESSAGES.entities)}</TableCell>
                    <TableCell>{entityIds.join(',')}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        {formatMessage(MESSAGES.algorithmRuns)}
                    </TableCell>
                    <TableCell>{algorithmRuns}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        {' '}
                        {formatMessage(MESSAGES.algorithmsUsed)}
                    </TableCell>
                    <TableCell>{algorithmsUsed}</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        {formatMessage(MESSAGES.unmatchedRemaining)}
                    </TableCell>
                    <TableCell>{unmatchedRemaining}</TableCell>
                </TableRow>
            </TableBody>
        </Table>
    );
};
