import React, { FunctionComponent, useCallback } from 'react';
import { useFormikContext } from 'formik';
import { PreAlert } from './PreAlert';
import MESSAGES from '../../messages';
import {
    MultiFormTab,
    useDosesPerVialDropDownForVaccine,
    useEmptyPreAlert,
} from '../shared';
import { PREALERT } from '../../constants';
import { useCurrentUser } from '../../../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';

import { userHasOneOfPermissions } from '../../../../../../../../../hat/assets/js/apps/Iaso/domains/users/utils';

import {
    POLIO_SUPPLY_CHAIN_READ,
    POLIO_SUPPLY_CHAIN_WRITE,
} from '../../../../../../../../../hat/assets/js/apps/Iaso/utils/permissions';

type Props = { className?: string; items?: any[] };

export const PreAlerts: FunctionComponent<Props> = ({
    className,
    items = [],
}) => {
    // TODO manage errors
    const { values, setFieldValue } = useFormikContext<any>();
    const vaccine = values.vrf?.vaccine_type;
    const dosesPerVaccineOptions = useDosesPerVialDropDownForVaccine(vaccine);
    const emptyPreAlert = useEmptyPreAlert(dosesPerVaccineOptions);
    const onClick = useCallback(() => {
        setFieldValue(PREALERT, [...values[PREALERT], emptyPreAlert]);
    }, [setFieldValue, values, vaccine, emptyPreAlert]);

    const currentUser = useCurrentUser();

    const theMessage = userHasOneOfPermissions(
        [POLIO_SUPPLY_CHAIN_READ, POLIO_SUPPLY_CHAIN_WRITE],
        currentUser,
    )
        ? MESSAGES.addPreAlert
        : null;

    return (
        <MultiFormTab
            className={className}
            titleMessage={MESSAGES.pre_alerts}
            buttonMessage={theMessage}
            onClick={onClick}
        >
            {items.map((_, index) => {
                return (
                    <PreAlert
                        index={index}
                        key={index}
                        dosesForVaccineOptions={dosesPerVaccineOptions}
                    />
                );
            })}
        </MultiFormTab>
    );
};
