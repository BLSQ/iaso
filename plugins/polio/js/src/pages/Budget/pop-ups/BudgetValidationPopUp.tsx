/* eslint-disable camelcase */
import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { useDispatch } from 'react-redux';
import {
    QueryData,
    useQuickApproveBudgetEvent,
} from '../../../hooks/useSaveBudgetEvent';
import { useGetTeams } from '../../../hooks/useGetTeams';
import { useCurrentUser } from '../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import MESSAGES from '../../../constants/messages';
import { redirectToReplace } from '../../../../../../../hat/assets/js/apps/Iaso/routing/actions';

type Props = { campaignName: string; campaignId: string; params: any };

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
    campaignName,
    campaignId,
    params,
}) => {
    const currentUser = useCurrentUser();
    const { formatMessage } = useSafeIntl();
    const [open, setOpen] = useState(true);
    const dispatch = useDispatch();
    const { data: teams, isFetching: isFetchingTeams } = useGetTeams();
    const otherApprovalTeamIds = useMemo(() => {
        return findOtherApprovaTeams(currentUser, teams ?? []);
    }, [currentUser, teams]);
    const { mutateAsync: approve } = useQuickApproveBudgetEvent();
    const query = useMemo(
        () => makeQuery(campaignId, otherApprovalTeamIds),
        [campaignId, otherApprovalTeamIds],
    );
    const onConfirm = useCallback(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { action, ...baseParams } = params;
        approve(query);
        dispatch(redirectToReplace('polio/budget/details', baseParams));
        setOpen(false);
    }, [approve, dispatch, params, query]);

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <div>
            <Dialog
                open={open && !isFetchingTeams}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {formatMessage(MESSAGES.approveBudget)}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {formatMessage(MESSAGES.approveBudgetForCampaign, {
                            campaign: campaignName,
                        })}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="primary">
                        {formatMessage(MESSAGES.cancel)}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        variant="contained"
                        color="primary"
                    >
                        {formatMessage(MESSAGES.approve)}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};
