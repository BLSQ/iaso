import React, { FunctionComponent, useMemo, ReactElement } from 'react';
import { Table, TableBody, TableRow, TableCell, Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useSafeIntl } from 'bluesquare-components';
import { FieldType } from '../../forms/types/forms';
import { LinkToOrgUnit } from '../../orgUnits/components/LinkToOrgUnit';
import MESSAGES from '../messages';

import { Storage } from '../types/storages';
import { LinkToEntity } from './LinkToEntity';
import { StatusCell } from './StatusCell';
import { StatusModal } from './StatusModal';

const useStyles = makeStyles(theme => ({
    leftCell: {
        // @ts-ignore
        borderRight: `1px solid ${theme.palette.lightGray.border}`,
        fontWeight: 'bold',
    },
}));

export type Field = {
    label: string;
    value?: string | ReactElement | number;
    key?: string;
    type?: FieldType;
};

type RowProps = {
    field: Field;
};

const Row: FunctionComponent<RowProps> = ({ field }) => {
    const { label, value } = field;
    const classes = useStyles();
    return (
        <TableRow>
            <TableCell className={classes.leftCell}>{label}</TableCell>
            <TableCell>{value}</TableCell>
        </TableRow>
    );
};

type Props = {
    storage?: Storage;
};
export const Infos: FunctionComponent<Props> = ({ storage }) => {
    const { formatMessage } = useSafeIntl();
    const staticFields = useMemo(
        () => [
            {
                label: formatMessage(MESSAGES.type),
                value: storage?.storage_type,
                key: 'type',
            },
            {
                label: formatMessage(MESSAGES.status),
                value: (
                    <>
                        {storage && (
                            <>
                                <StatusCell status={storage.storage_status} />
                                <Box ml={2} display="inline-block">
                                    <StatusModal storage={storage} />
                                </Box>
                            </>
                        )}
                    </>
                ),
                key: 'status',
            },
            {
                label: formatMessage(MESSAGES.location),
                value: <LinkToOrgUnit orgUnit={storage?.org_unit} />,
                key: 'location',
            },
            {
                label: formatMessage(MESSAGES.entity),
                value: <LinkToEntity entity={storage?.entity} />,
                key: 'entity',
            },
        ],
        [formatMessage, storage],
    );
    return (
        <Table size="small">
            <TableBody>
                <>
                    {staticFields.map(field => (
                        <Row field={field} key={field.key} />
                    ))}
                </>
            </TableBody>
        </Table>
    );
};
