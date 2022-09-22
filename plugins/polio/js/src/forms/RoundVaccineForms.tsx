import React, { FunctionComponent, useCallback, useEffect } from 'react';
import { useFormikContext } from 'formik';
// @ts-ignore
import { IconButton } from 'bluesquare-components';
import AddIcon from '@material-ui/icons/Add';
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

export const RoundVaccineForms: FunctionComponent<Props> = ({
    round,
    roundIndex,
}) => {
    const {
        setFieldValue,
        // @ts-ignore
        values: { rounds },
    } = useFormikContext();
    const HcDelay = rounds[roundIndex].reporting_delays_hc_to_district;
    const DistrictDelay =
        rounds[roundIndex].reporting_delays_district_to_region;
    const RegionDelay = rounds[roundIndex].reporting_delays_region_to_national;
    const { vaccines = [] } = round ?? {};
    const handleAddVaccine = useCallback(() => {
        const newShipments = [...vaccines, {}];
        setFieldValue(`rounds[${roundIndex}].vaccines`, newShipments);
    }, [roundIndex, setFieldValue, vaccines]);

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
            {vaccines.length < 3 && (
                <Grid
                    container
                    item
                    xs={12}
                    spacing={2}
                    direction="column"
                    justifyContent="flex-end"
                >
                    <IconButton
                        overrideIcon={AddIcon}
                        tooltipMessage={MESSAGES.addVaccine}
                        onClick={handleAddVaccine}
                    />
                </Grid>
            )}
        </>
    );
};
