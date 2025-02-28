import { useEffect } from 'react';
import { useQueryClient, QueryKey } from 'react-query';

type UseQueryUpdateListenerProps = {
    queryKey: QueryKey;
    onUpdate: () => void;
};

export const useQueryUpdateListener = ({
    queryKey,
    onUpdate,
}: UseQueryUpdateListenerProps) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        const unsubscribe = queryClient.getQueryCache().subscribe(event => {
            if (
                event?.type === 'queryUpdated' &&
                (event?.query?.queryKey === queryKey ||
                    (Array.isArray(event?.query?.queryKey) &&
                        event?.query?.queryKey.some(key => key === queryKey)))
            ) {
                onUpdate();
            }
        });

        return () => {
            unsubscribe();
        };
    }, [queryClient, queryKey, onUpdate]);
};
