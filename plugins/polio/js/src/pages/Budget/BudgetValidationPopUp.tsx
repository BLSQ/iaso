/* eslint-disable camelcase */
import React, { FunctionComponent, useCallback, useMemo } from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import {
    QueryData,
    useQuickValidateBudgetEvent,
} from '../../hooks/useSaveBudgetEvent';
import { useGetTeams } from '../../hooks/useGetTeams';
import { useCurrentUser } from '../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import MESSAGES from '../../constants/messages';

type Props = { campaign: string };

const findUserApprovalTeam = (user, teams) => {
    return teams
        .filter(team => team.name.toLowerCase().includes('approval'))
        .find(team => team.users.includes(user.user_id));
};

const findOtherApprovaTeams = (user, teams) => {
    return teams
        .filter(team => team.name.toLowerCase().includes('approval'))
        .filter(team => team.users.includes(user.user_id))
        .map(team => team.id);
};

const makeQuery = (campaign, target_teams): QueryData => {
    return {
        target_teams,
        type: 'validation',
        campaign,
    };
};

export const BudgetValidationPopUp: FunctionComponent<Props> = ({
    campaign,
}) => {
    const currentUser = useCurrentUser();
    const { formatMessage } = useSafeIntl();
    const { data: teams, isFetching: isFetchingTeams } = useGetTeams();
    const userApprovalTeam = findUserApprovalTeam(currentUser, teams ?? []);
    const otherApprovalTeamIds = useMemo(() => {
        return findOtherApprovaTeams(currentUser, teams ?? []);
    }, [currentUser, teams]);
    const approve = useQuickValidateBudgetEvent();
    const query = useMemo(
        () => makeQuery(campaign, otherApprovalTeamIds),
        [campaign, otherApprovalTeamIds],
    );
    const onConfirm = useCallback(() => {
        approve(query);
    }, [approve, query]);
    // MUI template
    const [open, setOpen] = React.useState(true);

    // const handleClickOpen = () => {
    //     setOpen(true);
    // };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <div>
            {/* <Button
                variant="outlined"
                color="primary"
                onClick={handleClickOpen}
            >
                Open alert dialog
            </Button> */}
            <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {formatMessage(MESSAGES.approveBudget)}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {formatMessage(MESSAGES.approveBudgetForCampaign)}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="primary">
                        Disagree
                    </Button>
                    <Button onClick={onConfirm} color="primary" autoFocus>
                        Agree
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};
