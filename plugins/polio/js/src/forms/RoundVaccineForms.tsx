import React, { FunctionComponent, useCallback } from 'react';
import { useFormikContext } from 'formik';
// @ts-ignore
import { IconButton } from 'bluesquare-components';
import AddIcon from '@material-ui/icons/Add';
import { RoundVaccineForm } from './RoundVaccineForm';
import MESSAGES from '../constants/messages';
import { polioVaccines } from '../constants/virus';

type Props = {
    round: any;
    roundIndex: number;
};

export const RoundVaccineForms: FunctionComponent<Props> = ({
    round,
    roundIndex,
}) => {
    const { setFieldValue } = useFormikContext();
    const { vaccines = [{}] } = round ?? {};
    const handleAddVaccine = useCallback(() => {
        const newShipments = [...vaccines, {}];
        setFieldValue(`rounds[${roundIndex}].vaccines`, newShipments);
    }, [roundIndex, setFieldValue, vaccines]);

    return (
        <>
            {vaccines.length > 0 &&
                vaccines.map((vaccine, index) => {
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
                <IconButton
                    overrideIcon={AddIcon}
                    tooltipMessage={MESSAGES.addVaccine}
                    onClick={handleAddVaccine}
                />
            )}
        </>
    );
};
