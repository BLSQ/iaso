const selectWorkZone = (workzones, workzoneId, props, urlKey) => {
    const {
        params,
    } = props;
    const currentWorkzone = workzones.filter(w => w.id === workzoneId)[0];
    const provinceIds = [];
    const zoneIds = [];
    const areaIds = [];
    let tempParams = {};
    if (workzoneId) {
        currentWorkzone.as_list.map((as) => {
            if (areaIds.indexOf(as.id) === -1) {
                areaIds.push(as.id);
            }
            if (zoneIds.indexOf(as.zs_id) === -1) {
                zoneIds.push(as.zs_id);
            }
            if (provinceIds.indexOf(as.province_id) === -1) {
                provinceIds.push(as.province_id);
            }
            return null;
        });
        tempParams = {
            ...params,
            workzone_id: workzoneId,
            province_id: provinceIds.toString(),
            zs_id: zoneIds.toString(),
            as_id: areaIds.toString(),
        };
    } else {
        tempParams = {
            ...params,
            workzone_id: null,
            province_id: null,
            zs_id: null,
            as_id: null,
            village_id: null,
        };
    }
    props.redirectTo(urlKey, tempParams);
};

const selectProvince = (provinceId, props, urlKey) => {
    const {
        params,
        filters,
    } = props;
    const tempParams = {
        ...params,
        province_id: provinceId,
    };
    const newProvincesArray = provinceId.split(',');
    if (!provinceId) {
        delete tempParams.province_id;
        delete tempParams.zs_id;
        delete tempParams.as_id;
        delete tempParams.village_id;
    } else if (params.province_id && params.zs_id && newProvincesArray.length < params.province_id.split(',').length) {
        let provinceDeleted;
        params.province_id.split(',').map((p) => {
            if (newProvincesArray.indexOf(p.toString()) === -1) {
                provinceDeleted = p;
            }
            return null;
        });
        const zonesToDelete = filters.zones.filter(z => z.province_id === parseInt(provinceDeleted, 10));
        let areasToDelete = [];
        if (tempParams.as_id) {
            const zsArray = tempParams.zs_id.split(',').slice();
            zonesToDelete.map((z) => {
                const zoneId = z.id.toString();
                if (zsArray.indexOf(zoneId) !== -1) {
                    zsArray.splice(zsArray.indexOf(zoneId), 1);
                }
                if (params.as_id) {
                    areasToDelete = areasToDelete.concat(filters.areas.filter(a => a.ZS_id === z.id));
                }
                return null;
            });
            tempParams.zs_id = zsArray.toString();
        }

        let villagesToDelete = [];
        if (tempParams.as_id) {
            const asArray = tempParams.as_id.split(',').slice();
            areasToDelete.map((a) => {
                const areaId = a.id.toString();
                if (asArray.indexOf(areaId) !== -1) {
                    asArray.splice(asArray.indexOf(areaId), 1);
                }
                if (params.village_id) {
                    villagesToDelete = villagesToDelete.concat(filters.villages.filter(v => v.AS_id === a.id));
                }
                return null;
            });
            tempParams.as_id = asArray.toString();
        }

        if (tempParams.village_id) {
            const villageArray = tempParams.village_id.split(',').slice();
            villagesToDelete.map((a) => {
                const villageId = a.id.toString();
                if (villageArray.indexOf(villageId) !== -1) {
                    villageArray.splice(villageArray.indexOf(villageId), 1);
                }
                return null;
            });
            tempParams.village_id = villageArray.toString();
        }
    }
    props.redirectTo(urlKey, tempParams);
};

const selectZone = (zoneId, props, urlKey) => {
    const {
        params,
        filters,
    } = props;
    const tempParams = {
        ...props.params,
        zs_id: zoneId,
    };

    const newZonesArray = zoneId.split(',');
    if (!zoneId) {
        delete tempParams.zs_id;
        delete tempParams.as_id;
        delete tempParams.village_id;
    } else if (params.as_id && newZonesArray.length < params.zs_id.split(',').length) {
        let zoneDeleted;
        params.zs_id.split(',').map((z) => {
            if (newZonesArray.indexOf(z.toString()) === -1) {
                zoneDeleted = z;
            }
            return null;
        });
        const areasToDelete = filters.areas.filter(a => a.ZS_id === parseInt(zoneDeleted, 10));
        let villagesToDelete = [];
        if (tempParams.as_id) {
            const asArray = tempParams.as_id.split(',').slice();
            areasToDelete.map((a) => {
                const areaId = a.id.toString();
                if (asArray.indexOf(areaId) !== -1) {
                    asArray.splice(asArray.indexOf(areaId), 1);
                }
                if (params.village_id) {
                    villagesToDelete = villagesToDelete.concat(filters.villages.filter(v => v.AS_id === a.id));
                }
                return null;
            });
            tempParams.as_id = asArray.toString();
        }

        if (tempParams.village_id) {
            const villageArray = tempParams.village_id.split(',').slice();
            villagesToDelete.map((a) => {
                const villageId = a.id.toString();
                if (villageArray.indexOf(villageId) !== -1) {
                    villageArray.splice(villageArray.indexOf(villageId), 1);
                }
                return null;
            });
            tempParams.village_id = villageArray.toString();
        }
    }
    props.redirectTo(urlKey, tempParams);
};

const selectArea = (areaId, props, urlKey) => {
    const {
        params,
        filters,
    } = props;
    const tempParams = {
        ...props.params,
        as_id: areaId,
    };
    const newAreasArray = areaId.split(',');
    if (!areaId) {
        delete tempParams.as_id;
        delete tempParams.village_id;
    } else if (params.village_id && newAreasArray.length < params.as_id.split(',').length) {
        let areaDeleted;
        params.as_id.split(',').map((a) => {
            if (newAreasArray.indexOf(a.toString()) === -1) {
                areaDeleted = a;
            }
            return null;
        });
        const villagesToDelete = filters.villages.filter(v => v.AS_id === parseInt(areaDeleted, 10));

        if (tempParams.village_id) {
            const villageArray = tempParams.village_id.split(',').slice();
            villagesToDelete.map((a) => {
                const villageId = a.id.toString();
                if (villageArray.indexOf(villageId) !== -1) {
                    villageArray.splice(villageArray.indexOf(villageId), 1);
                }
                return null;
            });
            tempParams.village_id = villageArray.toString();
        }
    }
    props.redirectTo(urlKey, tempParams);
};

export {
    selectWorkZone,
    selectProvince,
    selectZone,
    selectArea,
};
