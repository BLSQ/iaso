import React, { FunctionComponent, ReactNode } from 'react';
import { Done } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import { Table, TableBody, TableRow, TableCell } from '@mui/material';
import { TablePropsSizeOverrides } from '@mui/material/Table/Table';
import { makeStyles } from '@mui/styles';
import { OverridableStringUnion } from '@mui/types/esm';
import { useSafeIntl } from 'bluesquare-components';

import moment from 'moment';
import { APIImport } from 'Iaso/domains/apiimports/types/apiimport';
import { textOrPlaceholder } from 'Iaso/domains/apiimports/utils';
import getDisplayName from 'Iaso/utils/usersUtils';
import MESSAGES from '../messages';

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
    apiImport: APIImport;
    size?: OverridableStringUnion<'small' | 'medium', TablePropsSizeOverrides>;
};
export const APIImportBaseInfo: FunctionComponent<Props> = ({
    apiImport,
    size,
}) => {
    const { formatMessage } = useSafeIntl();

    return (
        <>
            <Table size={size} data-test="api-import-base-info">
                <TableBody>
                    <Row
                        label={formatMessage(MESSAGES.is_successful)}
                        value={
                            <>
                                {apiImport.has_problem && (
                                    <CloseIcon color="error" />
                                )}
                                {!apiImport.has_problem && (
                                    <Done color="success" />
                                )}
                            </>
                        }
                    />
                    <Row
                        label={formatMessage(MESSAGES.created_at)}
                        value={moment.unix(apiImport.created_at).format('LTS')}
                    />
                    <Row
                        label={formatMessage(MESSAGES.user)}
                        value={getDisplayName(apiImport.user)}
                    />
                    <Row
                        label={formatMessage(MESSAGES.import_type)}
                        value={apiImport.import_type}
                    />
                    <Row
                        label={formatMessage(MESSAGES.app_id)}
                        value={textOrPlaceholder(apiImport.app_id)}
                    />
                    <Row
                        label={formatMessage(MESSAGES.app_version)}
                        value={textOrPlaceholder(apiImport.app_version)}
                    />
                </TableBody>
            </Table>
        </>
    );
};
