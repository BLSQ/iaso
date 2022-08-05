export type Selection<T> = {
    selectedItems: Array<T>;
    unSelectedItems: Array<T>;
    selectAll: boolean;
    selectCount: number;
};
