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
import { BudgetStep } from '../mockAPI/useGetBudgetDetails';
import getDisplayName from '../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';

type Props = {
    event: BudgetStep;
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

export const BudgetEventCard: FunctionComponent<Props> = ({ event }) => {
    const { formatMessage } = useSafeIntl();
    // const currentUser = useCurrentUser();
    const classes = useStyles();
    // const userIsAuthor = event?.author === currentUser.user_id;
    const { files } = event;
    const eventLinks = (event?.links ?? []) as { alias: string; url: string }[];
    const eventComment = event?.comment ?? '';

    const actionMessage = useActionMessage(
        eventComment,
        files?.length,
        eventLinks,
    );
    const [openModal, setOpenModal] = useState<boolean>(false);
    const title = event.transition_label;

    const authorName = getDisplayName(event?.created_by);

    const textColor = event.deleted_at ? classes.hiddenRow : '';
    const amount = event.amount
        ? formatThousand(parseInt(`${event.amount}`, 10)) // using parseInt to remove decimals before formatting
        : '--';
    const formattedCreationDate = moment(event.created_at).format('L');

    const truncatedComment = formatComment(event.comment);
    const authorTeam = event.created_by_team;
    const allowOpenModal = shouldOpenModal(
        files?.length,
        eventLinks,
        eventComment,
    );
    const onClick = useCallback(() => {
        if (allowOpenModal) setOpenModal(true);
    }, [allowOpenModal]);

    return (
        <Card>
            <Grid container>
                <Grid item xs={10}>
                    <CardActionArea
                        className={allowOpenModal ? '' : classes.inactiveCard}
                        disableRipple={!allowOpenModal}
                        // disabled={isLoading}
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
                                    {/* <LockIcon internal={event?.internal} /> */}
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
                        files={event.files ?? []}
                        note={event.comment}
                        links={event.links}
                    />
                </Grid>

                <Grid
                    container
                    item
                    xs={2}
                    direction="column"
                    justifyContent="center"
                    onClick={() => {
                        if (event.deleted_at) {
                            // Send delete on budgetstep
                            console.log('hide step', event.id);
                        } else {
                            // restore on budget step
                            console.log('show step', event.id);
                        }
                    }}
                >
                    <Divider orientation="vertical" />
                    {!event.deleted_at && (
                        <RemoveCircleIcon
                            color="action"
                            // onClick={() => {
                            //     // Send delete on budgetstep
                            //     console.log('hide step', event.id);
                            // }}
                        />
                    )}
                    {event.deleted_at && (
                        <PlaylistAdd
                            className={textColor}
                            // restore on budget step
                            // onClick={() => {
                            //     console.log('show step', event.id);
                            // }}
                        />
                    )}
                </Grid>
            </Grid>
        </Card>
    );
};
