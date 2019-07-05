import instancesTableColumns from '../constants/instancesTableColumns';

let childrenArray = [];
const getChildren = (el, key) => {
    if (typeof el === 'string') {
        childrenArray.push({
            class: 'small',
            sortable: false,
            accessor: key,
            Header: key,
            Cell: el !== '' ? el : '/',
            width: 150,
        });
    } else {
        Object.keys(el).forEach((k) => {
            getChildren(el[k], k);
        });
    }
};

const getInstancesColumns = (formatMessage, instances) => {
    let tableColumns = [...instancesTableColumns(formatMessage)];
    if (instances[0]) {
        const key = Object.keys(instances[0].file_content)[0];
        childrenArray = [];
        getChildren(instances[0].file_content[key], key);
        tableColumns = tableColumns.concat(childrenArray);
    }
    return tableColumns;
};

export default getInstancesColumns;
