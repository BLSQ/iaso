import React, { useMemo } from 'react';
import { ProductFruits } from 'react-product-fruits';
import { useCurrentUser } from '../../../utils/usersUtils';

const ProductFruitsComponent = () => {
    const currentUser = useCurrentUser();

    if (!window.PRODUCT_FRUITS_WORKSPACE_CODE || !currentUser) {
        return null;
    }

    const userInfo = useMemo(() => {
        return {
            username: `${currentUser.account.name}-${currentUser.id}`,
            props: {
                account_name: currentUser.account.name,
                account_id: currentUser.account.id,
            },
        };
    }, [currentUser]);

    return (
        <ProductFruits
            workspaceCode={window.PRODUCT_FRUITS_WORKSPACE_CODE}
            language={currentUser.language || 'en'}
            user={userInfo}
        />
    );
};

export default ProductFruitsComponent;
