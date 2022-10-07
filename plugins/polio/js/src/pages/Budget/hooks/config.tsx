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
import { Box, makeStyles, Tooltip } from '@material-ui/core';
import RemoveCircleIcon from '@material-ui/icons/RemoveCircle';
import { PlaylistAdd } from '@material-ui/icons';
import MESSAGES from '../../../constants/messages';
import { Column } from '../../../../../../../hat/assets/js/apps/Iaso/types/table';
import { BUDGET_DETAILS } from '../../../constants/routes';
import { DateTimeCellRfc } from '../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import { makeFileLinks, makeLinks } from '../utils';
import { Optional } from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { convertObjectToString } from '../../../utils';
import { formatThousand } from '../../../../../../../hat/assets/js/apps/Iaso/utils';
import { formatComment } from '../cards/utils';
import { BudgetStep } from '../mockAPI/useGetBudgetDetails';
import getDisplayName from '../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';

const baseUrl = BUDGET_DETAILS;

export const styles = theme => {
    return {
        hiddenRow: {
            color: theme.palette.secondary.main,
        },
        paragraph: { margin: 0 },
    };
};

// @ts-ignore
const useStyles = makeStyles(styles);
const getStyle = classes => settings => {
    const isHidden = Boolean(settings.row.original.deleted_at);
    return isHidden ? classes.hiddenRow : '';
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
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'id',
                sortable: false,
                Cell: settings => {
                    return (
                        <IconButtonComponent
                            icon="remove-red-eye"
                            tooltipMessage={MESSAGES.details}
                            url={`${baseUrl}/campaignName/${settings.row.original.obr_name}/campaignId/${settings.row.original.id}`}
                        />
                    );
                },
            },
        ];
        return cols;
    }, [formatMessage]);
};

export const useBudgetDetailsColumns = (): Column[] => {
    const classes = useStyles();
    const getRowColor = getStyle(classes);
    const { formatMessage } = useSafeIntl();
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
                    const { created_by: author, created_by_team: authorTeam } =
                        settings.row.original;

                    return (
                        <>
                            <p
                                className={`${getRowColor(settings)} ${
                                    classes.paragraph
                                }`}
                            >
                                {getDisplayName(author)}
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
                Header: `${formatMessage(MESSAGES.attachments)}`,
                id: 'files',
                accessor: 'files',
                sortable: false,
                Cell: settings => {
                    const { files, links } = settings.row.original;
                    return (
                        <Box>
                            {makeFileLinks(files)}
                            {makeLinks(links)}
                        </Box>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.actions),
                id: 'id',
                accessor: 'id',
                sortable: false,
                Cell: settings => {
                    return (
                        <>
                            {!settings.row.original.deleted_at && (
                                <Tooltip
                                    title={formatMessage(MESSAGES.clickToHide)}
                                >
                                    <RemoveCircleIcon
                                        color="action"
                                        onClick={() => {
                                            // Send delete on budgetstep
                                            console.log(
                                                'hide step',
                                                settings.row.original.id,
                                            );
                                        }}
                                    />
                                </Tooltip>
                            )}
                            {settings.row.original.deleted_at && (
                                <Tooltip
                                    title={formatMessage(MESSAGES.clickToShow)}
                                >
                                    <PlaylistAdd
                                        className={getRowColor(settings)}
                                        // restore on budget step
                                        onClick={() => {
                                            console.log(
                                                'show step',
                                                settings.row.original.id,
                                            );
                                        }}
                                    />
                                </Tooltip>
                            )}
                        </>
                    );
                },
            },
        ];
        return defaultColumns;
    }, [formatMessage, getRowColor, classes.paragraph]);
};

type Params = {
    events: Optional<BudgetStep[]>;
    params: Record<string, any>;
};

export const useTableState = ({
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

    const columns = useBudgetDetailsColumns();

    return useMemo(() => {
        return {
            resetPageToOne,
            columns,
        };
    }, [columns, resetPageToOne]);
};
