import React, { FunctionComponent, useCallback, useState } from 'react';
import {
    SimpleModal,
    makeFullModal,
    useSafeIntl,
    Table,
} from 'bluesquare-components';
import { Box, Button, Paper, Grid, Divider } from '@mui/material';
import moment from 'moment';
import MESSAGES from '../../messages';
import InputComponent from '../../../../components/forms/InputComponent';
import { styles } from '../shared';
import { usePaymentColumns } from '../../hooks/config/usePaymentColumns';
import getDisplayName from '../../../../utils/usersUtils';
import { useSavePaymentLot } from '../../hooks/requests/useSavePaymentLot';
import { Payment } from '../../types';
import { useTableSelection } from '../../../../utils/table';
import { EditIconButton } from '../../../../components/Buttons/EditIconButton';
import { BulkEditPaymentDialog } from '../BulkEditPayment/BulkEditPaymentsDialog';
import {
    useBulkSavePaymentStatus,
    useSavePaymentStatus,
} from '../../hooks/requests/useSavePaymentStatus';

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

type Props = { isOpen: boolean; closeDialog: () => void; paymentLot: any };

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
    const count = paymentLot?.payments?.length ?? 0;
    const {
        selection,
        handleTableSelection,
        handleSelectAll,
        handleUnselectAll,
    } = useTableSelection<Payment>(count);

    const { mutateAsync: savePaymentLot, isLoading: isSavingPaymentLot } =
        useSavePaymentLot('edit');
    const { mutateAsync: saveStatus, isLoading: isSavingPayment } =
        useSavePaymentStatus();
    const { mutateAsync: bulkSaveStatus, isLoading: isBulkSaving } =
        useBulkSavePaymentStatus();

    const columns = usePaymentColumns({ potential: false, saveStatus });
    const handleSaveName = useCallback(
        () => savePaymentLot({ id: paymentLot.id, name }),
        [savePaymentLot, paymentLot.id, name],
    );
    const handleSaveComment = useCallback(
        () => savePaymentLot({ id: paymentLot.id, comment }),
        [savePaymentLot, paymentLot.id, comment],
    );
    return (
        <SimpleModal
            buttons={CloseButton}
            open={isOpen}
            onClose={() => null}
            id="PaymentLotEditionDialog"
            dataTestId="PaymentLotEditionDialog"
            titleMessage={MESSAGES.edit}
            closeDialog={closeDialog}
            maxWidth="xl"
        >
            <Grid container spacing={2}>
                <Grid container item xs={7} md={6} lg={4}>
                    <Grid container item xs={12}>
                        <Grid item xs={9}>
                            <InputComponent
                                type="text"
                                required
                                keyValue="name"
                                labelString={formatMessage(MESSAGES.name)}
                                value={name}
                                onChange={(_, value) => setName(value)}
                            />
                        </Grid>
                        <Grid item xs={3}>
                            <Box ml={2} my={2} mt={3}>
                                <Button
                                    color="primary"
                                    variant="contained"
                                    size="medium"
                                    onClick={handleSaveName}
                                    disabled={isSavingPaymentLot}
                                >
                                    {formatMessage(MESSAGES.save)}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                    <Grid item xs={9}>
                        <InputComponent
                            type="text"
                            multiline
                            keyValue="comment"
                            labelString={formatMessage(MESSAGES.comment)}
                            value={comment}
                            onChange={(_, value) => setComment(value)}
                        />
                    </Grid>
                    <Grid item xs={3}>
                        <Box my={2} ml={2} mt={3}>
                            <Button
                                color="primary"
                                variant="contained"
                                size="medium"
                                onClick={handleSaveComment}
                                disabled={isSavingPaymentLot}
                            >
                                {formatMessage(MESSAGES.save)}
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
                <Grid item xs={5} md={4}>
                    <Box sx={styles.infos}>
                        <span>{formatMessage(MESSAGES.date)}:</span>
                        {moment().format('L')}
                    </Box>
                    <Box sx={styles.infos}>
                        <span>{formatMessage(MESSAGES.created_by)}:</span>
                        {getDisplayName(paymentLot.created_by)}
                    </Box>
                </Grid>
            </Grid>
            <Box sx={styles.table} mt={2}>
                <Divider />
                {/* @ts-ignore */}
                <Paper elevation={0}>
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
                                        disabled={isBulkSaving}
                                    >
                                        Select All
                                    </Button>
                                </Box>
                            </Grid>
                            <Grid item>
                                {/* <Box> */}
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    onClick={() => {
                                        handleUnselectAll();
                                    }}
                                    disabled={isBulkSaving}
                                >
                                    Unselect All
                                </Button>
                                {/* </Box> */}
                            </Grid>
                            <Grid item>
                                <BulkEditPaymentDialog
                                    selection={selection}
                                    resetSelection={handleUnselectAll}
                                    saveStatus={bulkSaveStatus}
                                    iconProps={{
                                        disabled:
                                            selection.selectCount === 0 ||
                                            isBulkSaving,
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
                            loading: isSavingPayment || isBulkSaving,
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
