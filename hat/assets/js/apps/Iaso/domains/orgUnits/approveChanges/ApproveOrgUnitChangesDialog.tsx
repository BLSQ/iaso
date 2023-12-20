/* eslint-disable camelcase */
import React, {
    FunctionComponent,
    useCallback,
    Dispatch,
    SetStateAction,
} from 'react';
import SettingsIcon from '@mui/icons-material/Settings';
import {
    IntlMessage,
    LoadingSpinner,
    useSafeIntl,
    SimpleModal,
} from 'bluesquare-components';
import {
    Box,
    Button,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import classNames from 'classnames';
import MESSAGES from './messages';
import { useGetApprovalProposal } from './hooks/api/useGetApprovalProposal';
import { SelectedChangeRequest } from './Table/ApproveOrgUnitChangesTable';
import { useNewFields } from './hooks/useNewFields';

type Props = {
    titleMessage: IntlMessage;
    isOpen: boolean;
    closeDialog: () => void;
    selectedChangeRequest?: SelectedChangeRequest;
};

export const useStyles = makeStyles(theme => ({
    head: {
        fontWeight: 'bold',
    },
    cell: {
        color: 'inherit',
    },
    cellChanged: {
        '& > a': {
            color: theme.palette.error.main,
        },
        '& > span': {
            color: theme.palette.error.main,
        },
        '& .marker-custom.primary svg': {
            fill: theme.palette.error.main,
        },
    },
}));

export const ApproveOrgUnitChangesDialog: FunctionComponent<Props> = ({
    titleMessage,
    isOpen,
    closeDialog,
    selectedChangeRequest,
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const { data: changeRequest, isFetching: isFetchingChangeRequest } =
        useGetApprovalProposal(selectedChangeRequest?.id);
    const newFields = useNewFields(changeRequest);

    const handlConfirm = useCallback(() => {
        closeDialog();
    }, [closeDialog]);
    const handleReject = useCallback(() => {
        closeDialog();
    }, [closeDialog]);
    return (
        <SimpleModal
            open={isOpen}
            maxWidth="lg"
            onClose={() => null}
            id="approve-orgunit-changes-dialog"
            dataTestId="pprove-orgunit-changes-dialog"
            titleMessage={titleMessage}
            closeDialog={closeDialog}
            buttons={() => (
                <>
                    <Button
                        onClick={() => {
                            closeDialog();
                        }}
                        color="primary"
                        data-test="cancel-button"
                    >
                        {formatMessage(MESSAGES.cancel)}
                    </Button>
                    <Button
                        data-test="reject-button"
                        onClick={handleReject}
                        variant="contained"
                        color="secondary"
                        autoFocus
                    >
                        {formatMessage(MESSAGES.reject)}
                    </Button>
                    <Button
                        data-test="confirm-button"
                        onClick={handlConfirm}
                        variant="contained"
                        color="primary"
                        autoFocus
                    >
                        {formatMessage(MESSAGES.validate)}
                    </Button>
                </>
            )}
        >
            <Box minHeight={200}>
                {isFetchingChangeRequest && <LoadingSpinner absolute />}
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell width={100}>
                                <Box className={classes.head}>
                                    {formatMessage(MESSAGES.label)}
                                </Box>
                            </TableCell>
                            <TableCell width={300}>
                                <Box className={classes.head}>
                                    {formatMessage(MESSAGES.oldValue)}
                                </Box>
                            </TableCell>
                            <TableCell width={300}>
                                <Box className={classes.head}>
                                    {formatMessage(MESSAGES.newValue)}
                                </Box>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {newFields.map(field => (
                            <TableRow key={field.key}>
                                <TableCell>{field.label}</TableCell>
                                <TableCell>{field.oldValue}</TableCell>
                                <TableCell
                                    className={classNames(
                                        field.isChanged
                                            ? classes.cellChanged
                                            : classes.cell,

                                        field.isChanged && 'is-changed',
                                    )}
                                >
                                    {field.newValue}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Box>
        </SimpleModal>
    );
};

type PropsIcon = {
    changeRequestId: number;
    setSelectedChangeRequest: Dispatch<SetStateAction<SelectedChangeRequest>>;
    index: number;
};

export const EditIconButton: FunctionComponent<PropsIcon> = ({
    setSelectedChangeRequest,
    changeRequestId,
    index,
}) => {
    const { formatMessage } = useSafeIntl();
    const handleClick = useCallback(() => {
        setSelectedChangeRequest({
            id: changeRequestId,
            index,
        });
    }, [changeRequestId, index, setSelectedChangeRequest]);
    return (
        <IconButton
            onClick={handleClick}
            aria-label={formatMessage(MESSAGES.edit)}
            size="small"
        >
            <SettingsIcon />
        </IconButton>
    );
};
