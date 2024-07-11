import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';

const SidebarContext = createContext({
    isOpen: false,
    toggleSidebar: () => {
        /* noop */
    },
});

export const useSidebar = () => useContext(SidebarContext);

export const SidebarProvider = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const toggleSidebar = useCallback(() => setIsOpen(!isOpen), [isOpen]);
    const value = useMemo(
        () => ({
            isOpen,
            toggleSidebar,
        }),
        [isOpen, toggleSidebar],
    );
    return (
        <SidebarContext.Provider value={value}>
            {children}
        </SidebarContext.Provider>
    );
};
