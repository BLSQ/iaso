import {
    Card,
    CardActionArea,
    CardContent,
    Grid,
    Typography,
} from '@material-ui/core';
import React, { FunctionComponent, useMemo, useState } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import moment from 'moment';
import { BudgetEvent } from '../../../constants/types';
import MESSAGES from '../../../constants/messages';
import { Profile } from '../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import { formatTargetTeams, formatUserName } from '../utils';
import { useGetTeams } from '../../../hooks/useGetTeams';
import { Nullable } from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { BudgetFilesModalForCards } from '../pop-ups/BudgetFilesModalForCards';

type Props = {
    event: BudgetEvent;
    profiles: Profile[];
};

const COMMENT_CHAR_LIMIT = 50;

const getProfileFromId = (userId: number, profiles: Profile[]) => {
    return (
        profiles.find((profile: Profile) => profile.user_id === userId) ??
        ({} as Profile)
    );
};
const formatComment = (comment: Nullable<string>): Nullable<string> => {
    if (!comment) return comment;
    if (comment.length > COMMENT_CHAR_LIMIT)
        return `${comment.substring(0, COMMENT_CHAR_LIMIT)}...`;
    return comment;
};

// const useActionMessage = (comment: string, files = 0) => {
//     const { formatMessage } = useSafeIntl();
//     const fileMsg = formatMessage(MESSAGES.files);
//     if (comment.length <= COMMENT_CHAR_LIMIT) return `${files} ${fileMsg}`;
//     return `${formatMessage(MESSAGES.seeFullMessage)} + ${files} ${fileMsg}`;
// };

export const BudgetEventCard: FunctionComponent<Props> = ({
    event,
    profiles,
}) => {
    console.log('CARD', event);
    console.log('PROFILES', profiles);
    const { formatMessage } = useSafeIntl();
    const { data: teams = [], isFetching: isFetchingTeams } = useGetTeams();
    const [openModal, setOpenModal] = useState<boolean>(false);
    const title = formatMessage(MESSAGES[event.type]);
    const userName = useMemo(
        () => formatUserName(getProfileFromId(event.author, profiles)),
        [event.author, profiles],
    );
    const formattedCreationDate = moment(event.created_at).format('L');
    const targetTeams = formatTargetTeams(event.target_teams, teams);
    const truncatedComment = formatComment(event.comment);
    // const actionMessage = formatActionMessage(event.comment, event.files);

    return (
        <Card>
            <Grid container>
                <Grid item xs={10}>
                    <CardActionArea>
                        <CardContent onClick={() => setOpenModal(true)}>
                            <Typography variant="h6">{title}</Typography>
                            <Typography>
                                {formatMessage(MESSAGES.by, {
                                    author: userName,
                                })}
                            </Typography>
                            <Typography>
                                {formatMessage(MESSAGES.onDate, {
                                    date: formattedCreationDate,
                                })}
                            </Typography>
                            <Typography>
                                {`${formatMessage(
                                    MESSAGES.destination,
                                )}: ${targetTeams}`}
                            </Typography>

                            <Typography>
                                {`${formatMessage(
                                    MESSAGES.comment,
                                )}: ${truncatedComment}`}
                            </Typography>
                        </CardContent>
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
                <Grid xs={2}>
                    <span>Button</span>
                </Grid>
            </Grid>
        </Card>
    );
};
