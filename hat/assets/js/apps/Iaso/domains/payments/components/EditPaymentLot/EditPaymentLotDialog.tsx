import { Box, Button, Divider, Grid, Paper } from '@mui/material';
import {
    SimpleModal,
    Table,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import Color from 'color';
import React, { FunctionComponent, useCallback, useState } from 'react';
import { EditIconButton } from '../../../../components/Buttons/EditIconButton';
import { useSortedItems } from '../../../../hooks/useSortedItems';
import { SxStyles } from '../../../../types/general';
import { useTableSelection } from '../../../../utils/table';
import { usePaymentColumns } from '../../hooks/config/usePaymentColumns';
import { useSavePaymentLot } from '../../hooks/requests/useSavePaymentLot';
import {
    useBulkSavePaymentStatus,
    useSavePaymentStatus,
} from '../../hooks/requests/useSavePaymentStatus';
import MESSAGES from '../../messages';
import { NestedPayment, Payment, PaymentLot } from '../../types';
import { BulkEditPaymentDialog } from '../BulkEditPayment/BulkEditPaymentsDialog';
import { PaymentLotInfos } from './PaymentLotInfos';

type DialogParams = {
    order: string;
};
type CancelButtonProps = {
    closeDialog: () => void;
};

const CloseButton: FunctionComponent<CancelButtonProps> = ({ closeDialog }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Button
            onClick={() => {
                closeDialog();
            }}
            color="primary"
            data-test="cancel-button"
        >
            {formatMessage(MESSAGES.close)}
        </Button>
    );
};

const localStyles: SxStyles = {
    table: {
        '& .MuiSpeedDial-root': {
            display: 'none',
        },
    },
};

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    paymentLot: PaymentLot;
};

const EditPaymentLotDialog: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
    paymentLot,
}) => {
    const { formatMessage } = useSafeIntl();
    const [name, setName] = useState<string>(paymentLot.name);
    const [comment, setComment] = useState<string | null>(
        paymentLot?.comment ?? null,
    );

    const [dialogParams, setDialogParams] = useState<DialogParams>({
        order: 'user__last_name',
    });
    const count = paymentLot?.payments?.length ?? 0;
    const {
        selection,
        handleTableSelection,
        handleSelectAll,
        handleUnselectAll,
    } = useTableSelection<Payment>(count);

    const { mutateAsync: savePaymentLot } = useSavePaymentLot('edit');
    const { mutateAsync: saveStatus, isLoading: isSavingPayment } =
        useSavePaymentStatus();
    const { mutateAsync: bulkSaveStatus, isLoading: isBulkSaving } =
        useBulkSavePaymentStatus();

    const columns = usePaymentColumns({
        potential: false,
        saveStatus,
        paymentLot,
    });
    const sortedPayments: NestedPayment[] | undefined =
        useSortedItems<NestedPayment>(
            paymentLot?.payments,
            columns,
            dialogParams.order,
        );

    const allowSaveInfos =
        comment !== paymentLot.comment ||
        (name !== undefined && name !== null && name !== paymentLot.name); // can't use name && name!==paymentLot.name as thsi would result in a string

    const isTaskRunning =
        paymentLot.task?.status === 'QUEUED' ||
        paymentLot.task?.status === 'RUNNING';
    const handleLotInfoChange = (
        keyValue: 'name' | 'comment',
        newValue: string,
    ): void => {
        if (keyValue === 'name') {
            setName(newValue);
        }
        if (keyValue === 'comment') {
            setComment(newValue);
        }
    };

    const handleSaveInfos = useCallback(() => {
        const payload: { id: number; name?: string; comment?: string | null } =
            { id: paymentLot.id };
        if (name && name !== paymentLot.name) {
            payload.name = name;
        }
        if (comment !== paymentLot.comment) {
            payload.comment = comment;
        }
        if (payload.name || payload.comment) {
            savePaymentLot(payload);
        }
    }, [
        comment,
        name,
        paymentLot.comment,
        paymentLot.id,
        paymentLot.name,
        savePaymentLot,
    ]);

    const getRowProps = useCallback(() => {
        if (
            paymentLot.task?.status === 'QUEUED' ||
            paymentLot.task?.status === 'RUNNING'
        ) {
            return {
                'data-test': 'paymentRow',
                sx: {
                    backgroundColor: t =>
                        `${Color(t.palette.yellow.main).fade(0.7)} !important`,
                    opacity: 0.5,
                },
            };
        }
        return {
            'data-test': 'paymentRow',
        };
    }, [paymentLot?.task?.status]);

    return (
        <SimpleModal
            buttons={CloseButton}
            open={isOpen}
            onClose={() => null}
            id="PaymentLotEditionDialog"
            dataTestId="PaymentLotEditionDialog"
            titleMessage=""
            closeDialog={closeDialog}
            maxWidth="xl"
        >
            <Box mt={2} ml={2} mb={4}>
                <PaymentLotInfos
                    name={name}
                    comment={comment}
                    paymentLot={paymentLot}
                    onChange={handleLotInfoChange}
                    onSave={handleSaveInfos}
                    allowSave={allowSaveInfos}
                />
            </Box>
            <Box sx={localStyles.table}>
                {/* <Divider /> */}
                <Paper elevation={2}>
                    <Box my={2} mr={2}>
                        <Grid container spacing={2} justifyContent="flex-end">
                            <Grid item>
                                <Box>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        onClick={() => {
                                            handleSelectAll();
                                        }}
                                        disabled={isBulkSaving || isTaskRunning}
                                    >
                                        {formatMessage(MESSAGES.selectAll)}
                                    </Button>
                                </Box>
                            </Grid>
                            <Grid item>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    onClick={() => {
                                        handleUnselectAll();
                                    }}
                                    disabled={isBulkSaving || isTaskRunning}
                                >
                                    {formatMessage(MESSAGES.unSelectAll)}
                                </Button>
                            </Grid>
                            <Grid item>
                                <BulkEditPaymentDialog
                                    selection={selection}
                                    resetSelection={handleUnselectAll}
                                    saveStatus={bulkSaveStatus}
                                    paymentLotId={paymentLot.id}
                                    iconProps={{
                                        disabled:
                                            selection.selectCount === 0 ||
                                            isBulkSaving ||
                                            isTaskRunning,
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                    <Divider />
                    <Table
                        countOnTop={false}
                        elevation={0}
                        marginTop={false}
                        params={dialogParams}
                        data={sortedPayments || []}
                        pages={1}
                        defaultSorted={[{ id: 'user__last_name', desc: false }]}
                        columns={columns}
                        rowProps={getRowProps}
                        count={count}
                        multiSelect
                        showPagination={false}
                        selection={selection}
                        extraProps={{
                            columns,
                            loading:
                                isSavingPayment ||
                                isBulkSaving ||
                                isTaskRunning,
                            getRowProps,
                        }}
                        // @ts-ignore
                        setTableSelection={handleTableSelection}
                        onTableParamsChange={p =>
                            setDialogParams(p as DialogParams)
                        }
                    />
                </Paper>
            </Box>
        </SimpleModal>
    );
};

const modalWithButton = makeFullModal(EditPaymentLotDialog, EditIconButton);

export { modalWithButton as EditPaymentLotDialog };
