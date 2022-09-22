import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useState,
} from 'react';
import { useFormikContext } from 'formik';
// @ts-ignore
import { IconButton } from 'bluesquare-components';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Clear';
import { Grid } from '@material-ui/core';
import { RoundVaccineForm } from './RoundVaccineForm';
import MESSAGES from '../constants/messages';
import { polioVaccines } from '../constants/virus';

type Props = {
    round: any;
    roundIndex: number;
};

const DEFAULT_DELAY_HC = 3;
const DEFAULT_DELAY_DISTRICT = 5;
const DEFAULT_DELAY_REGION = 7;

const DEFAULT_WASTAGE_RATIOS = {
    mOPV2: 1.15,
    nOPV2: 1.33,
    bOPV2: 1.18,
};

export const RoundVaccinesForm: FunctionComponent<Props> = ({
    round,
    roundIndex,
}) => {
    const {
        setFieldValue,
        // @ts-ignore
        values: { rounds },
    } = useFormikContext();
    const [enableRemoveButton, setEnableRemoveButton] =
        useState<boolean>(false);
    const HcDelay = rounds[roundIndex].reporting_delays_hc_to_district;
    const DistrictDelay =
        rounds[roundIndex].reporting_delays_district_to_region;
    const RegionDelay = rounds[roundIndex].reporting_delays_region_to_national;
    const { vaccines = [] } = round ?? {};

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

    // determine whether to show delete button or not
    useEffect(() => {
        if (Number.isInteger(lastIndex)) {
            const lastVaccine = vaccines[lastIndex as number];
            if (
                lastIndex > 0 &&
                !lastVaccine.name &&
                !lastVaccine.wastage_ratio_forecast &&
                !lastVaccine.doses_per_vial
            ) {
                setEnableRemoveButton(true);
            } else {
                setEnableRemoveButton(false);
            }
        }
    }, [lastIndex, vaccines]);

    // Fill in ReportingDelays table with default values when selecting the first vaccine
    useEffect(() => {
        if (vaccines.length === 1) {
            if (!HcDelay) {
                setFieldValue(
                    `rounds[${roundIndex}].reporting_delays_hc_to_district`,
                    DEFAULT_DELAY_HC,
                );
            }
            if (!DistrictDelay) {
                setFieldValue(
                    `rounds[${roundIndex}].reporting_delays_district_to_region`,
                    DEFAULT_DELAY_DISTRICT,
                );
            }
            if (!RegionDelay) {
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
        vaccines.length,
    ]);

    // Fill in wastage ratio with default value for vaccine when adding vaccine
    useEffect(() => {
        vaccines.forEach((vaccine, index) => {
            const wastageRatio =
                rounds[roundIndex].vaccines[index].wastage_ratio_forecast;
            if (!wastageRatio) {
                setFieldValue(
                    `rounds[${roundIndex}].vaccines[${index}].wastage_ratio_forecast`,
                    DEFAULT_WASTAGE_RATIOS[vaccine.name],
                );
            }
        });
    }, [roundIndex, rounds, setFieldValue, vaccines, vaccines.length]);

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
            {vaccines.length > 0 &&
                vaccines.map((_vaccine, index) => {
                    return (
                        <RoundVaccineForm
                            // eslint-disable-next-line react/no-array-index-key
                            key={`vaccine${index}`}
                            vaccineIndex={index}
                            roundIndex={roundIndex}
                            vaccineOptions={polioVaccines}
                        />
                    );
                })}
            {vaccines.length === 0 && (
                <RoundVaccineForm
                    // eslint-disable-next-line react/no-array-index-key
                    key={`vaccine${0}`}
                    vaccineIndex={0}
                    roundIndex={roundIndex}
                    vaccineOptions={polioVaccines}
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
                <Grid container direction="row">
                    <IconButton
                        overrideIcon={AddIcon}
                        tooltipMessage={MESSAGES.addVaccine}
                        onClick={handleAddVaccine}
                        disabled={!(vaccines.length < 3)}
                    />

                    <IconButton
                        overrideIcon={RemoveIcon}
                        tooltipMessage={MESSAGES.removeLastVaccine}
                        onClick={handleRemoveLastVaccine}
                        disabled={!enableRemoveButton}
                    />
                </Grid>
            </Grid>
        </>
    );
};
