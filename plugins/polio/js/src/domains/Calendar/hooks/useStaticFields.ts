import { useIsLoggedIn } from '../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import { staticFields } from '../campaignCalendar/staticFields';
import { Field } from '../types';

export const useStaticFields = (isPdf = false): Field[] => {
    const isLogged = useIsLoggedIn();
    let fields: Field[] = [...staticFields];
    if (isPdf) {
        fields = fields.filter((f: Field) => !f.exportHide);
    }
    if (!isLogged) {
        fields = fields.filter((f: Field) => f.key !== 'edit');
    }
    return fields;
};
