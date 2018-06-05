
const listLocatorColumns = formatMessage => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'N° de formulaire',
                id: 'locator.label.form_number',
            }),
            accessor: 'form_number',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Année du formulaire',
                id: 'locator.label.form_year',
            }),
            accessor: 'form_year',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Prénom',
                id: 'main.label.prename',
            }),
            accessor: 'prename',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Postnom',
                id: 'main.label.postname',
            }),
            accessor: 'name',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Nom',
                id: 'main.label.name',
            }),
            accessor: 'lastname',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Province',
                id: 'microplanning.tooltip.province',
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
            Header: 'AS match',
            accessor: 'normalized_as_name',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Unité',
                id: 'microplanning.label.team',
            }),
            accessor: 'mobile_unit',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Source',
                id: 'main.label.name',
            }),
            accessor: 'source',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Village',
                id: 'microplanning.tooltip.village',
            }),
            accessor: 'village',
        },
    ]
);
export default listLocatorColumns;
