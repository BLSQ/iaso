import Add from '@mui/icons-material/Add';
import { Box, Button, Divider, Grid } from '@mui/material';
import {
    ConfirmCancelModal,
    IntlMessage,
    Table,
    makeFullModal,
    selectionInitialState,
    useSafeIntl,
} from 'bluesquare-components';
import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useState,
} from 'react';
import * as Yup from 'yup';

import { useFormik } from 'formik';
import moment from 'moment';
import InputComponent from '../../../../components/forms/InputComponent';
import { useTranslatedErrors } from '../../../../libs/validation';
import getDisplayName, { useCurrentUser } from '../../../../utils/usersUtils';
import { Selection } from '../../../orgUnits/types/selection';
import { usePaymentColumns } from '../../hooks/config/usePaymentColumns';
import { useGetSelectedPotentialPayments } from '../../hooks/requests/useGetSelectedPotentialPayments';
import {
    SavePaymentLotQuery,
    useSavePaymentLot,
} from '../../hooks/requests/useSavePaymentLot';
import MESSAGES from '../../messages';
import { PotentialPayment, PotentialPaymentParams } from '../../types';
import { styles } from '../shared';

type Props = {
    titleMessage: IntlMessage;
    isOpen: boolean;
    closeDialog: () => void;
    selection: Selection<PotentialPayment>;
    params: PotentialPaymentParams;
    setSelection: React.Dispatch<
        React.SetStateAction<Selection<PotentialPayment>>
    >;
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
    setSelection,
}) => {
    const [dialogParams, setDialogParams] = useState<PotentialPaymentParams>({
        ...params,
        order: 'user__last_name',
    });
    const { data: potentialPayments, isFetching } =
        useGetSelectedPotentialPayments(dialogParams, selection);

    const { mutateAsync: savePaymentLot } = useSavePaymentLot('create', () =>
        setSelection(selectionInitialState),
    );
    const currentUser = useCurrentUser();
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
    const columns = usePaymentColumns({ potential: true });
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
            id="payment-lot-dialog"
            dataTestId="payment-lot-dialog"
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
                    <Box sx={styles.infos}>
                        <span>{formatMessage(MESSAGES.date)}:</span>
                        {moment().format('L')}
                    </Box>
                    <Box sx={styles.infos}>
                        <span>{formatMessage(MESSAGES.created_by)}:</span>
                        {getDisplayName(currentUser)}
                    </Box>
                </Grid>
            </Grid>
            <Box sx={styles.table}>
                <Divider />
                <Table
                    countOnTop={false}
                    elevation={0}
                    marginTop={false}
                    params={dialogParams}
                    data={potentialPayments || []}
                    pages={1}
                    defaultSorted={[{ id: 'user__last_name', desc: false }]}
                    columns={columns}
                    count={potentialPayments?.length ?? 0}
                    extraProps={{ loading: isFetching }}
                    showPagination={false}
                    onTableParamsChange={p =>
                        setDialogParams(p as PotentialPaymentParams)
                    }
                />
            </Box>
        </ConfirmCancelModal>
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

export { modalWithButton as AddPaymentLotDialog };
