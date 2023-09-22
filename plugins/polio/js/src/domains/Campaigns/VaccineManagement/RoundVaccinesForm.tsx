import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useFormikContext } from 'formik';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { Box, Button, Grid } from '@material-ui/core';
import { RoundVaccineForm } from './RoundVaccineForm';
import MESSAGES from '../../../constants/messages';
import { polioVaccines } from '../../../constants/virus';

type Props = {
    round: any;
    roundIndex: number;
};

const DEFAULT_DELAY_HC = 3;
const DEFAULT_DELAY_DISTRICT = 5;
const DEFAULT_DELAY_REGION = 7;

const DEFAULT_WASTAGE_RATIOS = {
    mOPV2: '1.15',
    nOPV2: '1.33',
    bOPV: '1.18',
};

const DEFAULT_DOSES_PER_VIAL = 50;

export const RoundVaccinesForm: FunctionComponent<Props> = ({
    round,
    roundIndex,
}) => {
    const { formatMessage } = useSafeIntl();
    const {
        setFieldValue,
        // @ts-ignore
        values: { rounds },
        touched,
    } = useFormikContext();
    const [enableRemoveButton, setEnableRemoveButton] =
        useState<boolean>(false);

    const HcDelay = rounds[roundIndex]?.reporting_delays_hc_to_district;
    const DistrictDelay =
        rounds[roundIndex]?.reporting_delays_district_to_region;
    const RegionDelay = rounds[roundIndex]?.reporting_delays_region_to_national;

    const { vaccines = [] } = round ?? {};
    // use Ref to tack changes in selected vaccine
    const vaccinesRef = useRef<any>();

    const lastIndex = vaccines.length >= 1 && vaccines.length - 1;

    const handleAddVaccine = useCallback(() => {
        const newVaccines = [...vaccines, {}];
        setFieldValue(`rounds[${roundIndex}].vaccines`, newVaccines);
    }, [roundIndex, setFieldValue, vaccines]);

    const handleRemoveLastVaccine = useCallback(() => {
        const newVaccines = [...vaccines];
        newVaccines.pop();
        setFieldValue(`rounds[${roundIndex}].vaccines`, newVaccines);
    }, [roundIndex, setFieldValue, vaccines]);

    const vaccineOptions = useMemo(() => {
        return polioVaccines.filter(
            pv => !vaccines.find(vaccine => vaccine.name === pv.value),
        );
    }, [vaccines]);

    // determine whether to show delete button or not
    useEffect(() => {
        if (Number.isInteger(lastIndex)) {
            if (lastIndex >= 0) {
                setEnableRemoveButton(true);
            } else {
                setEnableRemoveButton(false);
            }
        } else {
            setEnableRemoveButton(false);
        }
    }, [lastIndex, vaccines]);

    // Fill in ReportingDelays table with default values when selecting the first vaccine
    useEffect(() => {
        if (vaccines.length === 1) {
            if (
                !HcDelay &&
                // @ts-ignore
                !(touched?.rounds ?? [])[roundIndex]
                    ?.reporting_delays_hc_to_district
            ) {
                setFieldValue(
                    `rounds[${roundIndex}].reporting_delays_hc_to_district`,
                    DEFAULT_DELAY_HC,
                );
            }
            if (
                !DistrictDelay &&
                // @ts-ignore
                !(touched?.rounds ?? [])[roundIndex]
                    ?.reporting_delays_district_to_region
            ) {
                setFieldValue(
                    `rounds[${roundIndex}].reporting_delays_district_to_region`,
                    DEFAULT_DELAY_DISTRICT,
                );
            }
            if (
                !RegionDelay &&
                // @ts-ignore
                !(touched?.rounds ?? [])[roundIndex]
                    ?.reporting_delays_region_to_national
            ) {
                setFieldValue(
                    `rounds[${roundIndex}].reporting_delays_region_to_national`,
                    DEFAULT_DELAY_REGION,
                );
            }
        }
    }, [
        DistrictDelay,
        HcDelay,
        RegionDelay,
        roundIndex,
        setFieldValue,
        // @ts-ignore
        touched?.rounds,
        vaccines.length,
    ]);

    // Fill in wastage ratio with default value for vaccine when adding vaccine
    useEffect(() => {
        vaccines.forEach((vaccine, index) => {
            if (
                vaccinesRef.current &&
                vaccine?.name !== vaccinesRef?.current?.[index]?.name
            ) {
                setFieldValue(
                    `rounds[${roundIndex}].vaccines[${index}].wastage_ratio_forecast`,
                    DEFAULT_WASTAGE_RATIOS[vaccine.name],
                );
            }
            if (
                vaccinesRef.current &&
                vaccine?.name !== vaccinesRef?.current?.[index]?.name
            ) {
                setFieldValue(
                    `rounds[${roundIndex}].vaccines[${index}].doses_per_vial`,
                    DEFAULT_DOSES_PER_VIAL,
                );
            }
        });
        vaccinesRef.current = vaccines;
    }, [
        roundIndex,
        rounds,
        setFieldValue,
        // @ts-ignore
        touched.rounds,
        vaccines,
        vaccines.length,
    ]);

    // Add second vaccine row when adding a row over an empty first row
    // Making this a separate effect to avoid disrupting the autofill of ReportDelays
    useEffect(() => {
        const currentVaccine = vaccines[0];
        if (
            vaccines.length === 1 &&
            !currentVaccine.name &&
            !currentVaccine.wastage_ratio_forecast &&
            !currentVaccine.doses_per_vial &&
            !HcDelay && // checking if ReportDelay has been autofilled to avoid recreating deleted vaccine row
            !DistrictDelay &&
            !RegionDelay
        ) {
            setFieldValue(`rounds[${roundIndex}].vaccines`, [...vaccines, {}]);
        }
    }, [
        DistrictDelay,
        HcDelay,
        RegionDelay,
        roundIndex,
        setFieldValue,
        vaccines,
    ]);

    return (
        <>
            {vaccines.length > 1 &&
                vaccines.map((_vaccine, index) => {
                    return (
                        <RoundVaccineForm
                            // eslint-disable-next-line react/no-array-index-key
                            key={`vaccine${index}`}
                            vaccineIndex={index}
                            roundIndex={roundIndex}
                            vaccineOptions={vaccineOptions}
                        />
                    );
                })}
            {/* if the condition is on length === 0 the UI will flicker and the field lose focus because of re-render */}
            {vaccines.length <= 1 && (
                <RoundVaccineForm
                    vaccineIndex={0}
                    roundIndex={roundIndex}
                    vaccineOptions={vaccineOptions}
                />
            )}

            <Grid
                container
                item
                xs={12}
                spacing={2}
                direction="column"
                justifyContent="flex-end"
            >
                <Box mt={2} mb={2}>
                    <Grid
                        container
                        direction="row"
                        justifyContent="flex-end"
                        spacing={2}
                    >
                        <Grid item>
                            <Button
                                onClick={handleAddVaccine}
                                disabled={!(vaccines.length < 3)}
                                variant="outlined"
                            >
                                {formatMessage(MESSAGES.addVaccine)}
                            </Button>
                        </Grid>{' '}
                        <Grid item>
                            <Button
                                onClick={handleRemoveLastVaccine}
                                disabled={!enableRemoveButton}
                                variant="outlined"
                            >
                                {formatMessage(MESSAGES.removeLastVaccine)}
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Grid>
        </>
    );
};
