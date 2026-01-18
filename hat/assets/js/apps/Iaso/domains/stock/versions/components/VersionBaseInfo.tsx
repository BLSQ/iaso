import React, { FunctionComponent, ReactNode } from 'react';
import {
    Table,
    TableBody,
    TableRow,
    TableCell,
    Divider,
    Box,
} from '@mui/material';
import { Theme } from '@mui/system';
import { useSafeIntl } from 'bluesquare-components';

import { textPlaceholder } from 'Iaso/constants/uiConstants';
import { DetailsForm } from 'Iaso/domains/stock/versions/components/DetailsForm';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../messages';

import { StockRulesVersion } from '../../types/stocks';

import { PublishVersionModal } from './PublishVersionModal';
import { StatusCell } from './StatusCell';

const styles: SxStyles = {
    leftCell: {
        // @ts-ignore
        borderRight: (theme: Theme) =>
            `1px solid ${theme.palette.ligthGray.border}`,
        fontWeight: 'bold',
    },
};

type RowProps = {
    label: string;
    value?: string | ReactNode;
};

const Row: FunctionComponent<RowProps> = ({ label, value }) => {
    return (
        <TableRow>
            <TableCell sx={styles.leftCell}>{label}</TableCell>
            <TableCell>{value}</TableCell>
        </TableRow>
    );
};

type Props = {
    version: StockRulesVersion;
};
export const VersionBaseInfo: FunctionComponent<Props> = ({ version }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <>
            <DetailsForm version={version} />
            <Divider />
            <Table size="small" data-test="workflow-base-info">
                <TableBody>
                    <Row
                        label={formatMessage(MESSAGES.status)}
                        value={
                            version ? (
                                <StatusCell status={version.status} />
                            ) : (
                                textPlaceholder
                            )
                        }
                    />
                </TableBody>
            </Table>
            {version?.status !== 'PUBLISHED' && (
                <>
                    <Divider />
                    <Box p={2} display="flex" justifyContent="flex-end">
                        <PublishVersionModal
                            version={version}
                            iconProps={{
                                dataTestId: 'publish-workflow-button',
                            }}
                        />
                    </Box>
                </>
            )}
        </>
    );
};
