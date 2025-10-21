import React, { FunctionComponent, ReactNode } from 'react';
import {
    Table,
    TableBody,
    TableRow,
    TableCell,
    Divider,
    Box,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useSafeIntl } from 'bluesquare-components';

import { DetailsForm } from 'Iaso/domains/stock/versions/components/DetailsForm';
import MESSAGES from '../../messages';

import { StockRulesVersion } from '../../types/stocks';

import { PublishVersionModal } from './PublishVersionModal';
import { StatusCell } from './StatusCell';

const useStyles = makeStyles(theme => ({
    leftCell: {
        // @ts-ignore
        borderRight: `1px solid ${theme.palette.ligthGray.border}`,
        fontWeight: 'bold',
    },
}));

type RowProps = {
    label: string;
    value?: string | ReactNode;
};

const Row: FunctionComponent<RowProps> = ({ label, value }) => {
    const classes = useStyles();
    return (
        <TableRow>
            <TableCell className={classes.leftCell}>{label}</TableCell>
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
                                ''
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
