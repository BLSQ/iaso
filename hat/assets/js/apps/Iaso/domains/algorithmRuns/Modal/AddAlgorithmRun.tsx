import { ConfirmCancelModal, makeFullModal } from 'bluesquare-components';
import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { useFormik } from 'formik';
import { isEqual } from 'lodash';
import {
    useGetAlgorithmsOptions,
    useGetDataSources,
    useSourceOptions,
    useSourceVersionOptions,
} from '../../links/hooks/filters';
import InputComponent from '../../../components/forms/InputComponent';
import { MESSAGES } from '../messages';
import { AddRunButton } from './AddRunButton';
import { useRunValidation } from '../hooks/useRunValidation';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    launchRun: any;
    isSaving: boolean;
};

const AddAlgorithmRun: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
    launchRun,
    isSaving,
}) => {
    const validationSchema = useRunValidation();
    const {
        setFieldValue,
        setValues,
        values,
        initialValues,
        errors,
        setFieldTouched,
        touched,
        isSubmitting,
        isValid,
        handleSubmit,
        resetForm,
    } = useFormik({
        initialValues: {
            algoId: undefined,
            sourceOriginId: undefined,
            versionOrigin: undefined,
            sourceDestinationId: undefined,
            versionDestination: undefined,
        },
        validationSchema,
        onSubmit: body => launchRun(body),
    });

    const { data: algorithmOptions, isLoading: isLoadingAlgos } =
        useGetAlgorithmsOptions();
    const { data: sources, isFetching: isLoadingSources } = useGetDataSources();

    const sourceOptions = useSourceOptions(sources);

    const { options: originVersionOptions, disabled: originVersionDisabled } =
        useSourceVersionOptions({
            sources,
            source: values.sourceOriginId,
        });
    const {
        options: destinationVersionOptions,
        disabled: destinationVersionDisabled,
    } = useSourceVersionOptions({
        sources,
        source: values.sourceDestinationId,
    });

    const handleChange = useCallback(
        (keyValue, value) => {
            setFieldTouched(keyValue, true);
            setFieldValue(keyValue, value);
        },
        [setFieldTouched, setFieldValue],
    );

    const handleSourceChange = useCallback(
        (keyValue, value) => {
            setFieldTouched(keyValue, true);
            if (keyValue === 'sourceOriginId') {
                setValues({
                    ...values,
                    sourceOriginId: value,
                    versionOrigin: undefined,
                });
            } else if (keyValue === 'sourceDestinationId') {
                setValues({
                    ...values,
                    sourceDestinationId: value,
                    versionDestination: undefined,
                });
            }
        },
        [setFieldTouched, setValues, values],
    );

    const formErrors = useMemo(() => {
        if (isEqual(touched, {})) {
            return {};
        }
        return {
            algoId:
                touched.algoId && errors.algoId ? [errors.algoId] : undefined,
            sourceOriginId: touched.sourceOriginId
                ? [errors.sourceOriginId]
                : undefined,
            versionOrigin: touched.versionOrigin
                ? [errors.versionOrigin]
                : undefined,
            sourceDestinationId: touched.sourceDestinationId
                ? [errors.sourceDestinationId]
                : undefined,
            versionDestination: touched.versionDestination
                ? [errors.versionDestination]
                : undefined,
        };
    }, [
        errors.algoId,
        errors.sourceDestinationId,
        errors.sourceOriginId,
        errors.versionDestination,
        errors.versionOrigin,
        touched,
    ]);

    const allowConfirm =
        isValid &&
        !isSubmitting &&
        !isSaving &&
        !isEqual(touched, {}) &&
        !isEqual(values, initialValues);

    return (
        <ConfirmCancelModal
            dataTestId="add-run-modal"
            id="add-run-modal"
            open={isOpen}
            closeDialog={closeDialog}
            onConfirm={handleSubmit}
            onClose={() => null}
            onCancel={() => resetForm()}
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.save}
            titleMessage={MESSAGES.addRun}
            allowConfirm={allowConfirm}
        >
            <InputComponent
                dataTestId="links-algo-filter"
                keyValue="algoId"
                label={MESSAGES.algorithm}
                type="select"
                value={values.algoId}
                onChange={handleChange}
                options={algorithmOptions}
                loading={isLoadingAlgos}
                required
                errors={formErrors.algoId}
            />
            <InputComponent
                keyValue="sourceOriginId"
                label={MESSAGES.sourceorigin}
                type="select"
                multi={false}
                onChange={handleSourceChange}
                value={values.sourceOriginId}
                dataTestId="links-origin-filter"
                options={sourceOptions}
                loading={isLoadingSources}
                required
            />
            <InputComponent
                keyValue="versionOrigin"
                label={MESSAGES.sourceoriginversion}
                type="select"
                multi={false}
                onChange={handleChange}
                value={values.versionOrigin}
                dataTestId="links-origin-version-filter"
                options={originVersionOptions}
                disabled={originVersionDisabled}
                loading={isLoadingSources}
                required
            />
            <InputComponent
                keyValue="sourceDestinationId"
                label={MESSAGES.sourcedestination}
                type="select"
                multi={false}
                onChange={handleSourceChange}
                value={values.sourceDestinationId}
                dataTestId="links-destination-filter"
                options={sourceOptions}
                loading={isLoadingSources}
                required
            />
            <InputComponent
                keyValue="versionDestination"
                label={MESSAGES.sourcedestinationversion}
                type="select"
                multi={false}
                onChange={handleChange}
                value={values.versionDestination}
                dataTestId="links-destination-version-filter"
                options={destinationVersionOptions}
                disabled={destinationVersionDisabled}
                loading={isLoadingSources}
                required
            />
        </ConfirmCancelModal>
    );
};

const AddRunModal = makeFullModal(AddAlgorithmRun, AddRunButton);

export { AddRunModal as AddAlgorithmRun };
