const casesListColumns = formatMessage => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Année',
                id: 'casesList.label.normalized_year',
            }),
            accessor: 'normalized_year',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Prénom',
                id: 'casesList.label.prename',
            }),
            accessor: 'prename',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Nom',
                id: 'casesList.label.lastname',
            }),
            accessor: 'name',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Postnom',
                id: 'casesList.label.name',
            }),
            accessor: 'name',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Équipe',
                id: 'casesList.label.team',
            }),
            accessor: 'normalized_team_name',
        },
        {
            Header: formatMessage({
                defaultMessage: 'N° de formulaire',
                id: 'casesList.label.form_number',
            }),
            accessor: 'form_number',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Province',
                id: 'casesList.tooltip.province',
            }),
            accessor: 'normalized_province_name',
        },
        {
            Header: 'ZS',
            accessor: 'normalized_zs_name',
        },
        {
            Header: 'AS',
            accessor: 'normalized_as_name',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Village',
                id: 'casesList.tooltip.village',
            }),
            accessor: 'normalized_village_name',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Source',
                id: 'main.label.name',
            }),
            accessor: 'source',
        },
    ]
);
export default casesListColumns;
