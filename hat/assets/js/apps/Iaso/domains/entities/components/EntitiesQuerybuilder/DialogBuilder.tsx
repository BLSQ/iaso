import React, {
    FunctionComponent,
    ReactNode,
    useCallback,
    useState,
} from 'react';
import { Box, useTheme, Button, Paper } from '@mui/material';
import { JsonLogicTree } from '@react-awesome-query-builder/mui';

import {
    useSafeIntl,
    ConfirmCancelModal,
    makeFullModal,
} from 'bluesquare-components';
import MESSAGES from '../../messages';
import { FormBuilder } from './FormBuilder';
import { TriggerModal } from './TriggerModal';

type FormState = {
    id?: string;
    form_id?: string;
    logic?: JsonLogicTree;
    not: boolean;
    operator?: string;
};

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    InfoPopper?: ReactNode;
};

const DialogBuilder: FunctionComponent<Props> = ({
    closeDialog,
    isOpen,
    InfoPopper,
}) => {
    const { formatMessage } = useSafeIntl();
    const [formStates, setFormStates] = useState<FormState[]>([
        {
            id: undefined,
            form_id: undefined,
            logic: undefined,
            not: false,
            operator: undefined,
        },
    ]);
    const theme = useTheme();

    const handleConfirm = () => {
        closeDialog();
        // compute the logic
    };

    // Single generic handler to update any field in FormState
    const updateFormState = useCallback(
        <K extends keyof FormState>(
            index: number,
            field: K,
            value: FormState[K],
        ) => {
            setFormStates(prev => {
                const updated = [...prev];
                updated[index] = { ...updated[index], [field]: value };
                return updated;
            });
        },
        [],
    );

    const handleDeleteForm = useCallback((index: number) => {
        setFormStates(prev => {
            const updated = [...prev];
            updated.splice(index, 1);
            return updated;
        });
    }, []);

    const handleAddForm = useCallback(() => {
        setFormStates(prev => [
            ...prev,
            {
                id: undefined,
                form_id: undefined,
                logic: undefined,
                not: false,
                operator: undefined,
            },
        ]);
    }, []);

    return (
        <ConfirmCancelModal
            allowConfirm
            titleMessage={MESSAGES.queryBuilder}
            onConfirm={handleConfirm}
            onCancel={() => {
                closeDialog();
            }}
            maxWidth="xl"
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.confirm}
            open={isOpen}
            closeDialog={closeDialog}
            dataTestId="entities-query-builder"
            id="entities-query-builder"
            onClose={() => null}
        >
            <Box position="relative">
                {InfoPopper && (
                    <Box
                        position="absolute"
                        top={theme.spacing(-7)}
                        right={theme.spacing(-3)}
                    >
                        {InfoPopper}
                    </Box>
                )}

                <Paper
                    elevation={0}
                    sx={{
                        backgroundColor: 'grey.100',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'rgba(0, 0, 0, 0.23)',
                        p: 1,
                    }}
                >
                    {formStates.map((formState, index) => (
                        <FormBuilder
                            key={formState.id || `new-form-${index}`}
                            id={formState.id}
                            logic={formState.logic}
                            not={formState.not}
                            operator={formState.operator}
                            onChange={(field, value) =>
                                updateFormState(index, field, value)
                            }
                            deleteForm={() => handleDeleteForm(index)}
                            deleteDisabled={formStates.length === 1}
                        />
                    ))}
                    <Box display="flex" justifyContent="flex-end">
                        <Button
                            onClick={handleAddForm}
                            disabled={
                                formStates.length > 0 &&
                                formStates[formStates.length - 1].id ===
                                    undefined
                            }
                        >
                            + {formatMessage(MESSAGES.addForm)}
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </ConfirmCancelModal>
    );
};
const modalWithButton = makeFullModal(DialogBuilder, TriggerModal);

export { modalWithButton as DialogBuilder };
