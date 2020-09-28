export default {
    version: 'Bate 0.1',
    userinfo: () => {
        let result = {};
        try {
            result = JSON.parse(localStorage.getItem('user'))
        } catch (error) {
            console.log('error:', error)
        }
        return result
    },
    userPermissions: () => {
        let result = [];
        let permission_result = JSON.parse(localStorage.getItem('user')).permission
        ///权限。0专工,1运行,2消费审批(财务),3维修权限,4采购权限,5库管
        if (permission_result) {
            let permission_list = [{ value: 0, name: '专工权限' }, { value: 1, name: '运行权限' }, { value: 2, name: '消费审批权限' }, { value: 3, name: '维修权限' }, { value: 4, name: '采购权限' }, { value: 5, name: '库管权限' }, { value: 6, name: '仓库财务权限' }]
            permission_result.split(',').forEach((p_value) => {
                permission_list.forEach((item) => {
                    if (item.value === parseInt(p_value)) {
                        result.push(item.name)
                    }
                })
            })
            return result.join(',')
        }
        return '-'
    }
}