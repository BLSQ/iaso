import { useSelector } from 'react-redux';
import { staticFields } from '../campaignCalendar/staticFields';

const useStaticFields = isPdf => {
    const isLogged = useSelector(state => Boolean(state.users.current));
    let fields = [...staticFields];
    if (isPdf) {
        fields = fields.filter(f => !f.exportHide);
    }
    if (!isLogged) {
        fields = fields.filter(f => f.key !== 'edit');
    }
    return fields;
};

export { useStaticFields };
