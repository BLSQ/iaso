const getImgProps = (imageObj, maxWidth, maxHeight) => {
    let newWidth = maxWidth;
    let newHeight = maxHeight;
    let orientation = 'landscape';
    if (imageObj.height > imageObj.width) {
        orientation = 'portrait';
        newWidth = imageObj.width / (imageObj.height / maxHeight);
        newHeight = maxHeight;
    } else {
        newHeight = imageObj.height / (imageObj.width / maxWidth);
        newWidth = maxWidth;
    }
    return {
        width: newWidth,
        height: newHeight,
        orientation,
    };
};

export default getImgProps;

