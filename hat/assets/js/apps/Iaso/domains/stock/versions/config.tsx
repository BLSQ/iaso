import React, { useMemo } from 'react';
import { Column, textPlaceholder, useSafeIntl } from 'bluesquare-components';

import DeleteDialog from 'Iaso/components/dialogs/DeleteDialogComponent';
import { baseUrls } from 'Iaso/constants/urls';

import { LinkToForm } from 'Iaso/domains/forms/components/LinkToForm';
import { useGetImpacts } from 'Iaso/domains/stock/hooks/useGetImpacts';
import {
    Status,
    StockItemRule,
    StockItemRuleDto,
    StockRulesVersion,
} from 'Iaso/domains/stock/types/stocks';
import { VersionsActionCell } from 'Iaso/domains/stock/versions/components/ActionCell';
import { EditRuleDialog } from 'Iaso/domains/stock/versions/components/RuleDialog';
import { StatusCell } from 'Iaso/domains/stock/versions/components/StatusCell';
import MESSAGES from '../messages';

export const baseUrl = baseUrls.stockRulesVersions;

export const useVersionsColumns = (): Array<Column> => {
    const { formatMessage } = useSafeIntl();

    return useMemo(
        () => [
            {
                Header: formatMessage(MESSAGES.version),
                id: 'id',
                accessor: 'id',
                width: 80,
            },
            {
                Header: formatMessage(MESSAGES.name),
                id: 'name',
                accessor: 'name',
            },
            {
                Header: formatMessage(MESSAGES.status),
                id: 'status',
                accessor: 'status',
                Cell: settings => {
                    const { status } = settings.row.original;
                    return <StatusCell status={status} />;
                },
            },
            {
                Header: formatMessage(MESSAGES.actions),
                resizable: false,
                sortable: false,
                accessor: 'actions',
                Cell: settings => {
                    return (
                        <VersionsActionCell
                            version={settings.row.original as StockRulesVersion}
                        />
                    );
                },
            },
        ],
        [formatMessage],
    );
};

export const useRulesColumns = (
    version: StockRulesVersion | undefined,
    saveRule: (rule: StockItemRuleDto) => void,
    deleteRule: (rule: StockItemRule) => void,
): Array<Column> => {
    const { formatMessage } = useSafeIntl();
    const impacts = useGetImpacts();
    return useMemo(
        () => [
            {
                Header: formatMessage(MESSAGES.sku),
                id: 'sku__name',
                accessor: 'sku.name',
            },
            {
                Header: formatMessage(MESSAGES.form),
                id: 'form__name',
                accessor: 'form.name',
                Cell: settings => {
                    const rule = settings.row.original as StockItemRule;
                    return (
                        <LinkToForm
                            key={rule.form.id}
                            formId={rule.form.id}
                            formName={rule.form.name}
                        />
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.question),
                id: 'question',
                accessor: 'question',
            },
            {
                Header: formatMessage(MESSAGES.impact),
                id: 'impact',
                accessor: 'impact',
                Cell: settings => {
                    const rule = settings.row.original as StockItemRule;
                    const impact = impacts.find(
                        impact => impact.value === rule.impact,
                    );
                    return <span>{impact?.label || rule.impact}</span>;
                },
            },
            {
                Header: formatMessage(MESSAGES.actions),
                resizable: false,
                sortable: false,
                accessor: 'actions',
                Cell: settings => {
                    const rule = settings.row.original as StockItemRule;
                    if (version?.status !== 'DRAFT') {
                        return textPlaceholder;
                    }
                    return (
                        <>
                            <EditRuleDialog
                                titleMessage={formatMessage(MESSAGES.edit)}
                                initialData={{
                                    ...rule,
                                    sku: rule.sku?.id,
                                    form: rule.form?.id,
                                }}
                                saveRule={saveRule}
                                iconProps={{}}
                            />
                            <DeleteDialog
                                keyName={`delete-sku-${rule.id}`}
                                titleMessage={MESSAGES.deleteTitle}
                                message={MESSAGES.deleteText}
                                onConfirm={() => deleteRule(rule)}
                            />
                        </>
                    );
                },
            },
        ],
        [formatMessage, impacts, saveRule, deleteRule, version],
    );
};
