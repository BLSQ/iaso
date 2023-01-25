/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
    Box,
    Card,
    CardActionArea,
    CardContent,
    Divider,
    Grid,
    makeStyles,
    Typography,
} from '@material-ui/core';
import React, { FunctionComponent, useCallback, useState } from 'react';
import {
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';
import moment from 'moment';
import classNames from 'classnames';
import RemoveCircleIcon from '@material-ui/icons/RemoveCircle';
import { PlaylistAdd } from '@material-ui/icons';
import MESSAGES from '../../../constants/messages';

import { BudgetFilesModalForCards } from '../pop-ups/BudgetFilesModalForCards';

import { formatComment, shouldOpenModal, useActionMessage } from './utils';
import { styles as eventStyles } from '../hooks/config';
import { formatThousand } from '../../../../../../../hat/assets/js/apps/Iaso/utils';
import { BudgetStep, LinkWithAlias } from '../types';
import getDisplayName from '../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import { useDeleteRestoreBudgetStep } from '../hooks/api/useGetBudgetDetails';

type Props = {
    step: BudgetStep;
};

const useStyles = makeStyles(theme => ({
    ...eventStyles(theme),
    cardContent: {
        padding: `${theme.spacing(1)}px !important`,
    },
    cta: { color: theme.palette.secondary.main },
    inactiveCard: {
        cursor: 'default',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
    },
}));

export const BudgetEventCard: FunctionComponent<Props> = ({ step }) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const { files } = step;
    const stepLinks = (step?.links ?? []) as LinkWithAlias[];
    const stepComment = step?.comment ?? '';
    const isStepDeleted = Boolean(step.deleted_at);

    const { mutateAsync: toggleStatus } =
        useDeleteRestoreBudgetStep(isStepDeleted);

    const actionMessage = useActionMessage(
        stepComment,
        files?.length,
        stepLinks,
    );
    const [openModal, setOpenModal] = useState<boolean>(false);
    const title = step.transition_label;

    const authorName = getDisplayName(step?.created_by);
    const textColor = isStepDeleted ? classes.hiddenRow : '';
    const amount = step.amount
        ? formatThousand(parseInt(`${step.amount}`, 10)) // using parseInt to remove decimals before formatting
        : '--';
    const formattedCreationDate = moment(step.created_at).format('L');

    const truncatedComment = formatComment(step.comment);
    const authorTeam = step.created_by_team;
    const allowOpenModal = shouldOpenModal(
        files?.length,
        stepLinks,
        stepComment,
    );
    const onClick = useCallback(() => {
        if (allowOpenModal) setOpenModal(true);
    }, [allowOpenModal]);

    const toggleStepStatus = useCallback(() => {
        return toggleStatus(step.id);
    }, [step.id, toggleStatus]);

    return (
        <Card>
            <Grid container>
                <Grid item xs={10}>
                    <CardActionArea
                        className={allowOpenModal ? '' : classes.inactiveCard}
                        disableRipple={!allowOpenModal}
                    >
                        <CardContent
                            onClick={onClick}
                            className={classes.cardContent}
                        >
                            <Box>
                                <Typography
                                    variant="h6"
                                    className={classNames(
                                        classes.title,
                                        textColor,
                                    )}
                                >
                                    {title}
                                </Typography>
                            </Box>
                            <Typography variant="body2" className={textColor}>
                                {formatMessage(MESSAGES.onDate, {
                                    date: formattedCreationDate,
                                })}
                            </Typography>
                            <Typography className={textColor}>
                                {`${authorName} - ${authorTeam}`}
                            </Typography>
                            {truncatedComment && (
                                <Typography
                                    // @ts-ignore
                                    style={{ wordWrap: 'anywhere' }}
                                    className={textColor}
                                >
                                    {`${formatMessage(
                                        MESSAGES.comment,
                                    )}: ${truncatedComment}`}
                                </Typography>
                            )}
                            <Typography
                                // @ts-ignore
                                style={{ wordWrap: 'anywhere' }}
                                className={`${textColor}`}
                            >
                                {`${formatMessage(MESSAGES.amount)}: ${amount}`}
                            </Typography>

                            <Typography variant="body2" className={classes.cta}>
                                {actionMessage}
                            </Typography>
                        </CardContent>
                    </CardActionArea>
                    <BudgetFilesModalForCards
                        open={openModal}
                        setOpen={setOpenModal}
                        files={step.files ?? []}
                        note={step.comment}
                        links={step.links}
                    />
                </Grid>

                <Grid
                    container
                    item
                    xs={2}
                    direction="column"
                    justifyContent="center"
                    onClick={toggleStepStatus}
                >
                    <Divider orientation="vertical" />
                    {!isStepDeleted && <RemoveCircleIcon color="action" />}
                    {isStepDeleted && <PlaylistAdd className={textColor} />}
                </Grid>
            </Grid>
        </Card>
    );
};
