import React, {
    FunctionComponent,
    ReactNode,
    useCallback,
    useMemo,
    useState,
} from 'react';
import { Box, useTheme, Button, Paper, ButtonGroup } from '@mui/material';
import { JsonLogicTree } from '@react-awesome-query-builder/mui';

import {
    useSafeIntl,
    ConfirmCancelModal,
    makeFullModal,
} from 'bluesquare-components';

import MESSAGES from '../../messages';
import { FormBuilder, FormState } from './FormBuilder';
import { TriggerModal } from './TriggerModal';

const borderColor = 'rgba(0, 0, 0, 0.23)';

type LogicOperator = 'and' | 'or';
type NotState = boolean;

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    InfoPopper?: ReactNode;
    onChange: (logic: JsonLogicTree) => void;
    initialLogic: string;
};

const getButtonStyles =
    (isActive: boolean, type: 'not' | 'and' | 'or') => (theme: any) => {
        const base = {
            position: 'relative' as const,
            top: theme.spacing(1),
            p: theme.spacing(0.5, 1),
            minWidth: 0,
        };
        if (type === 'not') {
            return {
                ...base,
                color: isActive ? 'white' : 'inherit',
                borderColor: isActive ? 'secondary.main' : borderColor,
                backgroundColor: isActive
                    ? theme.palette.error.main
                    : 'rgb(224, 224, 224)',
                '&:hover': {
                    borderColor: isActive ? 'secondary.main' : borderColor,
                    color: isActive ? theme.palette.error.main : 'inherit',
                },
            };
        }
        // AND/OR
        return {
            ...base,
            color: isActive ? theme.palette.primary.contrastText : 'inherit',
            borderColor: isActive ? 'primary.main' : borderColor,
            backgroundColor: isActive
                ? theme.palette.primary.main
                : 'rgb(224, 224, 224)',
            '&:hover': {
                borderColor: isActive ? 'primary.main' : borderColor,
                color: isActive ? theme.palette.primary.main : 'inherit',
            },
        };
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
    initialLogic,
}) => {
    const { formatMessage } = useSafeIntl();
    // eslint-disable-next-line no-console
    console.log('initialLogic', initialLogic);
    const [not, setNot] = useState<NotState>(false);
    const [activeOperator, setActiveOperator] = useState<LogicOperator | null>(
        'and',
    );
    const [formStates, setFormStates] = useState<FormState[]>([
        {
            form_id: undefined,
            logic: undefined,
            operator: undefined,
        },
    ]);
    const theme = useTheme();

    const handleOperatorChange = useCallback((operator: LogicOperator) => {
        setActiveOperator(prev => {
            // Toggle if same operator, otherwise set new one
            if (prev === operator) {
                return null;
            }
            return operator;
        });
    }, []);

    const handleNotChange = useCallback(() => {
        setNot(prev => !prev);
    }, []);

    const handleConfirm = () => {
        const formLogics = formStates
            .filter(fs => fs.form_id)
            .map(fs => ({
                [fs.operator || 'some']: [{ var: fs.form_id }, fs.logic ?? {}],
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

        onChange(finalLogic);
        closeDialog();
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

    const styles = useMemo(() => getStyles(), []);

    const operatorButtons = [
        {
            key: 'and' as LogicOperator,
            label: 'AND',
            alwaysVisible: false,
        },
        {
            key: 'or' as LogicOperator,
            label: 'OR',
            alwaysVisible: false,
        },
    ];

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
                                            key,
                                        )(theme)}
                                        onClick={() =>
                                            handleOperatorChange(key)
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
                            key={formState.form_id || `new-form-${index}`}
                            form_id={formState.form_id}
                            logic={formState.logic}
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
                                formStates[formStates.length - 1].form_id ===
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
