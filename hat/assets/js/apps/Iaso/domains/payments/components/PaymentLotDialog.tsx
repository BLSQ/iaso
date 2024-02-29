import React, { FunctionComponent, useCallback, useEffect } from 'react';
import {
    IntlMessage,
    makeFullModal,
    ConfirmCancelModal,
    useSafeIntl,
    Table,
} from 'bluesquare-components';
import * as Yup from 'yup';
import SettingsIcon from '@mui/icons-material/Settings';
import { IconButton, Button, Box, Divider, Grid } from '@mui/material';
import Add from '@mui/icons-material/Add';

import { useFormik } from 'formik';
import MESSAGES from '../messages';
import { PotentialPayment, PotentialPaymentParams } from '../types';
import { Selection } from '../../orgUnits/types/selection';
import { useGetSelectedPotentialPayments } from '../hooks/requests/useGetSelectedPotentialPayments';
import { usePotentialPaymentColumns } from '../config/usePotentialPaymentColumns';
import { SxStyles } from '../../../types/general';
import InputComponent from '../../../components/forms/InputComponent';
import { useTranslatedErrors } from '../../../libs/validation';
import {
    SavePaymentLotQuery,
    useSavePaymentLot,
} from '../hooks/requests/useSavePaymentLot';

const styles: SxStyles = {
    table: {
        mx: -3,
        mt: 2,
        '& .MuiSpeedDial-root': {
            display: 'none',
        },
    },
};

type Props = {
    titleMessage: IntlMessage;
    isOpen: boolean;
    closeDialog: () => void;
    selection: Selection<PotentialPayment>;
    params: PotentialPaymentParams;
};

type FormikValues = {
    name: string;
    potentialPayments: PotentialPayment[];
    comment?: string;
};

const validationSchema = Yup.object().shape({
    name: Yup.string().nullable().required(),
    comment: Yup.string().nullable(),
    potentialPayments: Yup.array().of(
        Yup.object().shape({
            id: Yup.string(),
        }),
    ),
});

const PaymentLotDialog: FunctionComponent<Props> = ({
    titleMessage,
    isOpen,
    closeDialog,
    selection,
    params,
}) => {
    const { data: potentialPayments, isFetching } =
        useGetSelectedPotentialPayments(params, selection);

    const { mutateAsync: savePaymentLot } = useSavePaymentLot('create');
    const {
        values,
        setFieldValue,
        setFieldTouched,
        // setFieldError,
        touched,
        isValid,
        handleSubmit,
        errors,
    } = useFormik<FormikValues>({
        initialValues: {
            potentialPayments: [],
            name: '',
            comment: '',
        },
        validationSchema,
        validateOnMount: true,
        onSubmit: () => {
            const body: SavePaymentLotQuery = {
                ...values,
                potential_payments: values.potentialPayments.map(pp => pp.id),
            };
            savePaymentLot(body);
        },
    });
    const { formatMessage } = useSafeIntl();
    const columns = usePotentialPaymentColumns();
    const handleChange = useCallback(
        (keyValue, value) => {
            setFieldTouched(keyValue, true);
            setFieldValue(keyValue, value);
        },
        [setFieldTouched, setFieldValue],
    );
    const getErrors = useTranslatedErrors({
        errors,
        formatMessage,
        touched,
        messages: MESSAGES,
    });
    useEffect(() => {
        setFieldValue('potentialPayments', potentialPayments);
    }, [potentialPayments, setFieldValue]);
    return (
        <ConfirmCancelModal
            titleMessage={titleMessage}
            onConfirm={() => handleSubmit()}
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.save}
            maxWidth="xl"
            open={isOpen}
            allowConfirm={isValid}
            closeDialog={closeDialog}
            onClose={() => null}
            onCancel={() => {
                closeDialog();
            }}
            id="paylment-lot-dialog"
            dataTestId="paylment-lot-dialog"
        >
            <Grid container spacing={2}>
                <Grid item xs={4}>
                    <InputComponent
                        type="text"
                        required
                        keyValue="name"
                        labelString={formatMessage(MESSAGES.name)}
                        value={values.name}
                        onChange={handleChange}
                        errors={getErrors('name')}
                    />
                    <InputComponent
                        type="text"
                        multiline
                        keyValue="comment"
                        labelString={formatMessage(MESSAGES.comment)}
                        value={values.comment}
                        onChange={handleChange}
                        errors={getErrors('comment')}
                    />
                </Grid>
                <Grid item xs={4}>
                    <Box>Date: Date d'ajd</Box>
                    <Box>Creator: Moi</Box>
                </Grid>
            </Grid>
            <Box sx={styles.table}>
                <Divider />
                {/* @ts-ignore */}
                <Table
                    countOnTop={false}
                    elevation={0}
                    marginTop={false}
                    data={potentialPayments || []}
                    pages={1}
                    defaultSorted={[{ id: 'user__last_name', desc: false }]}
                    columns={columns}
                    count={potentialPayments?.length ?? 0}
                    extraProps={{ loading: isFetching }}
                    showPagination={false}
                />
            </Box>
        </ConfirmCancelModal>
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

type AddButtonProps = {
    onClick: () => void;
    disabled: boolean;
};

const AddButton: FunctionComponent<AddButtonProps> = ({
    onClick,
    disabled,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Button
            variant="contained"
            color="primary"
            onClick={onClick}
            size="small"
            disabled={disabled}
        >
            <Box display="inline-block" mr={1} position="relative" top="4px">
                <Add fontSize="small" />
            </Box>
            {formatMessage(MESSAGES.createLot)}
        </Button>
    );
};

const modalWithButton = makeFullModal(PaymentLotDialog, AddButton);
const modalWithIcon = makeFullModal(PaymentLotDialog, EditIconButton);

export {
    modalWithButton as AddPaymentLotDialog,
    modalWithIcon as EditPaymentLotDialog,
};
