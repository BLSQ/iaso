import monthList from '../constants/monthList';

const getMonthName = (monthId) => {
    let monthName = '';
    if (monthId) {
        monthName = monthList.filter(month => (month.id === monthId))[0].fullLabel;
    }
    return monthName;
};

const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
};

const reIndex = (list) => {
    const tempList = [];
    let tempIndex = 0;
    list.forEach((item) => {
        const tempItem = item;
        const tempData = [];
        item.data.forEach((a) => {
            const tempA = a;
            tempA.index = tempIndex;
            tempData.push(tempA);
            tempIndex += 1;
        });
        tempItem.data = tempData;
        tempList.push(tempItem);
    });
    return tempList;
};

const formatAssignations = (assignations) => {
    const tempAssignations = assignations.map(a => ({
        id: a.id,
        village_id: a.village_id,
        name: a.village_name,
        index: a.index,
        population: a.village_population,
        latitude: a.latitude,
        longitude: a.longitude,
        case_count: a.case_count,
        tests_count: a.tests_count,
        split: a.split,
        population_split: a.population_split,
        deleted: a.deleted,
        clone: a.clone,
    }));
    return tempAssignations;
};

const getItemStyle = (isDragging, draggableStyle) => ({
    borderLeft: isDragging ? '1px solid #D2D2D2' : 'none',
    borderRight: isDragging ? '1px solid #D2D2D2' : 'none',
    ...draggableStyle,
});

const move = (source, destination, droppableSource, droppableDestination) => {
    const sourceClone = Array.from(source);
    const destClone = Array.from(destination);
    const [removed] = sourceClone.splice(droppableSource.index, 1);

    destClone.splice(droppableDestination.index, 0, removed);

    const result = {};
    result[droppableSource.droppableId] = sourceClone;
    result[droppableDestination.droppableId] = destClone;

    return result;
};

const filterAssignations = (assignationsList) => {
    const tempMonthList = [];
    monthList.forEach((m) => {
        const tempAssignation = m;
        tempAssignation.population = 0;
        tempAssignation.data = formatAssignations(assignationsList.filter((village) => {
            if ((!village.deleted) && ((village.month === m.id) || (!village.month && m.key === 'not-assigned'))) {
                tempAssignation.population += village.population_split || village.village_population;
                return village;
            }
            return null;
        }));
        tempMonthList.push(tempAssignation);
    });
    return tempMonthList;
};

const hasSameVillageInAMonth = assignationsList => assignationsList.some(a => assignationsList.filter(as => as.village_id === a.village_id && as.month === a.month).length > 1);

const getCloneAssignations = (monthlyAssignations, monthId, villageId) => {
    let assignations = [];
    monthlyAssignations.forEach((month) => {
        if (monthId !== month.id) {
            const monthAssignation = month.data.filter(as => as.village_id === villageId).map(a => ({
                ...a,
                month: month.id,
            }));
            assignations = assignations.concat(monthAssignation);
        }
    });
    return assignations;
};

export {
    move,
    getItemStyle,
    formatAssignations,
    reorder,
    reIndex,
    filterAssignations,
    getMonthName,
    hasSameVillageInAMonth,
    getCloneAssignations,
};
