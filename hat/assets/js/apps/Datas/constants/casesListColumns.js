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
                defaultMessage: 'Nom',
                id: 'casesList.label.name',
            }),
            accessor: 'name',
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
                defaultMessage: 'Postnom',
                id: 'casesList.label.lastname',
            }),
            accessor: 'lastname',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Unité',
                id: 'casesList.label.team',
            }),
            accessor: 'mobile_unit',
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
            accessor: 'province',
        },
        {
            Header: 'ZS',
            accessor: 'ZS',
        },
        {
            Header: 'AS',
            accessor: 'AS',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Village',
                id: 'casesList.tooltip.village',
            }),
            accessor: 'village',
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
