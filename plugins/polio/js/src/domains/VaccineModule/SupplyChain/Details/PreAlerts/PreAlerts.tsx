import React, { FunctionComponent, useCallback } from 'react';
import { useFormikContext } from 'formik';
import { PreAlert } from './PreAlert';
import MESSAGES from '../../messages';
import { MultiFormTab } from '../shared';
import { PREALERT } from '../../constants';
import { emptyPreAlert } from '../../hooks/utils';

type Props = { className?: string; items?: any[] };

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
