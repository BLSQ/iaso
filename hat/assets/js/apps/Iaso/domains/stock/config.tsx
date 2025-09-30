import React, { useMemo } from 'react';
import { Column, IconButton, useSafeIntl } from 'bluesquare-components';
import { RedirectFn } from 'bluesquare-components/dist/types/Routing/redirections';
import { DateTimeCell } from 'Iaso/components/Cells/DateTimeCell';

import DeleteDialog from 'Iaso/components/dialogs/DeleteDialogComponent';
import Workflow from 'Iaso/components/svg/Workflow';
import { baseUrls } from 'Iaso/constants/urls';

import { ProjectChips } from 'Iaso/domains/projects/components/ProjectChips';
import { ChipsGroup } from 'Iaso/domains/stock/components/ChipsGroup';
import { FormsGroup } from 'Iaso/domains/stock/components/FormsGroup';
import { EditSkuDialog } from 'Iaso/domains/stock/components/SkuDialog';
import {
    StockKeepingUnit,
    StockKeepingUnitDto,
    StockRulesVersion,
} from 'Iaso/domains/stock/types/stocks';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import MESSAGES from './messages';

export const baseUrl = baseUrls.stockKeepingUnits;

type Props = {
    publishedVersion?: StockRulesVersion;
    redirectTo: RedirectFn;
    deleteSku: (e: StockKeepingUnit) => void;
    saveSku: (e: StockKeepingUnitDto) => void;
};

export const useColumns = ({
    publishedVersion,
    redirectTo,
    deleteSku,
    saveSku,
}: Props): Array<Column> => {
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();
    return useMemo(
        () => [
            {
                Header: 'Id',
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
                Header: formatMessage(MESSAGES.short_name),
                id: 'short_name',
                accessor: 'short_name',
            },
            {
                Header: formatMessage(MESSAGES.projects),
                id: 'projects',
                accessor: 'projects',
                sortable: false,
                Cell: settings => {
                    const { projects } = settings.row.original;
                    return <ProjectChips projects={projects} />;
                },
            },
            {
                Header: formatMessage(MESSAGES.orgUnitsTypes),
                id: 'orgUnitTypes',
                accessor: 'org_unit_types',
                sortable: false,
                Cell: settings => {
                    const { org_unit_types } = settings.row.original;
                    return ChipsGroup(org_unit_types);
                },
            },
            {
                Header: formatMessage(MESSAGES.forms),
                id: 'forms',
                accessor: 'forms',
                sortable: false,
                Cell: settings => {
                    const { forms } = settings.row.original;
                    return FormsGroup(forms);
                },
            },
            {
                Header: formatMessage(MESSAGES.created_at),
                id: 'created_at',
                accessor: 'created_at',
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.updated_at),
                id: 'updated_at',
                accessor: 'updated_at',
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.actions),
                resizable: false,
                sortable: false,
                accessor: 'actions',
                Cell: settings => {
                    const sku = settings.row.original as StockKeepingUnit;
                    return (
                        <>
                            <EditSkuDialog
                                initialData={{
                                    ...sku,
                                    org_unit_types: sku.org_unit_types?.map(
                                        type => type.id,
                                    ),
                                    projects: sku.projects?.map(
                                        project => project.id,
                                    ),
                                    forms: sku.forms?.map(form => form.id),
                                    children: sku.children?.map(
                                        children => children.id,
                                    ),
                                }}
                                iconProps={{}}
                                titleMessage={MESSAGES.updateMessage}
                                saveSku={saveSku}
                            />
                            <DeleteDialog
                                keyName={`delete-sku-${sku.id}`}
                                titleMessage={MESSAGES.deleteTitle}
                                message={MESSAGES.deleteText}
                                onConfirm={() => deleteSku(sku)}
                            />
                            {publishedVersion != null && (
                                <IconButton
                                    id={`rules-link-${sku.id}`}
                                    url={`/${baseUrls.stockRulesVersions}/versionId/${publishedVersion.id}/skuId/${sku.id}/`}
                                    tooltipMessage={MESSAGES.rules}
                                    overrideIcon={Workflow}
                                />
                            )}
                        </>
                    );
                },
            },
        ],
        [
            currentUser,
            deleteSku,
            formatMessage,
            saveSku,
            publishedVersion,
            redirectTo,
        ],
    );
};
