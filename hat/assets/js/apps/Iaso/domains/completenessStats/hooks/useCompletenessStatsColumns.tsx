import React, { ReactElement, useMemo } from 'react';
import {
    IconButton as IconButtonComponent,
    useSafeIntl,
    Column,
} from 'bluesquare-components';
import AccountTreeIcon from '@material-ui/icons/AccountTree';
import { Box, LinearProgress } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import { ArrowUpward } from '@material-ui/icons';
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
import { genUrl } from '../../../routing/routing';

// From https://v4.mui.com/components/progress/
const LinearProgressWithLabel = props => (
    <Box display="flex" alignItems="center" flexDirection="column">
        <Box minWidth={35}>
            <Typography variant="body2" color="textSecondary">
                {`${Math.round(props.value)}%`}
            </Typography>
        </Box>
        <Box width="100%" mr={1}>
            {/* eslint-disable-next-line react/jsx-props-no-spreading */}
            <LinearProgress variant="determinate" {...props} />
        </Box>
    </Box>
);

export const useCompletenessStatsColumns = (
    router: Router,
    params: CompletenessRouterParams,
    completenessStats?: CompletenessApiResponse,
): Column[] => {
    const currentUser = useCurrentUser();
    const hasSubmissionPermission = userHasPermission(
        'iaso_submissions',
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
                        <span>
                            {settings.row.original.org_unit?.name ?? '--'}
                        </span>
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
                        <span>
                            {settings.row.original.org_unit_type?.name ?? '--'}
                        </span>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.parent),
                id: 'parent__name',
                accessor: 'parent__org_unit__name',
                sortable: true,
                Cell: settings => (
                    <span>
                        {settings.row.original.parent_org_unit?.name ?? '--'}
                    </span>
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
                                Cell: ({
                                    value,
                                }: FormStatRow): ReactElement => {
                                    return value.itself_target > 0 ? (
                                        <>
                                            {value.itself_has_instances ? (
                                                <span
                                                    title={formatMessage(
                                                        MESSAGES.itselfSubmissionCount,
                                                        {
                                                            value: value.itself_instances_count,
                                                        },
                                                    )}
                                                >
                                                    ✅
                                                </span>
                                            ) : (
                                                <>❌</>
                                            )}
                                        </>
                                    ) : (
                                        <div
                                            title={formatMessage(
                                                MESSAGES.itselfNoSubmissionExpected,
                                            )}
                                            style={{
                                                textDecoration:
                                                    'underline dotted',
                                            }}
                                        >
                                            N/A
                                        </div>
                                    );
                                },
                                sortable: true,
                            },
                            {
                                Header: formatMessage(MESSAGES.descendants),
                                id: `form_stats__${form.slug}__percent`,
                                accessor: `form_stats[${form.slug}]`,
                                Cell: ({
                                    value,
                                }: FormStatRow): ReactElement => {
                                    return value.descendants > 0 ? (
                                        <>
                                            <LinearProgressWithLabel
                                                value={value.percent}
                                            />
                                            {value.descendants_ok} /
                                            {value.descendants}
                                        </>
                                    ) : (
                                        <div
                                            title={formatMessage(
                                                MESSAGES.descendantsNoSubmissionExpected,
                                            )}
                                            style={{
                                                textDecoration:
                                                    'underline dotted',
                                            }}
                                        >
                                            N/A
                                        </div>
                                    );
                                },
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
                const childrenPageUrl = genUrl(router, {
                    parentId: settings.row.original.org_unit?.id,
                });
                const parentPageUrl = genUrl(router, {
                    parentId: settings.row.original.parent_org_unit?.id,
                });

                return (
                    <>
                        {!settings.row.original.is_root && (
                            <IconButtonComponent
                                url={childrenPageUrl}
                                tooltipMessage={MESSAGES.seeChildren}
                                overrideIcon={AccountTreeIcon}
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
        router,
        formatMessage,
        completenessStats,
        params,
        hasSubmissionPermission,
    ]);
};
