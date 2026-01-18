import React, { FunctionComponent, useCallback } from 'react';
import { useFormikContext } from 'formik';
import { VaccineArrivalReport } from './VaccineArrivalReport';
import MESSAGES from '../../messages';
import {
    MultiFormTab,
    useDosesPerVialDropDownForVaccine,
    useEmptyArrivalReport,
} from '../shared';
import { VAR } from '../../constants';
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
    const dosesPerVaccineOptions = useDosesPerVialDropDownForVaccine(vaccine);
    const emptyArrivalReport = useEmptyArrivalReport(dosesPerVaccineOptions);
    const onClick = useCallback(() => {
        setFieldValue(VAR, [...values[VAR], emptyArrivalReport]);
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
                        key={index}
                        dosesForVaccineOptions={dosesPerVaccineOptions}
                    />
                );
            })}
        </MultiFormTab>
    );
};
