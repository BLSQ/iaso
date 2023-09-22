import { Shape } from '../../../constants/types';

export const findBackgroundShape = (
    shape: Shape,
    backgroundShapes: Shape[],
): string | undefined => {
    return backgroundShapes.filter(
        backgroundShape => backgroundShape.id === shape.parent_id,
    )[0]?.name;
};
