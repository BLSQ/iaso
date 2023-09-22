import {
    makeFullModal,
    AddButton,
    IntlMessage,
    ConfirmCancelModal,
    useSafeIntl,
} from 'bluesquare-components';
import React, { FunctionComponent, useCallback, useState } from 'react';
import { useFormik } from 'formik';
import { isEqual } from 'lodash';

import MESSAGES from '../messages';
import { useGetDropdownStockItems } from '../hooks/requests/useGetDropdownStockItems';
import { useGetOrgUnit } from '../../orgUnits/components/TreeView/requests';
import { useStockMovementValidation } from '../validation';
import {
    useApiErrorValidation,
    useTranslatedErrors,
} from '../../../libs/validation';
import {
    SaveStockMovementQuery,
    useSaveStockMovement,
} from '../hooks/requests/useSaveStockMovement';
import InputComponent from '../../../components/forms/InputComponent';
import { OrgUnitTreeviewModal } from '../../orgUnits/components/TreeView/OrgUnitTreeviewModal';

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
    const { formatMessage } = useSafeIntl();
    // Local state
    const [orgUnitId, setOrgUnitId] = useState<number | undefined>();

    // API calls
    const { data: selectedOrgUnit } = useGetOrgUnit(orgUnitId);
    const { data: stockItems, isFetching: isFetchingStockItems } =
        useGetDropdownStockItems();

    const { mutateAsync: saveStockMovement } = useSaveStockMovement();

    // API form validation
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

    // Form validation
    const schema = useStockMovementValidation(apiErrors, payload);

    // Formik
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
    } = useFormik({
        initialValues: {},
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema: schema,
        onSubmit: save,
    });

    const getErrors = useTranslatedErrors({
        errors,
        formatMessage,
        touched,
        messages: MESSAGES,
    });

    const onChange = useCallback(
        (keyValue, value) => {
            setFieldValue(keyValue, value);
            setFieldTouched(keyValue, true);
        },
        [setFieldTouched, setFieldValue],
    );
    console.log('errors', errors);
    console.log('values', values);
    console.log('touched', touched);
    return (
        <ConfirmCancelModal
            titleMessage={titleMessage}
            onConfirm={() => handleSubmit()}
            maxWidth="xs"
            closeDialog={closeDialog}
            open={isOpen}
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.save}
            id="stock-movement-dialog"
            dataTestId="stock-movement-dialog"
            // allowConfirm={isValid && !isEqual(values, initialValues)}
            allowConfirm
            onClose={() => null}
            onCancel={() => resetForm()}
        >
            <OrgUnitTreeviewModal
                required
                clearable={false}
                toggleOnLabelClick={false}
                titleMessage={MESSAGES.org_unit}
                onConfirm={orgUnit => {
                    setOrgUnitId(orgUnit.id);
                    onChange('org_unit', orgUnit.id);
                }}
                initialSelection={selectedOrgUnit}
                // errors={getErrors('org_unit')}
                multiselect={false}
            />
            <InputComponent
                type="select"
                keyValue="stock_item"
                loading={isFetchingStockItems}
                onChange={(keyValue, value) => {
                    onChange(keyValue, parseInt(value, 10));
                }}
                value={values.stock_item}
                label={MESSAGES.stockItem}
                options={stockItems}
                required
                clearable={false}
                // errors={getErrors('stock_item')}
            />
            <InputComponent
                type="number"
                keyValue="quantity"
                onChange={onChange}
                value={values.quantity}
                label={MESSAGES.quantity}
                required
                errors={getErrors('quantity')}
            />
        </ConfirmCancelModal>
    );
};

const modalWithButton = makeFullModal(AddStockMovementDialog, AddButton);

export { modalWithButton as AddStockMovementDialog };
