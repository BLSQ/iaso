import React, { FunctionComponent, useCallback } from 'react';
import { useFormikContext } from 'formik';
import { VaccineArrivalReport } from './VaccineArrivalReport';
import MESSAGES from '../../messages';
import { MultiFormTab } from '../shared';
import { VAR } from '../../constants';
import { emptyArrivalReport } from '../../hooks/utils';

type Props = { className?: string; items?: any[] };

export const VaccineArrivalReports: FunctionComponent<Props> = ({
    className,
    items = [],
}) => {
    const { values, setFieldValue } = useFormikContext<any>();
    const onClick = useCallback(() => {
        setFieldValue(VAR, [...values[VAR], emptyArrivalReport]);
    }, [setFieldValue, values]);
    return (
        <MultiFormTab
            className={className}
            titleMessage={MESSAGES.varsTitle}
            buttonMessage={MESSAGES.addVar}
            onClick={onClick}
        >
            {items.map((_, index) => {
                return <VaccineArrivalReport index={index} key={index} />;
            })}
        </MultiFormTab>
    );
};
