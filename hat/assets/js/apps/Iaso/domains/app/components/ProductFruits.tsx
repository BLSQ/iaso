import React, { useMemo } from 'react';
import { ProductFruits } from 'react-product-fruits';
import { useCurrentUser } from '../../../utils/usersUtils';

const ProductFruitsComponent = () => {
    const currentUser = useCurrentUser();

    const userInfo = useMemo(() => {
        if (!currentUser || !currentUser.account) {
            return null;
        }
        return {
            username: `${currentUser.account.name}-${currentUser.id}`,
            props: {
                account_name: currentUser.account.name,
                account_id: currentUser.account.id,
            },
        };
    }, [currentUser]);

    if (!window.PRODUCT_FRUITS_WORKSPACE_CODE || !currentUser || !userInfo) {
        return null;
    }

    return (
        <ProductFruits
            workspaceCode={window.PRODUCT_FRUITS_WORKSPACE_CODE}
            language={currentUser.language || 'en'}
            user={userInfo}
        />
    );
};

export default ProductFruitsComponent;
