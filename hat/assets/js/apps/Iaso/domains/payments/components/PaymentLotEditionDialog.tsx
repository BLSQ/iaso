import React, { FunctionComponent, useCallback, useState } from 'react';
import {
    SimpleModal,
    makeFullModal,
    useSafeIntl,
    Table,
} from 'bluesquare-components';
import SettingsIcon from '@mui/icons-material/Settings';
import { Box, Button, Divider, Grid, IconButton } from '@mui/material';
import moment from 'moment';
import MESSAGES from '../messages';
import InputComponent from '../../../components/forms/InputComponent';
import { styles } from './shared';
import { usePotentialPaymentColumns } from '../config/usePotentialPaymentColumns';
import getDisplayName from '../../../utils/usersUtils';
import { useSavePaymentLot } from '../hooks/requests/useSavePaymentLot';

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

export const PaymentLotEditionDialog: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
    paymentLot,
}) => {
    const { formatMessage } = useSafeIntl();
    const [name, setName] = useState<string>(paymentLot.name);
    const [comment, setComment] = useState<string | null>(
        paymentLot?.comment ?? null,
    );
    const columns = usePotentialPaymentColumns();
    const { mutateAsync: savePaymentLot } = useSavePaymentLot('edit');
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
                                // errors={getErrors('name')}
                            />
                        </Grid>
                        <Grid item xs={3}>
                            <Box ml={2} my={2} mt={3}>
                                <Button
                                    // className={buttonStyles.button}
                                    color="primary"
                                    variant="contained"
                                    size="medium"
                                    onClick={handleSaveName}
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
                            // errors={getErrors('comment')}
                        />
                    </Grid>
                    <Grid item xs={3}>
                        <Box my={2} ml={2} mt={3}>
                            <Button
                                // className={buttonStyles.button}
                                color="primary"
                                variant="contained"
                                size="medium"
                                onClick={handleSaveComment}
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
            <Box sx={styles.table}>
                <Divider />
                {/* @ts-ignore */}
                <Table
                    countOnTop={false}
                    elevation={0}
                    marginTop={false}
                    data={paymentLot?.payments || []}
                    pages={1}
                    defaultSorted={[{ id: 'user__last_name', desc: false }]}
                    columns={columns}
                    count={paymentLot?.payments?.length ?? 0}
                    showPagination={false}
                />
            </Box>
        </SimpleModal>
    );
};

type PropsIcon = {
    onClick: () => void;
};

export const EditIconButton: FunctionComponent<PropsIcon> = ({ onClick }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <IconButton
            onClick={onClick}
            aria-label={formatMessage(MESSAGES.edit)}
            size="small"
        >
            <SettingsIcon />
        </IconButton>
    );
};

const modalWithButton = makeFullModal(PaymentLotEditionDialog, EditIconButton);

export { modalWithButton as EditPaymentLotDialog };
