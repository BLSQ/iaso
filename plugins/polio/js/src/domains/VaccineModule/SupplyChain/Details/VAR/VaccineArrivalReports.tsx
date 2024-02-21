import React, { FunctionComponent, useCallback } from 'react';
import { useFormikContext } from 'formik';
import { VaccineArrivalReport } from './VaccineArrivalReport';
import MESSAGES from '../../messages';
import { MultiFormTab } from '../shared';
import { VAR } from '../../constants';
import { createEmptyArrivalReport } from '../../hooks/utils';

type Props = { className?: string; items?: any[] };

export const VaccineArrivalReports: FunctionComponent<Props> = ({
    className,
    items = [],
}) => {
    const { values, setFieldValue } = useFormikContext<any>();
    const vaccine = values.vrf?.vaccine_type;

    const onClick = useCallback(() => {
        setFieldValue(VAR, [...values[VAR], createEmptyArrivalReport(vaccine)]);
    }, [setFieldValue, values, vaccine]);
    return (
        <MultiFormTab
            className={className}
            titleMessage={MESSAGES.varsTitle}
            buttonMessage={MESSAGES.addVar}
            onClick={onClick}
        >
            {items.map((_, index) => {
                return <VaccineArrivalReport index={index} vaccine={vaccine} key={index} />;
            })}
        </MultiFormTab>
    );
};
