import React, { useMemo, useState } from 'react';
import {
    useSafeIntl,
    IconButton,
    useSkipEffectOnMount,
    Column,
    Paginated,
    formatThousand,
} from 'bluesquare-components';
import { Box, Tooltip, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { Theme } from '@mui/material/styles';

import {
    DateCell,
    DateTimeCellRfc,
} from '../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import { Optional } from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { convertObjectToString } from '../../../utils';
import { BudgetStep, Transition, Params } from '../types';
import getDisplayName from '../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import MESSAGES from '../../../constants/messages';
import { StepActionCell } from '../BudgetDetails/StepActionCell';
import { baseUrls } from '../../../constants/urls';
import { DeleteBudgetProcessModal } from '../BudgetProcess/DeleteBudgetProcessModal';
import { EditBudgetProcessModal } from '../BudgetProcess/EditBudgetProcessModal';
import { formatComment } from '../cards/utils';
import { formatRoundNumbers, makeFileLinks, makeLinks } from '../utils';

const baseUrl = baseUrls.budgetDetails;

export const styles = (theme: Theme): Record<string, React.CSSProperties> => {
    return {
        hiddenRow: {
            color: theme.palette.secondary.main,
        },
        paragraph: { margin: 0 },
    };
};

// @ts-ignore
export const useStyles = makeStyles(styles);
export const getStyle =
    (classes: ReturnType<typeof useStyles>) =>
    (isHidden: boolean): string => {
        return isHidden ? classes.hiddenRow : '';
    };

export const useBudgetColumns = (isUserPolioBudgetAdmin: boolean): Column[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        const cols = [
            {
                Header: formatMessage(MESSAGES.obrName),
                accessor: 'obr_name',
            },
            {
                Header: formatMessage(MESSAGES.country),
                id: 'country_name',
                sortable: true,
                accessor: 'country_name',
            },
            {
                Header: formatMessage(MESSAGES.status),
                sortable: true,
                accessor: 'current_state_key',
                Cell: settings =>
                    settings.row.original.current_state?.label ?? '--',
            },
            {
                Header: formatMessage(MESSAGES.rounds),
                sortable: false,
                accessor: 'rounds',
                Cell: settings =>
                    formatRoundNumbers(settings.row.original.rounds),
            },
            {
                Header: formatMessage(MESSAGES.lastStep),
                sortable: true,
                accessor: 'updated_at',
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'id',
                sortable: false,
                Cell: settings => {
                    return (
                        <>
                            <IconButton
                                icon="remove-red-eye"
                                tooltipMessage={MESSAGES.details}
                                size="small"
                                url={`/${baseUrl}/campaignName/${settings.row.original.obr_name}/budgetProcessId/${settings.row.original.id}`}
                            />
                            {isUserPolioBudgetAdmin && (
                                <EditBudgetProcessModal
                                    budgetProcess={settings.row.original}
                                    iconProps={{}}
                                />
                            )}
                            {isUserPolioBudgetAdmin && (
                                <DeleteBudgetProcessModal
                                    iconProps={{}}
                                    budgetProcess={settings.row.original}
                                />
                            )}
                        </>
                    );
                },
            },
        ];
        return cols;
    }, [formatMessage, isUserPolioBudgetAdmin]);
};

export const useBudgetDetailsColumns = (
    params: Params,
    repeatTransitions: Transition[],
    budgetDetails?: Paginated<BudgetStep>,
): Column[] => {
    const classes = useStyles();
    const getRowColor = getStyle(classes);
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        const defaultColumns = [
            {
                Header: formatMessage(MESSAGES.step),
                id: 'transition_label',
                accessor: 'transition_label',
                sortable: false,
                Cell: settings => {
                    return (
                        <span
                            className={getRowColor(
                                Boolean(settings.row.original.deleted_at),
                            )}
                        >
                            {settings.row.original.transition_label !==
                            'override'
                                ? settings.row.original.transition_label
                                : 'Override'}
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
                    const formattedComment = <Typography>{comment}</Typography>;

                    return (
                        <Tooltip
                            title={formattedComment}
                            disableInteractive={false}
                            leaveDelay={500}
                            placement="right-start"
                            arrow
                        >
                            <span
                                className={getRowColor(
                                    Boolean(settings.row.original.deleted_at),
                                )}
                            >
                                {comment ? formatComment(comment) : '--'}
                            </span>
                        </Tooltip>
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
                                className={`${getRowColor(
                                    Boolean(settings.row.original.deleted_at),
                                )} ${classes.paragraph}`}
                            >
                                {getDisplayName(author)}
                            </p>
                            {authorTeam && (
                                <p
                                    className={`${getRowColor(
                                        Boolean(
                                            settings.row.original.deleted_at,
                                        ),
                                    )} ${classes.paragraph}`}
                                >
                                    {authorTeam}
                                </p>
                            )}
                        </>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.date),
                id: 'created_at',
                accessor: 'created_at',
                sortable: false,
                Cell: settings => {
                    return (
                        <span
                            className={getRowColor(
                                Boolean(settings.row.original.deleted_at),
                            )}
                        >
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
                            <span
                                className={getRowColor(
                                    Boolean(settings.row.original.deleted_at),
                                )}
                            >
                                {formatThousand(parseInt(amount, 10))}
                            </span>
                        );
                    }
                    return (
                        <span
                            className={getRowColor(
                                Boolean(settings.row.original.deleted_at),
                            )}
                        >
                            --
                        </span>
                    );
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
                Cell: settings => (
                    <StepActionCell
                        budgetStep={settings.row.original}
                        params={params}
                        budgetDetails={budgetDetails}
                        repeatTransitions={repeatTransitions}
                    />
                ),
            },
        ];
        return defaultColumns;
    }, [
        formatMessage,
        getRowColor,
        classes.paragraph,
        params,
        budgetDetails,
        repeatTransitions,
    ]);
};

type TableProps = {
    events: Optional<BudgetStep[]>;
    params: Params;
    budgetDetails: Paginated<BudgetStep> | undefined;
    repeatTransitions: Transition[];
};

export const useTableState = ({
    params,
    budgetDetails,
    repeatTransitions,
}: TableProps): { resetPageToOne: unknown; columns: Column[] } => {
    const { campaignName, budgetProcessId } = params;
    const [resetPageToOne, setResetPageToOne] = useState('');

    useSkipEffectOnMount(() => {
        const newParams = {
            ...params,
        };
        delete newParams.page;
        delete newParams.order;
        setResetPageToOne(convertObjectToString(newParams));
    }, [params.pageSize, budgetProcessId, campaignName]);

    const columns = useBudgetDetailsColumns(
        params,
        repeatTransitions,
        budgetDetails,
    );

    return useMemo(() => {
        return {
            resetPageToOne,
            columns,
        };
    }, [columns, resetPageToOne]);
};
