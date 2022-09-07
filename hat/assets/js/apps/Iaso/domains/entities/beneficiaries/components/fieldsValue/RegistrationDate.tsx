import React, { FunctionComponent } from 'react';
import { Beneficiary } from '../../types/beneficiary';
import { DateCell } from '../../../../../components/Cells/DateTimeCell';

type Props = {
    beneficiary?: Beneficiary;
};

export const RegistrationDate: FunctionComponent<Props> = ({ beneficiary }) => {
    const cellInfo = {
        value: beneficiary?.attributes?.file_content.end,
    };
    if (cellInfo) {
        return <DateCell value={cellInfo} />;
    }
    return <>--</>;
};
