import React, { FunctionComponent, useCallback } from 'react';
import { useFormikContext } from 'formik';
import { PreAlert } from './PreAlert';
import MESSAGES from '../../messages';
import { MultiFormTab } from '../shared';
import { PREALERT } from '../../constants';

type Props = { className?: string; items?: any[] };

const emptyPreAlert = {
    date_pre_alert_reception: undefined,
    po_number: undefined,
    estimated_arrival_time: undefined,
    expiration_date: undefined,
    doses_shipped: undefined,
    doses_per_vial: undefined,
    lot_numbers: undefined,
    id: undefined,
};

export const PreAlerts: FunctionComponent<Props> = ({
    className,
    items = [],
}) => {
    // TODO manage errors
    const { values, setFieldValue } = useFormikContext<any>();
    const onClick = useCallback(() => {
        setFieldValue(PREALERT, [...values[PREALERT], emptyPreAlert]);
    }, [setFieldValue, values]);
    return (
        <MultiFormTab
            className={className}
            titleMessage={MESSAGES.pre_alerts}
            buttonMessage={MESSAGES.addPreAlert}
            onClick={onClick}
        >
            {items.map((_, index) => {
                return <PreAlert index={index} key={index} />;
            })}
        </MultiFormTab>
    );
};
