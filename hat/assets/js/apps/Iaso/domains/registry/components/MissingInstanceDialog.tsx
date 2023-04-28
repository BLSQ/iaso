import React, { FunctionComponent, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    makeStyles,
    Button,
} from '@material-ui/core';
import {
    useSafeIntl,
    makeFullModal,
    commonStyles,
} from 'bluesquare-components';

import { OrgUnit } from '../../orgUnits/types/orgUnit';

import { MissingInstanceButton } from './MissingInstanceButton';

import { redirectToReplace } from '../../../routing/actions';
import { RegistryDetailParams } from '../types';
import { baseUrls } from '../../../constants/urls';
import MESSAGES from '../messages';

type Props = {
    missingOrgUnits: OrgUnit[];
    isOpen: boolean;
    closeDialog: () => void;
    params: RegistryDetailParams;
};
const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    paper: {
        overflow: 'visible',
    },
    title: {
        paddingBottom: 0,
    },
    content: {
        overflow: 'visible',
        paddingBottom: theme.spacing(2),
    },
    action: {
        paddingBottom: theme.spacing(2),
        paddingRight: theme.spacing(2),
    },
}));

const MissingInstanceDialog: FunctionComponent<Props> = ({
    missingOrgUnits,
    closeDialog,
    isOpen,
    params,
}) => {
    const dispatch = useDispatch();
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const handleClose = useCallback(() => {
        const newParams = {
            ...params,
        };
        delete newParams.missingSubmissionVisible;
        dispatch(redirectToReplace(baseUrls.registryDetail, newParams));
        closeDialog();
    }, [closeDialog, dispatch, params]);

    return (
        <Dialog
            fullWidth
            maxWidth="xs"
            open={isOpen}
            classes={{
                paper: classes.paper,
            }}
            onClose={handleClose}
            scroll="body"
            id="missing-submbissions"
            data-test="missing-submbissions"
        >
            <DialogTitle className={classes.title}>
                {formatMessage(MESSAGES.missingSubmission)}
            </DialogTitle>
            <DialogContent className={classes.content}>
                {missingOrgUnits.length}
            </DialogContent>
            <DialogActions className={classes.action}>
                <Button
                    onClick={() => {
                        handleClose();
                    }}
                    color="primary"
                    data-test="close-button"
                >
                    {formatMessage(MESSAGES.close)}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
const modalWithButton = makeFullModal(
    MissingInstanceDialog,
    MissingInstanceButton,
);

export { modalWithButton as MissingInstanceDialog };
