/* eslint-disable camelcase */
import React, { FunctionComponent, useState } from 'react';
import {
    IntlMessage,
    useSafeIntl,
    makeFullModal,
    ConfirmCancelModal,
    AddButton,
} from 'bluesquare-components';

import { useFormik } from 'formik';
import { isEqual } from 'lodash';
import MESSAGES from '../messages';
import {
    SaveStockMovementQuery,
    useSaveStockMovement,
} from '../hooks/requests/useSaveStockMovement';
import {
    useApiErrorValidation,
    useTranslatedErrors,
} from '../../../libs/validation';
import { useStockMovementValidation } from '../validation';
import InputComponent from '../../../components/forms/InputComponent';
import { useGetDropdownStockItems } from '../hooks/requests/useGetDropdownStockItems';
import { OrgUnitTreeviewModal } from '../../orgUnits/components/TreeView/OrgUnitTreeviewModal';
import { useGetOrgUnit } from '../../orgUnits/components/TreeView/requests';

type Props = {
    titleMessage: IntlMessage;
    isOpen: boolean;
    closeDialog: () => void;
};

const StockMovementDialog: FunctionComponent<Props> = ({
    titleMessage,
    isOpen,
    closeDialog,
}) => {
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: saveUserRole } = useSaveStockMovement();
    const [orgUnitId, setOrgUnitId] = useState<number | undefined>();
    const { data: selectedOrgUnit } = useGetOrgUnit(orgUnitId);
    const { data: items, isFetching: isFetchingItems } =
        useGetDropdownStockItems();
    const {
        apiErrors,
        payload,
        mutation: save,
    } = useApiErrorValidation<Partial<SaveStockMovementQuery>, any>({
        mutationFn: saveUserRole,
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

    const getErrors = useTranslatedErrors({
        errors,
        formatMessage,
        touched,
        messages: MESSAGES,
    });

    const onChange = (keyValue, value) => {
        setFieldTouched(keyValue, true);
        setFieldValue(keyValue, value);
    };
    return (
        <ConfirmCancelModal
            titleMessage={titleMessage}
            onConfirm={() => {
                handleSubmit();
            }}
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.save}
            maxWidth="xs"
            open={isOpen}
            closeDialog={closeDialog}
            allowConfirm={isValid && !isEqual(values, initialValues)}
            onClose={() => null}
            onCancel={() => {
                resetForm();
            }}
            id="stock-movement-dialog"
            dataTestId="stock-movement-dialog"
        >
            <InputComponent
                keyValue="quantity"
                onChange={onChange}
                value={values.quantity}
                errors={getErrors('quantity')}
                type="number"
                label={MESSAGES.quantity}
                required
            />
            <InputComponent
                type="select"
                keyValue="stock_item"
                loading={isFetchingItems}
                onChange={onChange}
                value={values.stock_item}
                label={MESSAGES.stockItem}
                options={items}
                clearable={false}
                required
            />

            <OrgUnitTreeviewModal
                required
                clearable={false}
                titleMessage={MESSAGES.org_unit}
                toggleOnLabelClick={false}
                onConfirm={orgUnit => {
                    setOrgUnitId(orgUnit.id);
                    onChange('org_unit', orgUnit.id);
                }}
                multiselect={false}
                initialSelection={selectedOrgUnit}
            />
        </ConfirmCancelModal>
    );
};

const modalWithButton = makeFullModal(StockMovementDialog, AddButton);

export { modalWithButton as AddStockMovementDialog };
