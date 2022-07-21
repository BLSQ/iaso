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
    useQuickRejectBudgetEvent,
} from '../../../hooks/useSaveBudgetEvent';
import { useGetTeams } from '../../../hooks/useGetTeams';
import MESSAGES from '../../../constants/messages';
import { redirectToReplace } from '../../../../../../../hat/assets/js/apps/Iaso/routing/actions';
import InputComponent from '../../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { findApprovaTeams } from '../utils';
import { useDialogActionStyles } from './style';

type Props = { campaignName: string; campaignId: string; params: any };

const makeQuery = (campaign, target_teams, comment): QueryData => {
    return {
        target_teams,
        type: 'comments',
        campaign,
        comment,
    };
};

export const BudgetRejectionPopUp: FunctionComponent<Props> = ({
    campaignName,
    campaignId,
    params,
}) => {
    const currentUser = useCurrentUser();
    const { action: actionStyle } = useDialogActionStyles();

    const { formatMessage } = useSafeIntl();
    const [open, setOpen] = useState<boolean>(true);
    const [text, setText] = useState<string>('');
    const dispatch = useDispatch();
    const { data: teams, isFetching: isFetchingTeams } = useGetTeams();
    const otherApprovalTeamIds = useMemo(() => {
        return findApprovaTeams(teams ?? []);
    }, [teams]);
    const { mutateAsync: reject } = useQuickRejectBudgetEvent();
    const query = useMemo(
        () => makeQuery(campaignId, otherApprovalTeamIds, text),
        [campaignId, otherApprovalTeamIds, text],
    );
    const onConfirm = useCallback(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { action, ...baseParams } = params;
        reject(query);
        dispatch(redirectToReplace('polio/budget/details', baseParams));
        setOpen(false);
    }, [reject, dispatch, params, query]);

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
                    {formatMessage(MESSAGES.rejectBudget)}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {formatMessage(MESSAGES.rejectBudgetForCampaign, {
                            campaign: campaignName,
                        })}
                    </DialogContentText>
                    <InputComponent
                        type="text"
                        multiline
                        value={text}
                        keyValue="comments"
                        label={MESSAGES.comments}
                        onChange={(_keyValue, input) => setText(input)}
                    />
                </DialogContent>
                <DialogActions className={actionStyle}>
                    <Button onClick={handleClose} color="primary">
                        {formatMessage(MESSAGES.cancel)}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        color="primary"
                        variant="contained"
                    >
                        {formatMessage(MESSAGES.sendComment)}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};
