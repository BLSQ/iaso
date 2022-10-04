/* eslint-disable camelcase */
import React, { useMemo, useState } from 'react';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    IconButton as IconButtonComponent,
    // @ts-ignore
    useSkipEffectOnMount,
} from 'bluesquare-components';
// import moment from 'moment';
import { Box, makeStyles } from '@material-ui/core';
import LockIcon from '@material-ui/icons/Lock';
// import Settings from '@material-ui/icons/Settings';
import MESSAGES from '../../../constants/messages';
import { Column } from '../../../../../../../hat/assets/js/apps/Iaso/types/table';
import { BUDGET_DETAILS } from '../../../constants/routes';
import { DateTimeCellRfc } from '../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
// import { BudgetFilesModal } from '../BudgetFilesModal';
// import { CreateEditBudgetEvent } from '../CreateEditBudgetEvent/CreateEditBudgetEvent';
// import {
//     Profile,
//     useCurrentUser,
// } from '../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
// import DeleteDialog from '../../../../../../../hat/assets/js/apps/Iaso/components/dialogs/DeleteDialogComponent';
// import {
//     useDeleteBudgetEvent,
//     useRestoreBudgetEvent,
// } from '../../../hooks/useDeleteBudgetEvent';
// import { useGetTeams } from '../../../hooks/useGetTeams';
import {
    // formatTargetTeams,
    // formatUserName,
    makeFileLinks,
    makeLinks,
} from '../utils';
import { Optional } from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { convertObjectToString } from '../../../utils';
import { formatThousand } from '../../../../../../../hat/assets/js/apps/Iaso/utils';
import { formatComment } from '../cards/utils';
import { BudgetStep } from '../mockAPI/useGetBudgetDetails';

const baseUrl = BUDGET_DETAILS;

export const styles = theme => {
    return {
        deletedRow: {
            color: theme.palette.secondary.main,
        },
        paragraph: { margin: 0 },
    };
};

// @ts-ignore
const useStyles = makeStyles(styles);
const getStyle = classes => settings => {
    const isDeleted = Boolean(settings.row.original.deleted_at);
    return isDeleted ? classes.deletedRow : '';
};

export const useBudgetColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        const cols = [
            {
                Header: formatMessage(MESSAGES.obrName),
                accessor: 'obr_name',
            },
            {
                Header: formatMessage(MESSAGES.country),
                accessor: 'country_name',
                sortable: true,
            },

            {
                Header: formatMessage(MESSAGES.status),
                sortable: true,
                accessor: 'current_state__label',
                Cell: settings =>
                    settings.row.original.current_state?.label ?? '--',
            },
            // TODO delete translation keys along with dead code
            // {
            //     Header: formatMessage(MESSAGES.latestEvent),
            //     sortable: true,
            //     accessor: 'last_budget_event__type',
            //     Cell: settings => {
            //         const type = settings.row.original.last_budget_event?.type;
            //         if (type) {
            //             return formatMessage(MESSAGES[type]);
            //         }
            //         return '--';
            //     },
            // },
            // {
            //     Header: formatMessage(MESSAGES.latestEventDate),
            //     sortable: true,
            //     accessor: 'last_budget_event__created_at',
            //     Cell: settings => {
            //         const date =
            //             settings.row.original.last_budget_event?.created_at;
            //         if (date) {
            //             return moment(date).format('LTS');
            //         }
            //         return '--';
            //     },
            // },
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'id',
                sortable: false,
                Cell: settings => {
                    return (
                        <IconButtonComponent
                            icon="remove-red-eye"
                            tooltipMessage={MESSAGES.details}
                            url={`${baseUrl}/campaignName/${settings.row.original.obr_name}/`}
                        />
                    );
                },
            },
        ];
        return cols;
    }, [formatMessage]);
};

