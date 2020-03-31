
const getOrderValue = obj => (!obj.desc ? obj.id : `-${obj.id}`);

export const getSort = (sortList) => {
    let orderTemp = '';
    sortList.map((sort, index) => {
        orderTemp += `${index > 0 ? ',' : ''}${getOrderValue(sort)}`;
        return true;
    });
    return orderTemp;
};
