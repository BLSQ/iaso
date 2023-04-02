import React, { useMemo } from 'react';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    IconButton as IconButtonComponent,
    InfoHeader,
} from 'bluesquare-components';
import { useDispatch } from 'react-redux';
import { cloneDeep } from 'lodash';
import AccountTreeIcon from '@material-ui/icons/AccountTree';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import Tooltip from '@material-ui/core/Tooltip';
import { Box, LinearProgress } from '@material-ui/core';
import { redirectTo } from '../../../routing/actions';
import MESSAGES from '../messages';
import { baseUrls } from '../../../constants/urls';
import Typography from '@material-ui/core/Typography';
import { ArrowUpward } from '@material-ui/icons';

const baseUrl = `${baseUrls.completenessStats}`;

// From https://v4.mui.com/components/progress/ to clean
const LinearProgressWithLabel = props => (
    <Box display="flex" alignItems="center" flexDirection={'column'}>
        <Box minWidth={35}>
            <Typography variant="body2" color="textSecondary">{`${Math.round(
                props.value,
            )}%`}</Typography>
        </Box>
        <Box width="100%" mr={1}>
            <LinearProgress variant="determinate" {...props} />
        </Box>
    </Box>
);

export type FormDesc = {
    id: number;
    name: string;
    slug: string;
};

export type FormStat = {
    descendants: number; // int
    descendants_ok: number; // int
    percent: number; // on 1
    total_instances: number; // total number of instance
    name: string; // Name of the form (for debug)
    itself_target: number; // Does this orgunit need to fill 0 if No, 1 if yes
    itself_has_instances: number; // Does this orgunit has submission? (idem)
    itself_instances_count: number; // Number of submission on this orgunit
};

