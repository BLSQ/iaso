import React, { FunctionComponent } from 'react';
import { Button, DialogActions } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { FormattedMessage } from 'react-intl';
import DialogComponent from './DialogComponent';
import MESSAGES from './messages';
import { IntlMessage } from 'bluesquare-components';

const useActionStyles = makeStyles(theme => ({
    action: {
        paddingBottom: theme.spacing(2),
        paddingRight: theme.spacing(2),
    },
}));

type ActionProps = {
    closeDialog: () => void;
    allowConfirm: boolean;
    onConfirm: (closeDialog: () => void) => void;
    onCancel: (closeDialog: () => void) => void;
    confirmMessage: IntlMessage;
    cancelMessage: IntlMessage;
    additionalButton?: boolean;
    additionalMessage?: IntlMessage | null;
    onAdditionalButtonClick?: (closeDialog: () => void) => void | null;
    allowConfimAdditionalButton?: boolean | null;
};
/** @deprecated */
export const ConfirmCancelActions: FunctionComponent<ActionProps> = ({
    closeDialog,
    allowConfirm,
    onConfirm,
    confirmMessage,
    onCancel,
    cancelMessage,
    additionalButton = false,
    additionalMessage = null,
    onAdditionalButtonClick = null,
    allowConfimAdditionalButton = null,
}) => {
    const classes = useActionStyles();
    return (
        <DialogActions className={classes.action}>
            <Button
                onClick={() => onCancel(closeDialog)}
                color="primary"
                data-test="cancel-button"
            >
                <FormattedMessage {...cancelMessage} />
            </Button>
            <Button
                data-test="confirm-button"
                onClick={() => onConfirm(closeDialog)}
                disabled={!allowConfirm}
                color="primary"
                autoFocus
            >
                <FormattedMessage {...confirmMessage} />
            </Button>
            {additionalButton &&
                additionalMessage &&
                onAdditionalButtonClick && (
                    <Button
                        data-test="additional-button"
                        onClick={() => onAdditionalButtonClick(closeDialog)}
                        color="primary"
                        disabled={
                            allowConfimAdditionalButton !== null &&
                            allowConfimAdditionalButton !== undefined
                                ? !allowConfimAdditionalButton
                                : !allowConfirm
                        }
                    >
                        <FormattedMessage {...additionalMessage} />
                    </Button>
                )}
        </DialogActions>
    );
};

type Props = {
    allowConfirm: boolean;
    onConfirm: (closeDialog: () => void) => void;
    onCancel?: (closeDialog: () => void) => void;
    maxWidth: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    onClosed: () => void;
    onOpen: () => void;
    id?: string;
    dataTestId?: string;
    confirmMessage?: IntlMessage;
    cancelMessage?: IntlMessage;
    additionalButton?: boolean;
    additionalMessage?: IntlMessage | null;
    onAdditionalButtonClick?: (closeDialog: () => void) => void | null;
    allowConfimAdditionalButton?: boolean | null;
    renderTrigger: ({
        openDialog,
    }: {
        openDialog: () => void;
    }) => React.JSX.Element;
};

/** @deprecated */
/** Use `ConfirmCancelModal` from bluesquare-components instead */
const ConfirmCancelDialogComponent: FunctionComponent<Props> = ({
    renderTrigger,
    dataTestId = '',
    onConfirm,
    allowConfirm = true,
    onCancel = closeDialog => closeDialog(),
    confirmMessage = MESSAGES.yes,
    cancelMessage = MESSAGES.no,
    additionalButton = false,
    allowConfimAdditionalButton,
    additionalMessage,
    onAdditionalButtonClick,
    id,
    maxWidth = 'sm',
    onClosed = () => {},
    onOpen = () => {},
}) => {
    return (
        <DialogComponent
            dataTestId={dataTestId}
            id={id}
            renderActions={({ closeDialog }) => (
                <ConfirmCancelActions
                    allowConfirm={allowConfirm}
                    onConfirm={onConfirm}
                    confirmMessage={confirmMessage}
                    onCancel={onCancel}
                    cancelMessage={cancelMessage}
                    closeDialog={closeDialog}
                    additionalButton={additionalButton}
                    additionalMessage={additionalMessage}
                    onAdditionalButtonClick={onAdditionalButtonClick}
                    allowConfimAdditionalButton={allowConfimAdditionalButton}
                />
            )}
            maxWidth={maxWidth}
            onOpen={onOpen}
            onClosed={onClosed}
            renderTrigger={renderTrigger}
        />
    );
};

export default ConfirmCancelDialogComponent;
