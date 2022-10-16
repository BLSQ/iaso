import React, { FunctionComponent, useState } from 'react';

import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    ConfirmCancelModal,
    // @ts-ignore
    makeFullModal,
    // @ts-ignore
    IconButton as IconButtonComponent,
    // @ts-ignore
    FormControl,
    // @ts-ignore
    commonStyles,
} from 'bluesquare-components';
import classnames from 'classnames';
import { makeStyles, InputLabel } from '@material-ui/core';

import { StorageStatus } from '../types/storages';

import InputComponent from '../../../components/forms/InputComponent';

import { useGetReasons } from '../hooks/useGetReasons';
import { useGetStatus } from '../hooks/useGetStatus';

import MESSAGES from '../messages';

type TriggerModalProps = {
    onClick: () => void;
};
export const TriggerModal: FunctionComponent<TriggerModalProps> = ({
    onClick,
}) => (
    <IconButtonComponent
        size="small"
        onClick={onClick}
        icon="edit"
        tooltipMessage={MESSAGES.changeStatus}
    />
);

type Props = {
    isOpen: boolean;
    id?: string;
    dataTestId?: string;
    initialStatus: StorageStatus;
    closeDialog: () => void;
    // eslint-disable-next-line no-unused-vars
    onChange: (status: StorageStatus | undefined) => void;
};

const useStyles = makeStyles(theme => ({
    inputLabelFocus: {
        color: theme.palette.primary.main,
    },
    inputLabel: {
        ...commonStyles.inputLabel,
        top: 13,
        left: 4,
        backgroundColor: 'white',
    },
    inputLabelShrink: {
        transform: 'translate(14px, -3px) scale(0.75) !important',
    },
    textArea: {
        width: '100%',
        minWidth: '100%',
        maxWidth: '100%',
        minHeight: '100px',
        padding: theme.spacing(2),
        marginTop: theme.spacing(2),
        outline: 'none',
        borderRadius: 5,
        fontSize: 16,
        fontFamily: '"Roboto", "Arial", sans-serif',
        '&:focus': {
            border: `1px solid ${theme.palette.primary.main}`,
        },
    },
}));

const StatusModal: FunctionComponent<Props> = ({
    closeDialog,
    isOpen,
    id,
    dataTestId,
    onChange,
    initialStatus,
}) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const allStatus = useGetStatus();
    const [status, setStatus] = useState<StorageStatus>(initialStatus);
    const [commentFocus, setCommentFocus] = useState<boolean>(false);
    const reasons = useGetReasons();

    const handleConfirm = () => {
        closeDialog();
        onChange(status);
    };

    const handleChange = (key, value) => {
        setStatus({
            ...status,
            [key]: value,
        });
    };

    return (
        <ConfirmCancelModal
            allowConfirm
            titleMessage={formatMessage(MESSAGES.changeStatus)}
            onConfirm={handleConfirm}
            onCancel={() => {
                closeDialog();
            }}
            maxWidth="sm"
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.confirm}
            open={isOpen}
            closeDialog={closeDialog}
            dataTestId={dataTestId || ''}
            id={id || ''}
            onClose={() => null}
        >
            <InputComponent
                clearable={false}
                type="select"
                keyValue="status"
                onChange={handleChange}
                value={status?.status}
                label={MESSAGES.status}
                options={allStatus}
            />
            {status?.status === 'BLACKLISTED' && (
                <>
                    <InputComponent
                        type="select"
                        keyValue="reason"
                        onChange={handleChange}
                        value={status?.reason}
                        label={MESSAGES.reason}
                        options={reasons}
                    />
                    <FormControl>
                        <InputLabel
                            shrink={Boolean(status?.comment)}
                            className={classnames(
                                classes.inputLabel,
                                commentFocus && classes.inputLabelFocus,
                                Boolean(status?.comment) &&
                                    classes.inputLabelShrink,
                            )}
                        >
                            {formatMessage(MESSAGES.comment)}
                        </InputLabel>
                        <textarea
                            onFocus={() => setCommentFocus(true)}
                            onBlur={() => setCommentFocus(false)}
                            className={classes.textArea}
                            onChange={e =>
                                handleChange('comment', e.target.value)
                            }
                            value={status?.comment}
                        />
                    </FormControl>
                </>
            )}
        </ConfirmCancelModal>
    );
};
const modalWithButton = makeFullModal(StatusModal, TriggerModal);

export { modalWithButton as StatusModal };