export type FormStatRow = {
    value: FormStat;
};
export const useCompletenessStatsColumns = (params: any, completenessStats) => {
    const { formatMessage } = useSafeIntl();
    const redirectionParams: Record<string, any> = useMemo(() => {
        const clonedParams = cloneDeep(params);
        delete clonedParams.parentId;
        return clonedParams;
    }, [params]);
    const dispatch = useDispatch();
    return useMemo(() => {
        let columns = [
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
                id: 'parent_org_unit__name',
                accessor: 'parent_org_unit__name',
                sortable: false,
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
            // {
            //     Header: formatMessage(MESSAGES.form),
            //     id: 'form__name',
            //     accessor: 'form__name',
            //     sortable: false,
            //     Cell: settings => (
            //         <span>{settings.row.original.form?.name ?? '--'}</span>
            //     ),
            // },
            // {
            //     Header: formatMessage(MESSAGES.formsFilledDirect),
            //     id: 'forms_filled_direct',
            //     accessor: 'forms_filled_direct',
            //     sortable: false,
            //     Cell: settings => (
            //         <Box>
            //             <Box
            //                 style={{
            //                     // marginTop: '2px', // The margin will align the icon in FF but misalign it in Chrome
            //                     display: 'inline-flex',
            //                     alignItems: 'center',
            //                 }}
            //             >
            //                 {`${
            //                     settings.row.original.forms_filled_direct ??
            //                     '--'
            //                 }/
            //                 ${
            //                     settings.row.original.forms_to_fill_direct ??
            //                     '--'
            //                 }`}
            //             </Box>
            //             {settings.row.original
            //                 .has_multiple_direct_submissions && (
            //                 <Tooltip
            //                     title={formatMessage(
            //                         MESSAGES.orgUnitHasMultipleSubmissions,
            //                     )}
            //                 >
            //                     <Box
            //                         style={{
            //                             display: 'inline-flex',
            //                             alignItems: 'center',
            //                             verticalAlign: 'middle',
            //                         }}
            //                     >
            //                         <AddCircleOutlineIcon
            //                             style={{
            //                                 fontSize: '16px',
            //                                 marginLeft: '4px',
            //                             }}
            //                             color="action"
            //                         />
            //                     </Box>
            //                 </Tooltip>
            //             )}
            //         </Box>
            //     ),
            // },
            // {
            //     Header: formatMessage(MESSAGES.completenessDirect),
            //     id: 'completeness_ratio_direct',
            //     accessor: 'completeness_ratio_direct',
            //     sortable: false,
            // },
            // {
            //     Header: formatMessage(MESSAGES.formsFilledWithDescendants),
            //     id: 'forms_filled',
            //     accessor: 'forms_filled',
            //     sortable: false,
            //     Cell: settings => (
            //         <span>
            //             {settings.row.original.forms_filled ?? '--'}/
            //             {settings.row.original.forms_to_fill ?? '--'}
            //         </span>
            //     ),
            // },
            // {
            //     Header: formatMessage(MESSAGES.completenessWithDescendants),
            //     id: 'completeness_ratio',
            //     accessor: 'completeness_ratio',
            //     sortable: false,
            // },
        ];
        // Add column and sub column per form
        // console.dir(completenessStats);
        if (completenessStats?.forms) {
            columns = columns.concat(
                completenessStats.forms.map((form: FormDesc) => {
                    return {
                        Header: form.name,
                        id: `form_stats[${form.slug}]`,
                        accessor: `form_stats[${form.slug}]`,

                        // accessor: 'completeness_ratio',
                        sortable: false,
                        Cell: settings => JSON.stringify(settings.value) ?? '',
                        columns: [
                            {
                                Header: (
                                    <InfoHeader
                                        message={'Submission on this org unit'}
                                    >
                                        Own
                                    </InfoHeader>
                                ),
                                id: `form_stats__${form.slug}__itself_has_instances`,
                                accessor: `form_stats[${form.slug}]`,
                                Cell: ({ value }: FormStatRow) => {
                                    return value.itself_target > 0 ? (
                                        <>
                                            {value.itself_has_instances ? (
                                                <span
                                                    title={`Total #submission ${value.itself_instances_count}`}
                                                >
                                                    ✅
                                                </span>
                                            ) : (
                                                <>❌</>
                                            )}
                                        </>
                                    ) : (
                                        <div
                                            title={
                                                "This level doesn't need to fill this form"
                                            }
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
                                Header: 'Descendants',
                                // id: `form_stats[${form.slug}].global_status`,
                                id: `form_stats__${form.slug}__percent`,
                                accessor: `form_stats[${form.slug}]`,
                                Cell: ({ value }: FormStatRow) => {
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
                                            title={
                                                'No descendant OrgUnit require filling for that form. See Form config if this is unexpected'
                                            }
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
                            // {
                            //     Header: (
                            //         <InfoHeader
                            //             message={
                            //                 'Number of org unit to fill for this form'
                            //             }
                            //         >
                            //             Target
                            //         </InfoHeader>
                            //     ),
                            //     id: `form_stats[${form.slug}].descendants`,
                            //     accessor: `form_stats[${form.slug}].descendants`,
                            //     Cell: ({ value }) => <>{value}</>,
                            //     sortable: false,
                            // },
                            // {
                            //     Header: (
                            //         <InfoHeader
                            //             message={
                            //                 'Submissions filled on org unit bellow'
                            //             }
                            //         >
                            //             Submissions
                            //         </InfoHeader>
                            //     ),
                            //     id: `form_stats[${form.slug}].total_instances`,
                            //     accessor: `form_stats[${form.slug}].total_instances`,
                            //     Cell: ({ value }) => <>{value}</>,
                            //     sortable: false,
                            // },
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
                                tooltipMessage={MESSAGES.seeChildren}
                                overrideIcon={ArrowUpward}
                            />
                        )}
                    </>
                );
            },
        });
        console.log(columns);
        return columns;
    }, [dispatch, formatMessage, redirectionParams, completenessStats]);
};
