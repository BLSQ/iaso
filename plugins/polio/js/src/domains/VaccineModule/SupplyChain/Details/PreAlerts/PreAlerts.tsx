import React, { FunctionComponent, useCallback } from 'react';
import { useFormikContext } from 'formik';
import { PreAlert } from './PreAlert';
import MESSAGES from '../../messages';
import { MultiFormTab } from '../shared';
import { PREALERT } from '../../constants';
import { createEmptyPreAlert } from '../../hooks/utils';

type Props = { className?: string; items?: any[] };

export const PreAlerts: FunctionComponent<Props> = ({
    className,
    items = [],
}) => {
    // TODO manage errors
    const { values, setFieldValue } = useFormikContext<any>();
    const vaccine = values.vrf?.vaccine_type;

    const onClick = useCallback(() => {
        setFieldValue(PREALERT, [...values[PREALERT], createEmptyPreAlert(vaccine)]);
    }, [setFieldValue, values, vaccine]);


    return (
        <MultiFormTab
            className={className}
            titleMessage={MESSAGES.pre_alerts}
            buttonMessage={MESSAGES.addPreAlert}
            onClick={onClick}
        >
            {items.map((_, index) => {
                return <PreAlert index={index} vaccine={vaccine} key={index} />;
            })}
        </MultiFormTab>
    );
};
