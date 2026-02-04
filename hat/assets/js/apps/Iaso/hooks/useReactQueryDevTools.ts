import { useEffect, useState } from 'react';

export const useReactQueryDevTools = () => {
    const [showDevtools, setShowDevtools] = useState(false);
    useEffect(() => {
        window.showReactQueryDevtools = () => setShowDevtools(true);
        window.hideReactQueryDevtools = () => setShowDevtools(false);
        return () => {
            delete window.showReactQueryDevtools;
            delete window.hideReactQueryDevtools;
        };
    }, []);
    return showDevtools;
};
