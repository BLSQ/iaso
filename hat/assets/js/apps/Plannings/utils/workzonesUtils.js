import orderBy from 'lodash/orderBy';

export const sortGeoItems = itemsList => orderBy(itemsList, [item => item.name], ['asc']);

const getSortedListIds = (itemsList) => {
    const sortedList = sortGeoItems(itemsList);
    return sortedList.map(z => z.id).join(',');
};

export const mapWorkzoneData = (workzones, allAreas, endemicAs) => {
    const datas = {
        mappedWorkzones: [],
        unUsedAreas: {
            endemic: [],
            nonEndemic: [],
        },
    };
    let usedAreas = [];
    workzones.map((w) => {
        if (w.as_list) {
            usedAreas = usedAreas.concat(w.as_list);
        }
        const currentAreas = [...w.as_list];
        const currentZones = [];
        w.as_list.forEach((area) => {
            if (!currentZones.find(z => z.id === area.zs_id)) {
                currentZones.push({
                    id: area.zs_id,
                    name: area.zs_name,
                });
            }
        });
        const newWorkZone = {
            ...w,
            currentAreas: getSortedListIds(currentAreas),
            currentZones: getSortedListIds(currentZones),
        };
        datas.mappedWorkzones.push(newWorkZone);
        return null;
    });
    allAreas.map((a) => {
        const areaId = parseInt(a.properties.pk, 10);
        if (usedAreas.filter(u => u.id === areaId).length === 0) {
            if (endemicAs[areaId]) {
                datas.unUsedAreas.endemic.push(a.properties);
            } else {
                datas.unUsedAreas.nonEndemic.push(a.properties);
            }
        }
        return null;
    });
    return datas;
};
