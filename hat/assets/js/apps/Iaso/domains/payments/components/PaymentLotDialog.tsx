import React, { FunctionComponent } from 'react';
import {
    IntlMessage,
    makeFullModal,
    ConfirmCancelModal,
    useSafeIntl,
} from 'bluesquare-components';
import * as Yup from 'yup';
import SettingsIcon from '@mui/icons-material/Settings';
import { IconButton, Button, Box } from '@mui/material';
import Add from '@mui/icons-material/Add';

import { useFormik } from 'formik';
import MESSAGES from '../messages';
import { PotentialPayment, PotentialPaymentParams } from '../types';
import { Selection } from '../../orgUnits/types/selection';
import { useGetSelectedPotentialPayments } from '../hooks/requests/useGetSelectedPotentialPayments';

type Props = {
    titleMessage: IntlMessage;
    isOpen: boolean;
    closeDialog: () => void;
    selection: Selection<PotentialPayment>;
    params: PotentialPaymentParams;
};

type FormikValues = {
    potentialPayments: PotentialPayment[];
};

const validationSchema = Yup.object().shape({
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
    const { data: potentialPaymets, isFetching } =
        useGetSelectedPotentialPayments(params, selection);
    console.log('potentialPaymets', potentialPaymets);
    const {
        values,
        // setFieldValue,
        // setFieldError,
        isValid,
        handleSubmit,
        // errors,
    } = useFormik<FormikValues>({
        initialValues: {
            potentialPayments: [],
        },
        validationSchema,
        onSubmit: () => {
            console.log('save', values);
            console.log('selection', selection);
            // onConfirm(values);
        },
    });
    // const handleSetError = useCallback(
    //     (keyValue, message) => {
    //         const parts = keyValue.split('-');
    //         const rangeIndex = parseInt(parts[2], 10) - 1;
    //         setFieldError(`rangeValues[${rangeIndex}].percent`, message);
    //     },
    //     [setFieldError],
    // );
    // const mappedErrors = useMemo(() => {
    //     return Array.isArray(errors.rangeValues)
    //         ? errors.rangeValues.map(error => error?.percent || undefined)
    //         : [];
    // }, [errors]);
    return (
        <ConfirmCancelModal
            titleMessage={titleMessage}
            onConfirm={() => handleSubmit()}
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.save}
            maxWidth="xs"
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
            DIALOG
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
