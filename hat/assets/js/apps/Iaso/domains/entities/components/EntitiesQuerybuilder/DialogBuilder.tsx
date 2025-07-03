import React, {
    FunctionComponent,
    ReactNode,
    useMemo,
    Dispatch,
    SetStateAction,
} from 'react';
import { Box, useTheme, Button, Paper, ButtonGroup } from '@mui/material';
import { JsonLogicTree } from '@react-awesome-query-builder/mui';

import {
    useSafeIntl,
    ConfirmCancelModal,
    makeFullModal,
    QueryBuilderFields,
} from 'bluesquare-components';

import { Form } from 'Iaso/domains/forms/types/forms';
import MESSAGES from '../../messages';
import { FormBuilder } from './FormBuilder';
import { TriggerModal } from './TriggerModal';
import {
    LogicOperator,
    operatorButtons,
    FormState,
    getButtonStyles,
    getAllFields,
} from './utils';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    InfoPopper?: ReactNode;
    onChange: (logic: JsonLogicTree) => void;
    setAllFields: Dispatch<SetStateAction<QueryBuilderFields>>;
    not: boolean;
    activeOperator: LogicOperator | null;
    formStates: FormState[];
    handleOperatorChange: (operator: LogicOperator) => void;
    handleChangeForm: (formId: string, index: number) => void;
    handleNotChange: () => void;
    updateFormState: <K extends keyof FormState>(
        index: number,
        field: K,
        value: FormState[K],
    ) => void;
    handleDeleteForm: (index: number) => void;
    handleAddForm: () => void;
    formsList: Form[];
    isFetchingForms: boolean;
};

const getStyles = () => ({
    buttonGroup: {
        marginBottom: '20px',
    },
});

const DialogBuilder: FunctionComponent<Props> = ({
    closeDialog,
    isOpen,
    InfoPopper,
    onChange,
    setAllFields,
    not,
    activeOperator,
    formStates,
    handleOperatorChange,
    handleNotChange,
    updateFormState,
    handleDeleteForm,
    handleAddForm,
    formsList,
    isFetchingForms,
    handleChangeForm,
}) => {
    const { formatMessage } = useSafeIntl();
    const theme = useTheme();
    const styles = useMemo(() => getStyles(), []);

    const handleConfirm = () => {
        const formLogics = formStates
            .filter(fs => fs.form.form_id)
            .map(fs => ({
                [fs.operator || 'some']: [
                    { var: fs.form.form_id },
                    fs.logic ?? {},
                ],
            }));

        let combinedLogic: any = {};
        if (formLogics.length === 1) {
            [combinedLogic] = formLogics;
        } else if (formLogics.length > 1) {
            combinedLogic = {
                [activeOperator || 'and']: formLogics,
            };
        }

        let finalLogic = combinedLogic;
        if (not && Object.keys(combinedLogic).length > 0) {
            finalLogic = { '!': combinedLogic };
        }
        setAllFields(getAllFields(formStates));
        onChange(finalLogic);
        closeDialog();
    };

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
                    <ButtonGroup sx={styles.buttonGroup}>
                        <Button
                            variant="outlined"
                            size="small"
                            sx={getButtonStyles(not, 'not')(theme)}
                            onClick={handleNotChange}
                        >
                            NOT
                        </Button>
                        {operatorButtons.map(
                            ({ key, label, alwaysVisible }) => {
                                const isVisible =
                                    alwaysVisible || formStates.length > 1;
                                const isActive = activeOperator === key;

                                if (!isVisible) return null;

                                return (
                                    <Button
                                        key={key}
                                        variant="outlined"
                                        size="small"
                                        sx={getButtonStyles(
                                            isActive,
                                            key as LogicOperator,
                                        )(theme)}
                                        onClick={() =>
                                            handleOperatorChange(
                                                key as LogicOperator,
                                            )
                                        }
                                    >
                                        {label}
                                    </Button>
                                );
                            },
                        )}
                    </ButtonGroup>
                    {formStates.map((formState, index) => (
                        <FormBuilder
                            key={formState.form.form_id || `new-form-${index}`}
                            id={formState.form.id}
                            handleChangeForm={(_, newFormId) =>
                                handleChangeForm(newFormId, index)
                            }
                            form_id={formState.form.form_id}
                            stateFields={formState.fields}
                            logic={formState.logic}
                            operator={formState.operator}
                            onChange={(field, value) =>
                                updateFormState(index, field, value)
                            }
                            deleteForm={() => handleDeleteForm(index)}
                            deleteDisabled={formStates.length === 1}
                            formsList={formsList}
                            isFetchingForms={isFetchingForms}
                        />
                    ))}
                    <Box display="flex" justifyContent="flex-end">
                        <Button
                            onClick={handleAddForm}
                            disabled={
                                formStates.length > 0 &&
                                formStates[formStates.length - 1].form
                                    .form_id === undefined
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
