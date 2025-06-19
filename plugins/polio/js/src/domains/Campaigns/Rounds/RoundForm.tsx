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
import { ToggleRoundOnHoldModal } from './ToggleRoundOnHoldModal.tsx/ToggleRoundOnHoldModal';

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
        setValues,
        touched,
        setFieldTouched,
        initialValues,
        setFormikState,
    } = useFormikContext<CampaignFormValues>();
    const isCampaignOnHold = values.on_hold;
    const roundIndex = rounds.findIndex(r => r.number === roundNumber);
    const [openOnHoldModal, setOpenOnHoldModal] = useState<boolean>(false);
    const handleOnHoldUpdate = useCallback(
        (_, value: boolean) => {
            if (value) {
                rounds.forEach((rnd, i) => {
                    if (rnd.number >= roundNumber) {
                        setFieldValue(`rounds[${i}].on_hold`, true);
                        setFieldTouched(`rounds[${i}].on_hold`, true);
                    }
                });
            } else {
                setOpenOnHoldModal(true);
            }
        },
        [roundNumber, setFieldValue, setFieldTouched, rounds],
    );

    const onChangeAllRounds = useCallback(() => {
        rounds.forEach((rnd, i) => {
            if (rnd.number >= roundNumber) {
                setFieldValue(`rounds[${i}].on_hold`, false);
                setFieldTouched(`rounds[${i}].on_hold`, true);
            }
        });
    }, [roundNumber, setFieldValue, setFieldTouched, rounds]);

    const onChangeCurrentRoundOnly = useCallback(() => {
        setFieldValue(`rounds[${roundIndex}].on_hold`, false);
    }, [roundIndex, setFieldValue]);

    return (
        <>
            <ToggleRoundOnHoldModal
                open={openOnHoldModal}
                onClose={() => null}
                onChangeAllRounds={onChangeAllRounds}
                onChangeCurrentRoundOnly={onChangeCurrentRoundOnly}
                closeDialog={() => setOpenOnHoldModal(false)}
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
                            disabled={isCampaignOnHold}
                            onChange={handleOnHoldUpdate}
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
