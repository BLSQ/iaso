import React, { ReactElement, useMemo } from 'react';
import {
    IconButton as IconButtonComponent,
    useSafeIntl,
    Column,
} from 'bluesquare-components';
import { ArrowUpward, AccountTree } from '@mui/icons-material';
import { Box, LinearProgress } from '@mui/material';
import Typography from '@mui/material/Typography';
import { Router } from 'react-router';
import MESSAGES from '../messages';
import { userHasPermission } from '../../users/utils';
import { useCurrentUser } from '../../../utils/usersUtils';
import { baseUrls } from '../../../constants/urls';
import {
    CompletenessApiResponse,
    CompletenessRouterParams,
    FormDesc,
    FormStatRow,
} from '../types';
import * as Permission from '../../../utils/permissions';
import { usetGetParentPageUrl } from '../utils';
import { DescendantsCell } from '../components/DescendantsCell';
import { ItselfCell } from '../components/ItselfCell';


export const useCompletenessStatsColumns = (
    router: Router,
    params: CompletenessRouterParams,
    completenessStats?: CompletenessApiResponse,
): Column[] => {
    const currentUser = useCurrentUser();

    const getParentPageUrl = usetGetParentPageUrl(router);
    const hasSubmissionPermission = userHasPermission(
        Permission.SUBMISSIONS,
        currentUser,
    );
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        let columns: Column[] = [
            {
                Header: formatMessage(MESSAGES.orgUnit),
                id: 'name',
                accessor: 'name',
                sortable: true,
                align: 'left',
                Cell: settings => {
                    return (
                        <>
                            {settings.row.original.org_unit?.name ?? '--'}
                        </>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.orgUnitType),
                id: 'org_unit_type__name',
                accessor: 'org_unit_type__name',
                sortable: true,
                Cell: settings => {
                    return (
                        <>
                            {settings.row.original.org_unit_type?.name ?? '--'}
                        </>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.parent),
                id: 'parent__name',
                accessor: 'parent__org_unit__name',
                sortable: true,
                Cell: settings => (
                    <>
                        {settings.row.original.parent_org_unit?.name ?? '--'}
                    </>
                ),
            },
            // {
            //     // Uncomment for debug
            //     Header: 'DEBUG',
            //     id: 'form_stats',
            //     accessor: 'form_stats',
            //     sortable: false,
            //     Cell: settings => JSON.stringify(settings.value),
            // },
        ];
        // Add column and sub columns per form
        // console.dir(completenessStats);
        if (completenessStats?.forms) {
            columns = columns.concat(
                completenessStats.forms.map((form: FormDesc): Column => {
                    return {
                        Header: form.name,
                        id: `form_stats[${form.slug}]`,
                        accessor: `form_stats[${form.slug}]`,
                        sortable: false,
                        Cell: settings => JSON.stringify(settings.value) ?? '',
                        columns: [
                            {
                                Header: (
                                    <div
                                        title={formatMessage(
                                            MESSAGES.itselfColumnTitle,
                                        )}
                                        style={{
                                            textDecoration: 'underline dotted',
                                        }}
                                    >
                                        {formatMessage(
                                            MESSAGES.itselfColumnLabel,
                                        )}
                                    </div>
                                ),
                                id: `form_stats__${form.slug}__itself_has_instances`,
                                accessor: `form_stats[${form.slug}]`,
                                Cell: ItselfCell,
                                sortable: true,
                            },
                            {
                                Header: formatMessage(MESSAGES.descendants),
                                id: `form_stats__${form.slug}__percent`,
                                accessor: `form_stats[${form.slug}]`,
                                Cell: DescendantsCell,
                                sortable: true,
                            },
                        ],
                    };
                }),
            );
        }
        columns.push({
            Header: formatMessage(MESSAGES.actions),
            id: 'actions',
            accessor: 'actions',
            sortable: false,
            Cell: settings => {
                const formStats = settings.row.original.form_stats;
                const orgunitId = settings.row.original.org_unit.id;
                const hasFormSubmissions = Object.values(formStats).some(
                    (stat: any) => stat.itself_has_instances > 0,
                );
                const childrenPageUrl = getParentPageUrl(
                    settings.row.original.org_unit?.id,
                );
                const parentPageUrl = getParentPageUrl(
                    settings.row.original.parent_org_unit?.id,
                );

                return (
                    <>
                        {!settings.row.original.is_root &&
                            settings.row.original.has_children && (
                                <IconButtonComponent
                                    url={childrenPageUrl}
                                    tooltipMessage={MESSAGES.seeChildren}
                                    overrideIcon={AccountTree}
                                />
                            )}
                        {settings.row.original.is_root && (
                            <IconButtonComponent
                                url={parentPageUrl}
                                tooltipMessage={MESSAGES.seeParent}
                                overrideIcon={ArrowUpward}
                            />
                        )}
                        {hasSubmissionPermission && hasFormSubmissions && (
                            <IconButtonComponent
                                id={`form-link-${settings.row.original.id}`}
                                url={`/${baseUrls.instances}/accountId/${params.accountId}/page/1/levels/${orgunitId}`}
                                icon="remove-red-eye"
                                tooltipMessage={MESSAGES.viewInstances}
                            />
                        )}
                    </>
                );
            },
        });
        return columns;
    }, [
        formatMessage,
        completenessStats?.forms,
        getParentPageUrl,
        hasSubmissionPermission,
        params.accountId,
    ]);
};
