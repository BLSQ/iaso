
const patientInfosMessages = formatMessage => ({
    last_name: {
        defaultMessage: 'Nom',
        id: 'patientsinfos.last_name',
        type: 'text',
    },
    post_name: {
        defaultMessage: 'Postnom',
        id: 'patientsinfos.post_name',
        type: 'text',
    },
    first_name: {
        defaultMessage: 'Prénom',
        id: 'patientsinfos.first_name',
        type: 'text',
    },
    mothers_surname: {
        defaultMessage: 'Nom de la mère',
        id: 'patientsinfos.mothers_surname',
        type: 'text',
    },
    sex: {
        defaultMessage: 'Sexe',
        id: 'patientsinfos.sex',
        type: 'select',
        options: [
            {
                label: formatMessage ? formatMessage({
                    defaultMessage: 'Homme',
                    id: 'main.label.male',
                }) : 'Homme',
                value: 'male',
            },
            {
                label: formatMessage ? formatMessage({
                    defaultMessage: 'Femme',
                    id: 'main.label.female',
                }) : 'Homme',
                value: 'female',
            },
        ],
    },
    death_date: {
        defaultMessage: 'Décès',
        id: 'patientsinfos.death_date',
        editable: false,
        type: 'date',
    },
    year_of_birth: {
        defaultMessage: 'Année de naissance',
        id: 'patientsinfos.year_of_birth',
        type: 'int',
        min: 1900,
    },
    province: {
        defaultMessage: 'Province d\'origine',
        id: 'patientsinfos.province',
    },
    ZS: {
        defaultMessage: 'Zone d\'origine',
        id: 'patientsinfos.ZS',
    },
    AS: {
        defaultMessage: 'Aire d\'origine',
        id: 'patientsinfos.AS',
    },
    village: {
        defaultMessage: 'Village d\'origine',
        id: 'patientsinfos.village',
    },
});

export default patientInfosMessages;
