import { useMemo } from 'react';
import moment from 'moment';
import { array, date, mixed, number, object, string } from 'yup';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from './messages';
import { getLocaleDateFormat } from '../../utils/dates';

// parse DD-MM-YYYY string to Date object
const parseStringTodate = (_yupValue, pickerValue) => {
    const result = moment(pickerValue, getLocaleDateFormat('L')).toDate();
    return result;
};

export const usePlanningValidation = () => {
    const { formatMessage } = useSafeIntl();
    const errorMessage = formatMessage(MESSAGES.requiredField);
    // Tried the typescript integration, but Type casting was crap
    const schema = useMemo(
        () =>
            object().shape({
                name: string().nullable().required(errorMessage),
                startDate: date().transform(parseStringTodate),
                endDate: date().transform(parseStringTodate),
                description: string().nullable(),
                project: number().nullable().required(errorMessage),
                // Specifying array().of(number()) will cause a bug where the error won't show until you ût another field in error
                forms: array().min(1, errorMessage),
                selectedOrgUnit: number().nullable().required(errorMessage),
                selectedTeam: number().nullable().required(errorMessage),
                publishingStatus: mixed()
                    .oneOf(['draft', 'published'])
                    .required(errorMessage),
            }),
        [errorMessage],
    );
    return schema;
};
