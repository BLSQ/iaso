import React, { FunctionComponent, useMemo } from 'react';
import { Table, TableBody } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { useCurrentAccount } from 'Iaso/domains/accounts/hooks';
import { WidgetPaperRow as Row } from '../../../components/papers/WidgetPaperRow';
import { DataSource } from '../types/dataSources';
import { getLabelsAndValues } from '../utils';

type Props = {
    dataSource?: DataSource;
};
export const DataSourceInfo: FunctionComponent<Props> = ({ dataSource }) => {
    const { formatMessage } = useSafeIntl();
    const currentAccount = useCurrentAccount();
    const dataSourceDetailFields = useMemo(() => {
        if (dataSource) {
            return getLabelsAndValues(
                dataSource,
                formatMessage,
                currentAccount,
            );
        }
        return [];
    }, [dataSource, formatMessage, currentAccount]);

    return (
        <Table size="small">
            <TableBody>
                {dataSourceDetailFields.map(field => (
                    <Row field={field} key={field.label} />
                ))}
            </TableBody>
        </Table>
    );
};
