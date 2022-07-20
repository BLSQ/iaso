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
import moment from 'moment';
import { makeStyles } from '@material-ui/core';
import LockIcon from '@material-ui/icons/Lock';
import MESSAGES from '../../../constants/messages';
import { Column } from '../../../../../../../hat/assets/js/apps/Iaso/types/table';
import { BUDGET_DETAILS } from '../../../constants/routes';
import { DateTimeCellRfc } from '../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import { BudgetFilesModal } from '../BudgetFilesModal';
import { CreateEditBudgetEvent } from '../CreateEditBudgetEvent/CreateEditBudgetEvent';
import {
    Profile,
    useCurrentUser,
} from '../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import DeleteDialog from '../../../../../../../hat/assets/js/apps/Iaso/components/dialogs/DeleteDialogComponent';
import {
    useDeleteBudgetEvent,
    useRestoreBudgetEvent,
} from '../../../hooks/useDeleteBudgetEvent';
import { useGetTeams } from '../../../hooks/useGetTeams';
import { formatTargetTeams, formatUserName } from '../utils';
import { BudgetEvent } from '../../../constants/types';
import { Optional } from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { convertObjectToString } from '../../../utils';

const baseUrl = BUDGET_DETAILS;

const styles = theme => {
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
                id: 'country__name',
                accessor: 'top_level_org_unit_name',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.virusNotificationDate),
                accessor: 'cvdpv2_notified_at',
            },
            {
                Header: formatMessage(MESSAGES.status),
                sortable: true,
                accessor: 'last_budget_event__status',
                Cell: settings => {
                    const status =
                        settings.row.original.last_budget_event?.status;
                    return status
                        ? formatMessage(MESSAGES[status])
                        : formatMessage(MESSAGES.noBudgetSubmitted);
                },
            },
            {
                Header: formatMessage(MESSAGES.latestEvent),
                sortable: true,
                accessor: 'last_budget_event__type',
                Cell: settings => {
                    const type = settings.row.original.last_budget_event?.type;
                    if (type) {
                        return formatMessage(MESSAGES[type]);
                    }
                    return '--';
                },
            },
            {
                Header: formatMessage(MESSAGES.latestEventDate),
                sortable: true,
                accessor: 'last_budget_event__created_at',
                Cell: settings => {
                    const date =
                        settings.row.original.last_budget_event?.created_at;
                    if (date) {
                        return moment(date).format('LTS');
                    }
                    return '--';
                },
            },
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'id',
                sortable: false,
                Cell: settings => {
                    return (
                        <IconButtonComponent
                            icon="remove-red-eye"
                            tooltipMessage={MESSAGES.details}
                            url={`${baseUrl}/campaignId/${settings.row.original.id}/campaignName/${settings.row.original.obr_name}/country/${settings.row.original.country}`}
                        />
                    );
                },
            },
        ];
        return cols;
    }, [formatMessage]);
};

