import moment from 'moment';
import { array, date, mixed, number, object, string } from 'yup';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from './messages';

// parse DD-MM-YYYY string to Date object
const parseStringTodate = (_yupValue, pickerValue) => {
    const result = moment(pickerValue, 'DD-MM-YYYY').toDate();
    return result;
};

export const usePlanningValidation = () => {
    const { formatMessage } = useSafeIntl();
    const errorMessage = formatMessage(MESSAGES.requiredField);
    // Tried the typescript integration, but Type casting was crap
    const schema = object().shape({
        name: string().nullable().required(errorMessage),
        startDate: date().transform(parseStringTodate),
        endDate: date().transform(parseStringTodate),
        forms: array(number()).nullable().required(errorMessage), // this may be causing bugs with multi select, or have to be reconverted into array before being sent to the api
        selectedOrgUnits: array()
            .of(number())
            .nullable()
            .required(errorMessage),
        selectedTeam: number().nullable().required(errorMessage),
        publishingStatus: mixed()
            .oneOf(['draft', 'published'])
            .required(errorMessage),
    });
    return schema;
};
