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
import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    IconButton as IconButtonComponent,
    // @ts-ignore
    LoadingSpinner,
} from 'bluesquare-components';
import moment from 'moment';
import MESSAGES from '../../../constants/messages';
import {
    Profile,
    useCurrentUser,
} from '../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import { formatTargetTeams, formatUserName } from '../utils';
import { useGetTeams } from '../../../hooks/useGetTeams';
import { BudgetFilesModalForCards } from '../pop-ups/BudgetFilesModalForCards';
import { useGetBudgetEventFiles } from '../../../hooks/useGetBudgetEventFiles';
import DeleteDialog from '../../../../../../../hat/assets/js/apps/Iaso/components/dialogs/DeleteDialogComponent';
import {
    useDeleteBudgetEvent,
    useRestoreBudgetEvent,
} from '../../../hooks/useDeleteBudgetEvent';
import { CreateEditBudgetEvent } from '../CreateEditBudgetEvent';
import { LockIcon } from './LockIcon';
import { BudgetEvent } from '../../../constants/types';
import {
    findAuthorTeam,
    formatActionMessage,
    formatComment,
    getProfileFromId,
    shouldOpenModal,
} from './utils';

type Props = {
    event: BudgetEvent;
    profiles: Profile[];
};

const style = theme => {
    return {
        cta: { color: theme.palette.secondary.main },
        inactiveCard: {
            cursor: 'default',
        },
    };
};

const useStyles = makeStyles(style);

export const BudgetEventCard: FunctionComponent<Props> = ({
    event,
    profiles,
}) => {
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();
    const classes = useStyles();
    const userIsAuthor = event?.author === currentUser.user_id;
    const { data: teams = [], isFetching: isFetchingTeams } = useGetTeams();
    const { data: budgetEventFiles, isFetching: isFetchingFiles } =
        useGetBudgetEventFiles(event.id);
    const isLoading = isFetchingFiles || isFetchingTeams;
    const eventLinks = event?.links ?? '';
    const eventComment = event?.comment ?? '';
    const { mutateAsync: deleteBudgetEvent } = useDeleteBudgetEvent();
    const { mutateAsync: restoreBudgetEvent } = useRestoreBudgetEvent();

    const actionMessage = formatActionMessage(
        formatMessage,
        eventComment,
        budgetEventFiles?.length,
        eventLinks,
    );
    const [openModal, setOpenModal] = useState<boolean>(false);
    const title = formatMessage(MESSAGES[event.type]);

    const authorName = useMemo(
        () => formatUserName(getProfileFromId(event.author, profiles)),
        [event.author, profiles],
    );
    const formattedCreationDate = moment(event.created_at).format('L');
    const targetTeams = formatTargetTeams(event.target_teams, teams);
    const truncatedComment = formatComment(event.comment);
    const authorTeam = findAuthorTeam(event.author, teams, event.type);
    const allowOpenModal = shouldOpenModal(
        budgetEventFiles?.length,
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
                        disabled={isLoading}
                    >
                        {isLoading && <LoadingSpinner fixed={false} />}
                        {!isLoading && (
                            <CardContent onClick={onClick}>
                                <Box>
                                    <Typography variant="h6">
                                        {title}
                                        <LockIcon internal={event?.internal} />
                                    </Typography>
                                </Box>
                                <Typography variant="body2">
                                    {formatMessage(MESSAGES.onDate, {
                                        date: formattedCreationDate,
                                    })}
                                </Typography>
                                <Typography>
                                    {`${authorName} - ${authorTeam}`}
                                </Typography>
                                <Typography>
                                    {`${formatMessage(
                                        MESSAGES.destination,
                                    )}: ${targetTeams}`}
                                </Typography>
                                {truncatedComment && (
                                    <Typography
                                        // @ts-ignore
                                        style={{ wordWrap: 'anywhere' }}
                                    >
                                        {`${formatMessage(
                                            MESSAGES.comment,
                                        )}: ${truncatedComment}`}
                                    </Typography>
                                )}
                                <Typography
                                    variant="body2"
                                    className={classes.cta}
                                >
                                    {actionMessage}
                                </Typography>
                            </CardContent>
                        )}
                    </CardActionArea>
                    <BudgetFilesModalForCards
                        open={openModal}
                        setOpen={setOpenModal}
                        eventId={event.id}
                        author={event.author}
                        type={event.type}
                        note={event.comment}
                        date={event.created_at}
                        links={event.links}
                        recipients={event.target_teams.join(',')}
                    />
                </Grid>
                <Grid
                    container
                    item
                    xs={2}
                    direction="column"
                    justifyContent="center"
                >
                    <Divider orientation="vertical" />
                    {!event?.is_finalized && userIsAuthor && (
                        <CreateEditBudgetEvent
                            campaignId={event?.campaign}
                            type="edit"
                            budgetEvent={event}
                            iconColor={
                                event?.deleted_at ? 'secondary' : 'action'
                            }
                        />
                    )}
                    {!event.deleted_at && userIsAuthor && (
                        <DeleteDialog
                            titleMessage={MESSAGES.deleteBudgetEvent}
                            message={MESSAGES.deleteBudgetEvent}
                            onConfirm={() => deleteBudgetEvent(event?.id)}
                            keyName={`deleteBudgetEvent-card-${event?.id}`}
                        />
                    )}
                    {event.deleted_at && userIsAuthor && (
                        <IconButtonComponent
                            color="secondary"
                            icon="restore-from-trash"
                            tooltipMessage={MESSAGES.restore}
                            onClick={() => restoreBudgetEvent(event?.id)}
                        />
                    )}
                </Grid>
            </Grid>
        </Card>
    );
};
