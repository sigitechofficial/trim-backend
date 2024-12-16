module.exports = function FormatPermissions(featureData, permissionData, permissionType){
    let employeePermissions = featureData.map(ele=>{
        let tmpFeature = permissionData.filter(perm => perm.featureId === ele.id);
        let tmpPermission = permissionType.reduce((acc, type)=>{
            let found = tmpFeature.some(ele=> ele.permissionType === type);
            return {...acc, [type]: found};
        }, {});
        return {id: ele.id, title: ele.title, permissions: tmpPermission}
    });
    return employeePermissions;
};


