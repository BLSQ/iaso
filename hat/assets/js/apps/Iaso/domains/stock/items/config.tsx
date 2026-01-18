import React, { useMemo } from 'react';
import {
    Column,
    IconButton,
    Setting,
    textPlaceholder,
    useSafeIntl,
} from 'bluesquare-components';

import { DateTimeCell } from 'Iaso/components/Cells/DateTimeCell';
import { baseUrls } from 'Iaso/constants/urls';

import { LinkToInstance } from 'Iaso/domains/instances/components/LinkToInstance';
import { LinkToOrgUnit } from 'Iaso/domains/orgUnits/components/LinkToOrgUnit';
import { useGetImpacts } from 'Iaso/domains/stock/hooks/useGetImpacts';
import { StockItem, StockLedgerItem } from 'Iaso/domains/stock/types/stocks';
import MESSAGES from '../messages';

export const baseUrl = baseUrls.stockItems;

export const useColumns = (): Array<Column> => {
    const { formatMessage } = useSafeIntl();

    return useMemo(
        () => [
            {
                Header: formatMessage(MESSAGES.orgUnit),
                id: 'org_unit',
                accessor: 'org_unit',
                Cell: ({ row: { original: item } }: Setting<StockItem>) => (
                    <LinkToOrgUnit orgUnit={item.org_unit} />
                ),
            },
            {
                Header: formatMessage(MESSAGES.sku),
                id: 'sku',
                accessor: 'sku',
                Cell: ({ row: { original: item } }: Setting<StockItem>) =>
                    item.sku.name,
            },
            {
                Header: formatMessage(MESSAGES.value),
                id: 'value',
                accessor: 'value',
                Cell: ({ row: { original: item } }: Setting<StockItem>) =>
                    item.value.toString(),
            },
            {
                Header: formatMessage(MESSAGES.actions),
                resizable: false,
                sortable: false,
                accessor: 'actions',
                Cell: ({ row: { original: item } }: Setting<StockItem>) => {
                    return (
                        <IconButton
                            url={`/${baseUrls.stockItems}/id/${item.id}`}
                            icon={'remove-red-eye'}
                            tooltipMessage={MESSAGES.see}
                        />
                    );
                },
            },
        ],
        [formatMessage],
    );
};

export const useDetailsColumns = (): Array<Column> => {
    const { formatMessage } = useSafeIntl();
    const impacts = useGetImpacts();

    return useMemo(
        () => [
            {
                Header: formatMessage(MESSAGES.orgUnit),
                id: 'org_unit',
                accessor: 'org_unit',
                Cell: ({
                    row: { original: item },
                }: Setting<StockLedgerItem>) => (
                    <LinkToOrgUnit orgUnit={item.org_unit} />
                ),
            },
            {
                Header: formatMessage(MESSAGES.sku),
                id: 'sku',
                accessor: 'sku',
                Cell: ({ row: { original: item } }: Setting<StockLedgerItem>) =>
                    item.sku.name,
            },
            {
                Header: formatMessage(MESSAGES.submission),
                id: 'submission',
                accessor: 'submission',
                sortable: false,
                Cell: ({
                    row: { original: item },
                }: Setting<StockLedgerItem>) => {
                    if (item.submission_id == null) {
                        return textPlaceholder;
                    }
                    return (
                        <LinkToInstance
                            instanceId={item.submission_id.toString()}
                        />
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.question),
                id: 'question',
                accessor: 'question',
                sortable: false,
                Cell: ({
                    row: { original: item },
                }: Setting<StockLedgerItem>) => {
                    if (item.question == null) {
                        return textPlaceholder;
                    }
                    return item.question;
                },
            },
            {
                Header: formatMessage(MESSAGES.value),
                id: 'value',
                accessor: 'value',
                Cell: ({ row: { original: item } }: Setting<StockLedgerItem>) =>
                    item.value.toString(),
            },
            {
                Header: formatMessage(MESSAGES.impact),
                id: 'impact',
                accessor: 'impact',
                Cell: ({
                    row: { original: item },
                }: Setting<StockLedgerItem>) => {
                    const impact = impacts.find(
                        impact => impact.value === item.impact,
                    );
                    return <span>{impact?.label || item.impact}</span>;
                },
            },
            {
                Header: formatMessage(MESSAGES.created_at),
                id: 'created_at',
                accessor: 'created_at',
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.createdBy),
                id: 'created_by',
                accessor: 'created_by',
                Cell: ({ row: { original: item } }: Setting<StockLedgerItem>) =>
                    item.created_by.username,
            },
        ],
        [formatMessage, impacts],
    );
};
