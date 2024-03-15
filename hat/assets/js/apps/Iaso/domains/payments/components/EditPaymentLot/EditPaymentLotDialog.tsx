import React, { FunctionComponent, useCallback, useState } from 'react';
import {
    SimpleModal,
    makeFullModal,
    useSafeIntl,
    Table,
} from 'bluesquare-components';
import { Box, Button, Paper, Grid, Divider } from '@mui/material';
import MESSAGES from '../../messages';
import { usePaymentColumns } from '../../hooks/config/usePaymentColumns';
import { useSavePaymentLot } from '../../hooks/requests/useSavePaymentLot';
import { Payment, PaymentLot } from '../../types';
import { useTableSelection } from '../../../../utils/table';
import { EditIconButton } from '../../../../components/Buttons/EditIconButton';
import { BulkEditPaymentDialog } from '../BulkEditPayment/BulkEditPaymentsDialog';
import { PaymentLotInfos } from './PaymentLotInfos';
import { SxStyles } from '../../../../types/general';

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
    const [name, setName] = useState<string>(paymentLot.name);
    const [comment, setComment] = useState<string | null>(
        paymentLot?.comment ?? null,
    );
    const count = paymentLot?.payments?.length ?? 0;
    const {
        selection,
        handleTableSelection,
        handleSelectAll,
        handleUnselectAll,
    } = useTableSelection<Payment>(count);
    const columns = usePaymentColumns({ potential: false });
    const { mutateAsync: savePaymentLot } = useSavePaymentLot('edit');
    const allowSaveInfos =
        comment !== paymentLot.comment ||
        (name !== undefined && name !== null && name !== paymentLot.name); // can't use name && name!==paymentLot.name as thsi would result in a string
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
                {/* @ts-ignore */}
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
                                    >
                                        Select All
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
                                >
                                    Unselect All
                                </Button>
                            </Grid>
                            <Grid item>
                                <BulkEditPaymentDialog
                                    selection={selection}
                                    resetSelection={handleUnselectAll}
                                    iconProps={{
                                        disabled: selection.selectCount === 0,
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
                        data={paymentLot?.payments || []}
                        pages={1}
                        defaultSorted={[{ id: 'user__last_name', desc: false }]}
                        columns={columns}
                        count={count}
                        multiSelect
                        showPagination={false}
                        selection={selection}
                        extraProps={{
                            columns,
                        }}
                        // @ts-ignore
                        setTableSelection={handleTableSelection}
                    />
                </Paper>
            </Box>
        </SimpleModal>
    );
};

const modalWithButton = makeFullModal(EditPaymentLotDialog, EditIconButton);

export { modalWithButton as EditPaymentLotDialog };
