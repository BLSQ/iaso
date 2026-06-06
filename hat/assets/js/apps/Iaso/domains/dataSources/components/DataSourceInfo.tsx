import React, { FunctionComponent, useMemo } from 'react';
import { Table, TableBody } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { WidgetPaperRow as Row } from '../../../components/papers/WidgetPaperRow';
import { DataSource } from '../types/dataSources';
import { getLabelsAndValues } from '../utils';

type Props = {
    dataSource?: DataSource;
};
export const DataSourceInfo: FunctionComponent<Props> = ({ dataSource }) => {
    const { formatMessage } = useSafeIntl();
    const dataSourceDetailFields = useMemo(() => {
        if (dataSource) {
            return getLabelsAndValues(dataSource, formatMessage);
        }
        return [];
    }, [dataSource, formatMessage]);

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
