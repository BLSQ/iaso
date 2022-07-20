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
import { useSafeIntl, commonStyles } from 'bluesquare-components';
import { useDispatch } from 'react-redux';
import { makeStyles } from '@material-ui/core';
import {
    QueryData,
    useQuickApproveBudgetEvent,
} from '../../../hooks/useSaveBudgetEvent';
import { useGetTeams } from '../../../hooks/useGetTeams';
import MESSAGES from '../../../constants/messages';
import { redirectToReplace } from '../../../../../../../hat/assets/js/apps/Iaso/routing/actions';
import { findApprovalTeams } from '../utils';
import { useDialogActionStyles } from './style';

type Props = { campaignName: string; campaignId: string; params: any };

const makeQuery = (campaign, target_teams): QueryData => {
    return {
        target_teams,
        type: 'validation',
        campaign,
    };
};

const styles = theme => {
    return {
        ...commonStyles(theme),
        green: {
            backgroundColor: theme.palette.success.main,
            color: 'white',
            '&.MuiButton-contained:hover': {
                backgroundColor: theme.palette.success.main,
            },
        },
    };
};
const useStyles = makeStyles(styles);

export const BudgetValidationPopUp: FunctionComponent<Props> = ({
    campaignName,
    campaignId,
    params,
}) => {
    const classes: any = useStyles();
    const { action: actionStyle } = useDialogActionStyles();
    const { formatMessage } = useSafeIntl();
    const [open, setOpen] = useState(params?.action === 'confirmApproval');
    const dispatch = useDispatch();
    const { data: teams, isFetching: isFetchingTeams } = useGetTeams();
    const otherApprovalTeamIds = useMemo(() => {
        return findApprovalTeams(teams ?? []);
    }, [teams]);
    const { mutateAsync: approve } = useQuickApproveBudgetEvent();
    const query = useMemo(
        () => makeQuery(campaignId, otherApprovalTeamIds),
        [campaignId, otherApprovalTeamIds],
    );
    const onConfirm = useCallback(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { action, ...baseParams } = params;
        approve(query, {
            onSuccess: () => {
                dispatch(redirectToReplace('polio/budget/details', baseParams));
                setOpen(false);
            },
        });
    }, [approve, dispatch, params, query]);

    const handleClose = () => {
        setOpen(false);
    };
    const handleClick = () => setOpen(true);

    return (
        <div>
            <Button
                variant="contained"
                onClick={handleClick}
                className={classes.green}
            >
                {formatMessage(MESSAGES.approve)}
            </Button>
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
                <DialogActions className={actionStyle}>
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
