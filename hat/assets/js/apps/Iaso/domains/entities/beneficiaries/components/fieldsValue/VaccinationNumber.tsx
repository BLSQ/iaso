/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
import { Beneficiary } from '../../types/beneficiary';

type Props = {
    beneficiary?: Beneficiary;
};

export const VaccinationNumber: FunctionComponent<Props> = ({
    beneficiary,
}) => {
    const { vaccination_number } = beneficiary?.attributes?.file_content ?? {};
    return <>{vaccination_number ?? '--'}</>;
};
