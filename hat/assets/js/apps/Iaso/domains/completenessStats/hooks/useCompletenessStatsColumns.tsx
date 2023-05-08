import React, { ReactElement, useMemo } from 'react';
import {
    IconButton as IconButtonComponent,
    useSafeIntl,
} from 'bluesquare-components';
import { useDispatch } from 'react-redux';
import { cloneDeep } from 'lodash';
import AccountTreeIcon from '@material-ui/icons/AccountTree';
import { Box, LinearProgress } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import { ArrowUpward } from '@material-ui/icons';
import { redirectTo } from '../../../routing/actions';
import MESSAGES from '../messages';
import { baseUrls } from '../../../constants/urls';
import {
    CompletenessApiResponse,
    CompletenessRouterParams,
    FormDesc,
    FormStatRow,
} from '../types';
import { Column } from '../../../types/table';
import { useGetOrgUnitDetail } from '../../orgUnits/hooks/requests/useGetOrgUnitDetail';

const baseUrl = `${baseUrls.completenessStats}`;

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
    params: CompletenessRouterParams,
    completenessStats?: CompletenessApiResponse,
): Column[] => {
    const { formatMessage } = useSafeIntl();
    const redirectionParams: CompletenessRouterParams = useMemo(() => {
        const clonedParams = cloneDeep(params);
        delete clonedParams.parentId;
        return clonedParams;
    }, [params]);
    const dispatch = useDispatch();
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
                const { data: orgunit } = useGetOrgUnitDetail(
                    settings.row.original.id,
                );
                const orgunitName = orgunit?.name;
                return (
                    <>
                        {!settings.row.original.is_root && (
                            <IconButtonComponent
                                onClick={() => {
                                    dispatch(
                                        redirectTo(baseUrl, {
                                            ...redirectionParams,
                                            parentId:
                                                settings.row.original.org_unit
                                                    ?.id,
                                        }),
                                    );
                                }}
                                tooltipMessage={MESSAGES.seeChildren}
                                overrideIcon={AccountTreeIcon}
                            />
                        )}
                        {settings.row.original.is_root && (
                            <IconButtonComponent
                                onClick={() => {
                                    dispatch(
                                        redirectTo(baseUrl, {
                                            ...redirectionParams,
                                            parentId:
                                                settings.row.original
                                                    .parent_org_unit?.id,
                                        }),
                                    );
                                }}
                                tooltipMessage={MESSAGES.seeParent}
                                overrideIcon={ArrowUpward}
                            />
                        )}
                        {settings.row.original.form_stats && (
                            <IconButtonComponent
                                id={`form-link-${settings.row.original.id}`}
                                url={`/${baseUrls.instances}/accountId/${params.accountId}/page/1/tab/list/search/${orgunitName}`}
                                icon="remove-red-eye"
                                tooltipMessage={MESSAGES.viewInstances}
                            />
                        )}
                    </>
                );
            },
        });
        return columns;
    }, [dispatch, formatMessage, redirectionParams, completenessStats, params]);
};
