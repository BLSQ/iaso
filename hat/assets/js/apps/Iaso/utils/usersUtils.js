const getDisplayName = user => ((user.firstName || user.lastName) && (
    ` - ${user.firstName ? `${user.firstName} ` : ''}${user.lastName}`
));

export default getDisplayName;
