import { Box, Button } from '@mui/material';
import {
    ConfirmCancelModal,
    IntlMessage,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import React, { FunctionComponent, useCallback, useMemo } from 'react';
import * as Yup from 'yup';

import Add from '@mui/icons-material/Add';
import { useFormik } from 'formik';
import { EditIconButton } from '../Buttons/EditIconButton';
import { LegendBuilder } from './index';
import { MESSAGES } from './messages';
import { ScaleThreshold } from './types';
import { getRangeValues, getScaleThreshold } from './utils';

type Props = {
    titleMessage: IntlMessage;
    isOpen: boolean;
    closeDialog: () => void;
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