export const useBudgetDetailsColumns = ({ profiles, data }): Column[] => {
    const classes = useStyles();
    const { data: teams = [] } = useGetTeams();
    const getRowColor = getStyle(classes);
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();
    const { mutateAsync: deleteBudgetEvent } = useDeleteBudgetEvent();
    const { mutateAsync: restoreBudgetEvent } = useRestoreBudgetEvent();
    const showInternalColumn = Boolean(
        data?.find(details => details.internal === true),
    );
    return useMemo(() => {
        const defaultColumns = [
            {
                Header: formatMessage(MESSAGES.created_at),
                id: 'created_at',
                accessor: 'created_at',
                sortable: true,
                Cell: settings => {
                    return (
                        <span className={getRowColor(settings)}>
                            {DateTimeCellRfc(settings)}
                        </span>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.event),
                id: 'type',
                accessor: 'type',
                sortable: true,
                Cell: settings => {
                    return (
                        <span className={getRowColor(settings)}>
                            {formatMessage(
                                MESSAGES[settings.row.original.type],
                            )}
                        </span>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.author),
                id: 'author',
                accessor: 'author',
                sortable: true,
                Cell: settings => {
                    const { author, type } = settings.row.original;
                    const authorProfile = profiles?.profiles?.find(
                        profile => profile.user_id === author,
                    );
                    const nameDisplayed = formatUserName(authorProfile);

                    const authorTeams = useMemo(
                        () => teams.filter(team => team.users.includes(author)),
                        [author],
                    );
                    const authorTeam =
                        type === 'validation'
                            ? authorTeams.find(team =>
                                  team.name.toLowerCase().includes('approval'),
                              )
                            : authorTeams.find(
                                  team =>
                                      !team.name
                                          .toLowerCase()
                                          .includes('approval'),
                              );
                    return (
                        <>
                            <p
                                className={`${getRowColor(settings)} ${
                                    classes.paragraph
                                }`}
                            >
                                {nameDisplayed}
                            </p>
                            {authorTeam && (
                                <p className={classes.paragraph}>
                                    {authorTeam.name}
                                </p>
                            )}
                        </>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.destination),
                id: 'target_teams',
                accessor: 'target_teams',
                sortable: false,
                Cell: settings => {
                    const { target_teams } = settings.row.original;
                    const teamsToDisplay = formatTargetTeams(
                        target_teams,
                        teams,
                    );
                    return (
                        <span className={getRowColor(settings)}>
                            {teamsToDisplay}
                        </span>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.actions),
                id: 'id',
                accessor: 'id',
                sortable: false,
                Cell: settings => {
                    const { author } = settings.row.original;
                    const authorProfile = profiles?.profiles?.find(
                        profile => profile.user_id === author,
                    );
                    const authorName =
                        authorProfile?.first_name && authorProfile?.last_name
                            ? `${authorProfile.first_name} ${authorProfile.last_name}`
                            : authorProfile?.user_name ?? '';
                    const { target_teams } = settings.row.original;
                    const userIsAuthor =
                        authorProfile?.user_id === currentUser.user_id;
                    const teamNames = teams
                        ?.filter(team => target_teams.includes(team.id))
                        .map(team => team.name)
                        .join(', ');
                    return (
                        <section>
                            <BudgetFilesModal
                                eventId={settings.row.original.id}
                                note={settings.row.original.comment}
                                date={settings.row.original.created_at}
                                type={settings.row.original.type}
                                links={settings.row.original.links}
                                author={authorName}
                                recipients={teamNames}
                                iconColor={
                                    settings.row.original.deleted_at
                                        ? 'secondary'
                                        : 'action'
                                }
                            />
                            {!settings.row.original.is_finalized &&
                                settings.row.original.author ===
                                    currentUser.user_id && (
                                    <CreateEditBudgetEvent
                                        campaignId={
                                            settings.row.original.campaign
                                        }
                                        type="edit"
                                        budgetEvent={settings.row.original}
                                        iconColor={
                                            settings.row.original.deleted_at
                                                ? 'secondary'
                                                : 'action'
                                        }
                                    />
                                )}
                            {!settings.row.original.deleted_at &&
                                userIsAuthor && (
                                    <DeleteDialog
                                        titleMessage={
                                            MESSAGES.deleteBudgetEvent
                                        }
                                        message={MESSAGES.deleteBudgetEvent}
                                        onConfirm={() =>
                                            deleteBudgetEvent(
                                                settings.row.original.id,
                                            )
                                        }
                                        keyName={`deleteBudgetEvent-${settings.row.original.id}`}
                                    />
                                )}
                            {settings.row.original.deleted_at &&
                                userIsAuthor && (
                                    <IconButtonComponent
                                        color="secondary"
                                        icon="restore-from-trash"
                                        tooltipMessage={MESSAGES.restore}
                                        onClick={() =>
                                            restoreBudgetEvent(
                                                settings.row.original.id,
                                            )
                                        }
                                    />
                                )}
                        </section>
                    );
                },
            },
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
    }, [
        formatMessage,
        showInternalColumn,
        getRowColor,
        profiles?.profiles,
        classes.paragraph,
        teams,
        currentUser.user_id,
        deleteBudgetEvent,
        restoreBudgetEvent,
    ]);
};

type Params = {
    events: Optional<BudgetEvent[]>;
    profiles: Profile[];
    params: Record<string, any>;
};

export const useTableState = ({
    events,
    profiles,
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
        profiles,
        data: events,
    });

    return useMemo(() => {
        return {
            resetPageToOne,
            columns,
        };
    }, [columns, resetPageToOne]);
};
