import { useContext, useEffect, useMemo, useState } from 'react';
import { ReactReduxContext } from 'react-redux';
/**
 *
 * @deprecated Redux
 * This is adding a list of reducers to the existing one's.
 * As using redux is a practice we are trying to avoid, try not to use this hook
 * Also do not use same reducer key as the existing one's (see hat/assets/js/apps/Iaso/redux/store.js)
 *
 * Example how to use in a component:
 *  const store = useInjectedStore([
        {
            reducerKey: 'reducerKey',
            reducer: IMPORTED_REDUCER,
        },
    ]);
    if (!store) return null;
    return (
        <Provider store={store}>
            <CUSTOM_COMPONENT />
        </Provider>
    );
 *
 */

type Reducer = {
    reducerKey: string;
    reducer: (
        // eslint-disable-next-line no-unused-vars
        state: any,
        // eslint-disable-next-line no-unused-vars
        action: Record<any, any>,
    ) => Record<any, any>;
};

type Reducers = Reducer[];

export const useInjectedStore = (reducers: Reducers): any => {
    const { store }: { store: any } = useContext(ReactReduxContext);
    const existingKeys = useMemo(() => {
        return Object.keys(store.getState());
    }, [store]);
    const [injectedStore, setInjectedStore] = useState<boolean>(false);
    useEffect(() => {
        if (store && !injectedStore) {
            for (let i = 0; i < reducers.length; i += 1) {
                const { reducerKey, reducer } = reducers[i];

                if (existingKeys.includes(reducerKey)) {
                    console.warn(
                        `A reducer with this key ("${reducerKey}") already exists in the store`,
                    );
                } else {
                    store.injectReducer(reducerKey, reducer);
                }
            }
            setInjectedStore(true);
        }
    }, [store, injectedStore, reducers, existingKeys]);
    if (!injectedStore) return undefined;

    return store;
};
