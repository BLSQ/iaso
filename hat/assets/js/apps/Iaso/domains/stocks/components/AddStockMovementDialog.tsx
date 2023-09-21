import {
    makeFullModal,
    AddButton,
    IntlMessage,
    ConfirmCancelModal,
} from 'bluesquare-components';
import React, { FunctionComponent, useState } from 'react';
import { useFormik } from 'formik';
import MESSAGES from '../messages';
import { useGetDropdownStockItems } from '../hooks/requests/useGetDropdownStockItems';
import { useGetOrgUnit } from '../../orgUnits/components/TreeView/requests';
import { useStockMovementValidation } from '../validation';
import { useApiErrorValidation } from '../../../libs/validation';
import {
    SaveStockMovementQuery,
    useSaveStockMovement,
} from '../hooks/requests/useSaveStockMovement';

type Props = {
    titleMessage: IntlMessage;
    isOpen: boolean;
    closeDialog: () => void;
};

const AddStockMovementDialog: FunctionComponent<Props> = ({
    titleMessage,
    isOpen,
    closeDialog,
}) => {
    const [orgUnitId, setOrgUnitId] = useState<number | undefined>();
    const { data: selectedOrgUnit } = useGetOrgUnit(orgUnitId);
    const { data: items, isFetching: isFetchingItems } =
        useGetDropdownStockItems();

    const { mutateAsync: saveStockMovement } = useSaveStockMovement();

    const {
        apiErrors,
        payload,
        mutation: save,
    } = useApiErrorValidation<Partial<SaveStockMovementQuery>, any>({
        mutationFn: saveStockMovement,
        onSuccess: () => {
            closeDialog();
        },
    });
    const schema = useStockMovementValidation(apiErrors, payload);

    const formik = useFormik({
        initialValues: {},
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema: schema,
        onSubmit: save,
    });

    const {
        values,
        setFieldValue,
        touched,
        setFieldTouched,
        errors,
        isValid,
        initialValues,
        handleSubmit,
        resetForm,
    } = formik;

    return (
        <ConfirmCancelModal
            titleMessage={titleMessage}
            onConfirm={() => {
                // handleSubmit();
                console.log('onConfirm');
            }}
            maxWidth="xs"
            closeDialog={closeDialog}
            open={isOpen}
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.save}
            id="stock-movement-dialog"
            dataTestId="stock-movement-dialog"
            allowConfirm
            onClose={() => null}
            onCancel={() => {
                console.log('resetForm');
                // resetForm();
            }}
        >
            Contenu modal
        </ConfirmCancelModal>
    );
};

const modalWithButton = makeFullModal(AddStockMovementDialog, AddButton);

export { modalWithButton as AddStockMovementDialog };
