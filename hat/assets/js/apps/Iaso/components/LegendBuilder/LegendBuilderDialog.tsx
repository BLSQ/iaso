/* eslint-disable camelcase */
import React, { FunctionComponent, useCallback, useMemo } from 'react';
import {
    IntlMessage,
    makeFullModal,
    ConfirmCancelModal,
    useSafeIntl,
} from 'bluesquare-components';
import * as Yup from 'yup';
import SettingsIcon from '@material-ui/icons/Settings';
import IconButton from '@material-ui/core/IconButton';

import { useFormik } from 'formik';
import { Box, Button } from '@material-ui/core';
import Add from '@material-ui/icons/Add';
import { MESSAGES } from './messages';
import { ScaleThreshold } from './types';
import { LegendBuilder } from './index';
import { getRangeValues, getScaleThreshold } from './utils';

type Props = {
    titleMessage: IntlMessage;
    isOpen: boolean;
    closeDialog: () => void;
    // eslint-disable-next-line no-unused-vars
    onConfirm: (threshold?: ScaleThreshold) => void;
    threshold?: ScaleThreshold;
};

const validationSchema = Yup.object().shape({
    rangeValues: Yup.array().of(
        Yup.object().shape({
            percent: Yup.number(),
            color: Yup.string(),
            id: Yup.string(),
        }),
    ),
});

const LegendBuilderDialog: FunctionComponent<Props> = ({
    titleMessage,
    isOpen,
    closeDialog,
    onConfirm,
    threshold,
}) => {
    const {
        values: { rangeValues },
        setFieldValue,
        setFieldError,
        isValid,
        handleSubmit,
        errors,
    } = useFormik({
        initialValues: {
            rangeValues: getRangeValues(threshold),
        },
        validationSchema,
        onSubmit: () => {
            onConfirm(getScaleThreshold(rangeValues));
        },
    });
    const handleSetError = useCallback(
        (keyValue, message) => {
            const parts = keyValue.split('-');
            const rangeIndex = parseInt(parts[2], 10) - 1;
            setFieldError(`rangeValues[${rangeIndex}].percent`, message);
        },
        [setFieldError],
    );
    const mappedErrors = useMemo(() => {
        return Array.isArray(errors.rangeValues)
            ? errors.rangeValues.map(error => error?.percent || undefined)
            : [];
    }, [errors]);
    return (
        <ConfirmCancelModal
            titleMessage={titleMessage}
            onConfirm={() => handleSubmit()}
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.save}
            maxWidth="xs"
            open={isOpen}
            allowConfirm={isValid && rangeValues.length > 1}
            closeDialog={closeDialog}
            onClose={() => null}
            onCancel={() => {
                closeDialog();
            }}
            id="legend-dialog"
            dataTestId="uslegender-dialog"
        >
            <LegendBuilder
                errors={mappedErrors}
                setFieldError={handleSetError}
                rangeValues={rangeValues}
                onChange={newRangeValues =>
                    setFieldValue('rangeValues', newRangeValues)
                }
            />
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
const AddButton: FunctionComponent<PropsIcon> = ({ onClick }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Button
            variant="contained"
            color="primary"
            onClick={onClick}
            size="small"
        >
            <Box display="inline-block" mr={1} position="relative" top="4px">
                <Add fontSize="small" />
            </Box>
            {formatMessage(MESSAGES.createLegend)}
        </Button>
    );
};

const modalWithButton = makeFullModal(LegendBuilderDialog, AddButton);
const modalWithIcon = makeFullModal(LegendBuilderDialog, EditIconButton);

export {
    modalWithButton as AddLegendDialog,
    modalWithIcon as EditLegendDialog,
};
