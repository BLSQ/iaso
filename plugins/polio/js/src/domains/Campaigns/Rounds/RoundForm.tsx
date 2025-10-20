import { Box, Grid } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { Field, useFormikContext } from 'formik';
import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import {
    BooleanInput,
    DateInput,
    NumberInput,
} from '../../../components/Inputs';
import { DependentSingleSelect } from '../../../components/Inputs/DependentSingleSelect';
import MESSAGES from '../../../constants/messages';
import { CampaignFormValues } from '../../../constants/types';
import { RoundDates } from './RoundDates/RoundDates';
import { ToggleRoundModal } from './ToggleRoundModal/ToggleRoundModal';

export const MONTHS = 'MONTHS';
export const YEARS = 'YEARS';
export const AGE_TYPES = [MONTHS, YEARS];

type Props = { roundNumber: number };

const useAgeTypeOptions = () => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return AGE_TYPES.map(ageType => ({
            label: formatMessage(MESSAGES[ageType]),
            value: ageType,
        }));
    }, [formatMessage]);
};

export const RoundForm: FunctionComponent<Props> = ({ roundNumber }) => {
    const { formatMessage } = useSafeIntl();
    const ageTypeOptions = useAgeTypeOptions();
    const {
        values,
        values: { rounds = [] },
        setFieldValue,
        setFieldTouched,
        setValues,
        setTouched,
        touched,
    } = useFormikContext<CampaignFormValues>();
    const roundIndex = rounds.findIndex(r => r.number === roundNumber);
    const isCampaignOnHold = values.on_hold;
    const isEarlierRoundOnHold = Boolean(
        rounds.find(r => r.number < roundNumber && r.on_hold),
    );
    const isCampaignPlanned = values.is_planned;
    const isEarlierRoundPlanned = Boolean(
        rounds.find(r => r.number < roundNumber && r.is_planned),
    );

    // Logic is duplicated for is_planned and on_hold because abstracting it away in a hook
    // caused weird state bugs (probably due to formik's use of the context API)
    const [openPlannedModal, setOpenPlannedModal] = useState<boolean>(false);

    const handlePlannedUpdate = useCallback(
        (_, value: boolean) => {
            if (value) {
                const roundsCopy = [...rounds]; // TODO deep copy
                const touchedCopy = { ...touched };
                if (!touchedCopy.rounds) {
                    touchedCopy.rounds = [];
                }
                // Set relevant field as touched to trigger validation and prevent saving if error
                rounds.forEach((rnd, i) => {
                    if (rnd.number >= roundNumber) {
                        roundsCopy[i] = { ...roundsCopy[i], is_planned: true };
                        //@ts-ignore
                        touchedCopy.rounds[i] = {
                            //@ts-ignore
                            ...touchedCopy?.rounds[i],
                            is_planned: true,
                            target_population: true,
                            percentage_covered_target_population: true,
                        };
                    }
                });
                // Use setValues to safely update multiple values at once
                setValues({ ...values, rounds: roundsCopy });
                setTouched({ ...touchedCopy });
                // If value is false and we're updating the last round, we don't open the modal and just update the round
            } else if (roundIndex === rounds.length - 1) {
                setFieldValue(`rounds[${roundIndex}].is_planned`, false);
                setFieldTouched(`rounds[${roundIndex}].is_planned`, true);
                // if value is false, user needs to decide whether to update the current round or all subsequent rounds so we open the modal
            } else {
                setOpenPlannedModal(true);
            }
        },
        [
            roundNumber,
            setFieldValue,
            setFieldTouched,
            rounds,
            roundIndex,
            setValues,
            setTouched,
            touched,
            values,
        ],
    );
    // Set on_hold to false to the current round and all rounds after it
    const onChangeAllPlannedRounds = useCallback(() => {
        rounds.forEach((rnd, i) => {
            if (rnd.number >= roundNumber) {
                setFieldValue(`rounds[${i}].is_planned`, false);
                setFieldTouched(`rounds[${i}].is_planned`, true);
            }
        });
    }, [roundNumber, setFieldValue, setFieldTouched, rounds]);

    // Set on_hold to false for the current round but not the following rounds
    const onChangeCurrentPlannedRoundOnly = useCallback(() => {
        setFieldValue(`rounds[${roundIndex}].is_planned`, false);
    }, [roundIndex, setFieldValue]);

    const [openOnHoldModal, setOpenOnHoldModal] = useState<boolean>(false);

    const handleOnHoldUpdate = useCallback(
        (_, value: boolean) => {
            if (value) {
                // Set current round and all subsequent rounds on hold
                rounds.forEach((rnd, i) => {
                    if (rnd.number >= roundNumber) {
                        setFieldValue(`rounds[${i}].on_hold`, true);
                        setFieldTouched(`rounds[${i}].on_hold`, true);
                    }
                });
                // If value is false and we're updating the last round, we don't open the modal and just update the round
            } else if (roundIndex === rounds.length - 1) {
                setFieldValue(`rounds[${roundIndex}].on_hold`, false);
                setFieldTouched(`rounds[${roundIndex}].on_hold`, true);
                // if value is false, user needs to decide whether to update the current round or all subsequent rounds so we open the modal
            } else {
                setOpenOnHoldModal(true);
            }
        },
        [roundNumber, setFieldValue, setFieldTouched, rounds, roundIndex],
    );
    // Set on_hold to false to the current round and all rounds after it
    const onChangeAllOnHoldRounds = useCallback(() => {
        rounds.forEach((rnd, i) => {
            if (rnd.number >= roundNumber) {
                setFieldValue(`rounds[${i}].on_hold`, false);
                setFieldTouched(`rounds[${i}].on_hold`, true);
            }
        });
    }, [roundNumber, setFieldValue, setFieldTouched, rounds]);

    // Set on_hold to false for the current round but not the following rounds
    const onChangeCurrentOnHoldRoundOnly = useCallback(() => {
        setFieldValue(`rounds[${roundIndex}].on_hold`, false);
    }, [roundIndex, setFieldValue]);

    return (
        <>
            <ToggleRoundModal
                open={openOnHoldModal}
                onClose={() => null}
                onChangeAllRounds={onChangeAllOnHoldRounds}
                onChangeCurrentRoundOnly={onChangeCurrentOnHoldRoundOnly}
                closeDialog={() => setOpenOnHoldModal(false)}
            />
            <ToggleRoundModal
                open={openPlannedModal}
                onClose={() => null}
                onChangeAllRounds={onChangeAllPlannedRounds}
                onChangeCurrentRoundOnly={onChangeCurrentPlannedRoundOnly}
                closeDialog={() => setOpenPlannedModal(false)}
                id="PlannedRoundModal"
                dataTestId="PlannedRoundModal"
                titleMessage={MESSAGES.removeLaterPlannedRounds}
            />
            <Grid container spacing={2}>
                <Grid xs={12} md={6} item>
                    <RoundDates
                        roundNumber={roundNumber}
                        roundIndex={roundIndex}
                        setParentFieldValue={setFieldValue}
                        parentFieldValue={rounds[roundIndex]}
                    />
                    <Box mt={6}>
                        <Field
                            label={formatMessage(
                                MESSAGES.percentage_covered_target_population,
                            )}
                            name={`rounds[${roundIndex}].percentage_covered_target_population`}
                            component={NumberInput}
                        />
                    </Box>
                    <Box mt={2}>
                        <Field
                            label={formatMessage(MESSAGES.targetPopulation)}
                            name={`rounds[${roundIndex}].target_population`}
                            component={NumberInput}
                        />
                    </Box>
                    <Box mt={2}>
                        <Field
                            label={formatMessage(MESSAGES.onHoldRound)}
                            name={`rounds[${roundIndex}].on_hold`}
                            component={BooleanInput}
                            disabled={isCampaignOnHold || isEarlierRoundOnHold}
                            onChange={handleOnHoldUpdate}
                        />
                        <Field
                            label={formatMessage(MESSAGES.plannedRound)}
                            name={`rounds[${roundIndex}].is_planned`}
                            component={BooleanInput}
                            disabled={
                                isCampaignPlanned || isEarlierRoundPlanned
                            }
                            onChange={handlePlannedUpdate}
                        />
                    </Box>
                </Grid>
                <Grid xs={12} md={6} item>
                    <Box mb={2}>
                        <Field
                            label={formatMessage(MESSAGES.ageUnit)}
                            name={`rounds[${roundIndex}].age_type`}
                            component={DependentSingleSelect}
                            fullWidth
                            options={ageTypeOptions}
                            dependsOn={[
                                `rounds[${roundIndex}].age_min`,
                                `rounds[${roundIndex}].age_max`,
                            ]}
                        />
                    </Box>
                    <Box mb={2}>
                        <Field
                            label={formatMessage(MESSAGES.ageMin)}
                            name={`rounds[${roundIndex}].age_min`}
                            component={NumberInput}
                            fullWidth
                        />
                    </Box>
                    <Box mb={2}>
                        <Field
                            label={formatMessage(MESSAGES.ageMax)}
                            name={`rounds[${roundIndex}].age_max`}
                            component={NumberInput}
                            fullWidth
                        />
                    </Box>
                    <Field
                        label={formatMessage(MESSAGES.mop_up_started_at)}
                        name={`rounds[${roundIndex}].mop_up_started_at`}
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label={formatMessage(MESSAGES.mop_up_ended_at)}
                        name={`rounds[${roundIndex}].mop_up_ended_at`}
                        component={DateInput}
                        fullWidth
                    />
                </Grid>
            </Grid>
        </>
    );
};
