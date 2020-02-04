
const patientInfosMessages = formatMessage => ({
    last_name: {
        defaultMessage: 'Name',
        id: 'main.label.name',
        type: 'text',
        isRequired: true,
    },
    post_name: {
        defaultMessage: 'Post name',
        id: 'main.label.postName',
        type: 'text',
    },
    first_name: {
        defaultMessage: 'First name',
        id: 'main.label.firstName',
        type: 'text',
    },
    mothers_surname: {
        defaultMessage: 'Mother surname',
        id: 'main.label.mothers_surname',
        type: 'text',
        isRequired: true,
    },
    sex: {
        defaultMessage: 'Sex',
        id: 'main.label.sex',
        type: 'select',
        isRequired: true,
        options: [
            {
                label: formatMessage ? formatMessage({
                    defaultMessage: 'Male',
                    id: 'main.label.male',
                }) : 'Homme',
                value: 'male',
            },
            {
                label: formatMessage ? formatMessage({
                    defaultMessage: 'Female',
                    id: 'main.label.female',
                }) : 'Homme',
                value: 'female',
            },
        ],
    },
    phone_number: {
        defaultMessage: 'Phone',
        id: 'main.label.phone',
        type: 'text',
    },
    death_date: {
        defaultMessage: 'Death date',
        id: 'main.label.death_date',
        editable: false,
        type: 'date',
    },
    year_of_birth: {
        defaultMessage: 'Year of birth',
        id: 'main.label.year_of_birth',
        type: 'int',
        min: 1900,
        isRequired: true,
    },
    origin_country: {
        defaultMessage: 'Country of origin',
        id: 'main.label.countryOrigin',
        type: 'text',
    },
    province: {
        defaultMessage: 'Province of origin',
        id: 'main.label.provinceOrigin',
    },
    ZS: {
        defaultMessage: 'Zone of origin',
        id: 'main.label.ZSOrigin',
    },
    AS: {
        defaultMessage: 'Aire of origin',
        id: 'main.label.ASOrigin',
    },
    village: {
        defaultMessage: 'Village of origin',
        id: 'main.label.villageOrigin',
    },
});

export default patientInfosMessages;
