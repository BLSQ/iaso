const monitoringTabs = [
    {
        key: 'screener',
        columns: 'screenersColumns',
        orderKey: 'screenerOrder',
        selectable: false,
    },
    {
        key: 'confirmer',
        columns: 'confirmersColumns',
        orderKey: 'confirmerOrder',
        selectable: false,
    },
    {
        key: 'screenerqa',
        columns: 'screenersqaColumns',
        orderKey: 'screenerOrder',
        selectable: false,
    },
    {
        key: 'confirmerqa',
        columns: 'confirmersqaColumns',
        orderKey: 'confirmerOrder',
        selectable: false,
    },
    {
        key: 'screenercentralqa',
        columns: 'screenerscentralqaColumns',
        orderKey: 'screenerOrder',
        selectable: true,
    },
    {
        key: 'confirmercentralqa',
        columns: 'confirmerscentralqaColumns',
        orderKey: 'confirmerOrder',
        selectable: true,
    },
];

export default monitoringTabs;
