/* eslint-disable camelcase */
import React, {
    FunctionComponent,
    useCallback,
    Dispatch,
    SetStateAction,
    useMemo,
} from 'react';
import SettingsIcon from '@mui/icons-material/Settings';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import {
    LoadingSpinner,
    useSafeIntl,
    SimpleModal,
} from 'bluesquare-components';
import {
    Box,
    IconButton as IconButtonMui,
    TableContainer,
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
import InputComponent from '../../../components/forms/InputComponent';
import { ApproveOrgUnitChangesButtons } from './ApproveOrgUnitChangesButtons';
import { ChangeRequestValidationStatus } from './types';
import { useSaveChangeRequest } from './hooks/api/useSaveChangeRequest';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    selectedChangeRequest?: SelectedChangeRequest;
};

const useStyles = makeStyles(theme => ({
    head: {
        fontWeight: 'bold',
    },
    cell: {
        color: 'inherit',
    },
    cellRejected: {
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
    cellApproved: {
        '& > a': {
            color: theme.palette.success.main,
        },
        '& > span': {
            color: theme.palette.success.main,
        },
        '& .marker-custom.primary svg': {
            fill: theme.palette.success.main,
        },
    },
    checkBoxContainer: {
        '& label': {
            margin: 0,
        },
        '& svg': {
            fontSize: 20,
        },
    },
}));

export const ApproveOrgUnitChangesDialog: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
    selectedChangeRequest,
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const { data: changeRequest, isFetching: isFetchingChangeRequest } =
        useGetApprovalProposal(selectedChangeRequest?.id);
    const isNew: boolean =
        !isFetchingChangeRequest && changeRequest?.status === 'new';
    const { newFields, setSelected } = useNewFields(changeRequest);
    const titleMessage = useMemo(() => {
        if (changeRequest?.status === 'rejected') {
            return formatMessage(MESSAGES.seeRejectedChanges);
        }
        if (changeRequest?.status === 'approved') {
            return formatMessage(MESSAGES.seeApprovedChanges);
        }
        return formatMessage(MESSAGES.validateOrRejectChanges);
    }, [changeRequest?.status, formatMessage]);
    const { mutate: submitChangeRequest, isLoading: isSaving } =
        useSaveChangeRequest(closeDialog, selectedChangeRequest?.id);
    if (!selectedChangeRequest) return null;

    return (
        <SimpleModal
            open={isOpen}
            maxWidth="lg"
            onClose={() => null}
            id="approve-orgunit-changes-dialog"
            dataTestId="approve-orgunit-changes-dialog"
            titleMessage={titleMessage}
            closeDialog={closeDialog}
            buttons={() =>
                isFetchingChangeRequest ? (
                    <></>
                ) : (
                    <ApproveOrgUnitChangesButtons
                        closeDialog={closeDialog}
                        newFields={newFields}
                        isNew={isNew}
                        submitChangeRequest={submitChangeRequest}
                    />
                )
            }
        >
            <TableContainer sx={{ maxHeight: '80vh', minHeight: 200 }}>
                {(isFetchingChangeRequest || isSaving) && (
                    <LoadingSpinner absolute />
                )}
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell width={150}>
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
                            {isNew && (
                                <TableCell width={100}>
                                    <Box
                                        className={classes.head}
                                        display="flex"
                                        justifyContent="center"
                                    >
                                        {formatMessage(MESSAGES.selection)}
                                    </Box>
                                </TableCell>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {newFields.map(field => {
                            const isCellRejected =
                                (field.isChanged &&
                                    !field.isSelected &&
                                    isNew) ||
                                changeRequest?.status === 'rejected';
                            const isCellApproved =
                                (field.isChanged && field.isSelected) ||
                                (!isNew &&
                                    changeRequest?.status === 'approved');
                            return (
                                <TableRow key={field.key}>
                                    <TableCell>{field.label}</TableCell>
                                    <TableCell>{field.oldValue}</TableCell>
                                    <TableCell
                                        className={classNames(
                                            !isFetchingChangeRequest &&
                                                isCellRejected &&
                                                classes.cellRejected,
                                            !isFetchingChangeRequest &&
                                                isCellApproved &&
                                                classes.cellApproved,

                                            !isCellApproved &&
                                                !isCellRejected &&
                                                classes.cell,
                                        )}
                                    >
                                        {field.newValue}
                                    </TableCell>
                                    {isNew && (
                                        <TableCell>
                                            {field.isChanged && (
                                                <Box
                                                    display="flex"
                                                    justifyContent="center"
                                                    className={
                                                        classes.checkBoxContainer
                                                    }
                                                >
                                                    <InputComponent
                                                        type="checkbox"
                                                        withMarginTop={false}
                                                        value={field.isSelected}
                                                        keyValue={field.key}
                                                        onChange={() => {
                                                            setSelected(
                                                                field.key,
                                                            );
                                                        }}
                                                        labelString=""
                                                    />
                                                </Box>
                                            )}
                                        </TableCell>
                                    )}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </SimpleModal>
    );
};

type PropsIcon = {
    changeRequestId: number;
    setSelectedChangeRequest: Dispatch<SetStateAction<SelectedChangeRequest>>;
    index: number;
    status: ChangeRequestValidationStatus;
};

export const IconButton: FunctionComponent<PropsIcon> = ({
    setSelectedChangeRequest,
    changeRequestId,
    index,
    status,
}) => {
    const { formatMessage } = useSafeIntl();
    const handleClick = useCallback(() => {
        setSelectedChangeRequest({
            id: changeRequestId,
            index,
        });
    }, [changeRequestId, index, setSelectedChangeRequest]);
    return (
        <IconButtonMui
            onClick={handleClick}
            aria-label={formatMessage(MESSAGES.validateOrRejectChanges)}
            size="small"
        >
            {status === 'new' ? <SettingsIcon /> : <RemoveRedEyeIcon />}
        </IconButtonMui>
    );
};
