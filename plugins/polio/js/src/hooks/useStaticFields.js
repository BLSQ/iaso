import { useSelector } from 'react-redux';
import { staticFields } from '../components/campaignCalendar/staticFields';

const useStaticFields = () => {
    const isLogged = useSelector(state => Boolean(state.users.current));
    let fields = [...staticFields];
    if (!isLogged) {
        fields = fields.filter(f => f.key !== 'edit');
    }
    return fields;
};

export { useStaticFields };
