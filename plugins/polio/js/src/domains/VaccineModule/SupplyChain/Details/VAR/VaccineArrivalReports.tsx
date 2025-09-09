import React, { FunctionComponent, useCallback } from 'react';
import { useFormikContext } from 'formik';
import { VaccineArrivalReport } from './VaccineArrivalReport';
import MESSAGES from '../../messages';
import { MultiFormTab } from '../shared';
import { VAR } from '../../constants';
import { createEmptyArrivalReport } from '../../hooks/utils';
import { useCurrentUser } from '../../../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import {
    POLIO_SUPPLY_CHAIN_READ,
    POLIO_SUPPLY_CHAIN_WRITE,
} from '../../../../../../../../../hat/assets/js/apps/Iaso/utils/permissions';
import { userHasOneOfPermissions } from '../../../../../../../../../hat/assets/js/apps/Iaso/domains/users/utils';

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

    const currentUser = useCurrentUser();
    const theMessage = userHasOneOfPermissions(
        [POLIO_SUPPLY_CHAIN_READ, POLIO_SUPPLY_CHAIN_WRITE],
        currentUser,
    )
        ? MESSAGES.addVar
        : null;

    return (
        <MultiFormTab
            className={className}
            titleMessage={MESSAGES.varsTitle}
            buttonMessage={theMessage}
            onClick={onClick}
        >
            {items.map((_, index) => {
                return (
                    <VaccineArrivalReport
                        index={index}
                        vaccine={vaccine}
                        key={index}
                    />
                );
            })}
        </MultiFormTab>
    );
};