export const useBudgetDetailsColumns = ({ data }): Column[] => {
    const classes = useStyles();
    const getRowColor = getStyle(classes);
    const { formatMessage } = useSafeIntl();
    // const { data: teams = [] } = useGetTeams();
    // const currentUser = useCurrentUser();
    // const { mutateAsync: deleteBudgetEvent } = useDeleteBudgetEvent();
    // const { mutateAsync: restoreBudgetEvent } = useRestoreBudgetEvent();
    const showInternalColumn = Boolean(
        data?.find(details => details.internal === true),
    );
    return useMemo(() => {
        const defaultColumns = [
            {
                Header: formatMessage(MESSAGES.event),
                id: 'transition_label',
                accessor: 'transition_label',
                sortable: false,
                Cell: settings => {
                    return (
                        <span className={getRowColor(settings)}>
                            {settings.row.original.transition_label}
                        </span>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.comment),
                id: 'comment',
                accessor: 'comment',
                sortable: false,
                Cell: settings => {
                    const { comment } = settings.row.original;
                    return (
                        <span className={getRowColor(settings)}>
                            {comment ? formatComment(comment) : '--'}
                        </span>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.author),
                id: 'created_by',
                accessor: 'created_by',
                sortable: false,
                Cell: settings => {
                    const {
                        created_by: authorName,
                        created_by_team: authorTeam,
                    } = settings.row.original;

                    return (
                        <>
                            <p
                                className={`${getRowColor(settings)} ${
                                    classes.paragraph
                                }`}
                            >
                                {authorName}
                            </p>
                            {authorTeam && (
                                <p
                                    className={`${getRowColor(settings)} ${
                                        classes.paragraph
                                    }`}
                                >
                                    {authorTeam}
                                </p>
                            )}
                        </>
                    );
                },
            },
            // {
            //     Header: formatMessage(MESSAGES.destination),
            //     id: 'target_teams',
            //     accessor: 'target_teams',
            //     sortable: false,
            //     Cell: settings => {
            //         const { target_teams } = settings.row.original;
            //         const teamsToDisplay = formatTargetTeams(
            //             target_teams,
            //             teams,
            //         );
            //         return (
            //             <span className={getRowColor(settings)}>
            //                 {teamsToDisplay}
            //             </span>
            //         );
            //     },
            // },
            {
                Header: formatMessage(MESSAGES.created_at),
                id: 'created_at',
                accessor: 'created_at',
                sortable: false,
                Cell: settings => {
                    return (
                        <span className={getRowColor(settings)}>
                            {DateTimeCellRfc(settings)}
                        </span>
                    );
                },
            },
            {
                Header: `${formatMessage(MESSAGES.amount)} (USD)`,
                id: 'amount',
                accessor: 'amount',
                sortable: false,
                Cell: settings => {
                    const { amount } = settings.row.original;

                    if (amount) {
                        return (
                            <span className={getRowColor(settings)}>
                                {formatThousand(parseInt(amount, 10))}
                            </span>
                        );
                    }
                    return <span className={getRowColor(settings)}>--</span>;
                },
            },
            {
                Header: `${formatMessage(MESSAGES.actions)}`,
                id: 'files',
                accessor: 'files',
                sortable: false,
                Cell: settings => {
                    const { files, links } = settings.row.original;
                    return (
                        <Box mt={2}>
                            {makeFileLinks(files)}
                            {makeLinks(links)}
                        </Box>
                    );
                },
            },
            // TODO delete unused messages
            // {
            //     Header: formatMessage(MESSAGES.actions),
            //     id: 'id',
            //     accessor: 'id',
            //     sortable: false,
            //     Cell: settings => {
            //         // const { author } = settings.row.original;
            //         // const authorProfile = profiles?.profiles?.find(
            //         //     profile => profile.user_id === author,
            //         // );
            //         // const authorName =
            //         //     authorProfile?.first_name && authorProfile?.last_name
            //         //         ? `${authorProfile.first_name} ${authorProfile.last_name}`
            //         //         : authorProfile?.user_name ?? '';
            //         // const userIsAuthor =
            //         //     authorProfile?.user_id === currentUser.user_id;
            //         // const { target_teams } = settings.row.original;
            //         // const teamNames = teams
            //         //     ?.filter(team => target_teams.includes(team.id))
            //         //     .map(team => team.name)
            //         //     .join(', ');
            //         return (
            //             <section>
            //                 <BudgetFilesModal
            //                     eventId={settings.row.original.id}
            //                     note={settings.row.original.comment}
            //                     date={settings.row.original.created_at}
            //                     type={settings.row.original.type}
            //                     links={settings.row.original.links}
            //                     author={settings.row.original.created_by}
            //                     files={settings.row.original.files}
            //                     // recipients={teamNames}
            //                     iconColor={
            //                         settings.row.original.deleted_at
            //                             ? 'secondary'
            //                             : 'action'
            //                     }
            //                 />
            //                 {/* {!settings.row.original.is_finalized &&
            //                     settings.row.original.author ===
            //                         currentUser.user_id && (
            //                         <CreateEditBudgetEvent
            //                             campaignId={
            //                                 settings.row.original.campaign
            //                             }
            //                             type="edit"
            //                             budgetEvent={settings.row.original}
            //                             iconProps={{ type: 'edit' }}
            //                         />
            //                     )} */}
            //                 {/* {!settings.row.original.deleted_at &&
            //                     userIsAuthor && (
            //                         <DeleteDialog
            //                             titleMessage={
            //                                 MESSAGES.deleteBudgetEvent
            //                             }
            //                             message={MESSAGES.deleteBudgetEvent}
            //                             onConfirm={() =>
            //                                 deleteBudgetEvent(
            //                                     settings.row.original.id,
            //                                 )
            //                             }
            //                             keyName={`deleteBudgetEvent-${settings.row.original.id}`}
            //                         />
            //                     )}
            //                 {settings.row.original.deleted_at &&
            //                     userIsAuthor && (
            //                         <IconButtonComponent
            //                             color="secondary"
            //                             icon="restore-from-trash"
            //                             tooltipMessage={MESSAGES.restore}
            //                             onClick={() =>
            //                                 restoreBudgetEvent(
            //                                     settings.row.original.id,
            //                                 )
            //                             }
            //                         />
            //                     )} */}
            //             </section>
            //         );
            //     },
            // },
        ];
        if (showInternalColumn) {
            return [
                {
                    Header: '',
                    id: 'internal',
                    accessor: 'internal',
                    sortable: false,
                    width: 1,
                    Cell: settings => {
                        const { internal } = settings.row.original;
                        return internal ? (
                            <LockIcon
                                className={getRowColor(settings)}
                                color="action"
                            />
                        ) : (
                            <></>
                        );
                    },
                },
                ...defaultColumns,
            ];
        }
        return defaultColumns;
    }, [formatMessage, showInternalColumn, getRowColor, classes.paragraph]);
};

type Params = {
    events: Optional<BudgetStep[]>;
    // profiles: Profile[];
    params: Record<string, any>;
};

export const useTableState = ({
    events,
    // profiles,
    params,
}: Params): { resetPageToOne: unknown; columns: Column[] } => {
    const { campaignName, campaignId } = params;
    const [resetPageToOne, setResetPageToOne] = useState('');

    useSkipEffectOnMount(() => {
        const newParams = {
            ...params,
        };
        delete newParams.page;
        delete newParams.order;
        setResetPageToOne(convertObjectToString(newParams));
    }, [params.pageSize, campaignId, campaignName]);

    const columns = useBudgetDetailsColumns({
        // profiles,
        data: events,
    });

    return useMemo(() => {
        return {
            resetPageToOne,
            columns,
        };
    }, [columns, resetPageToOne]);
};
