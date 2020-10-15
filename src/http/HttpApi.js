import Axios from 'axios'
import { userinfo } from '../util/Tool';
// import Qs from 'qs'

export const Testuri = 'http://ixiaomu.cn:3010/'///小木服务器数据库 3008正式 3010测试
export const permisstion = [{ name: '专工权限', value: 0 }, { name: '运行权限', value: 1 }, { name: '消费审批权限', value: 2 }, { name: '维修权限', value: 3 }]

const HttpApi = {
    obs: function (params, f1, f2) {
        if (f1) {
            return Axios.post(Testuri + 'obs', params).then(res => {
                if (f1) { f1(res) }
            }).catch(res => {
                if (f2) { f2(res) }
            })
        } else {
            return Axios.post(Testuri + 'obs', params, f1, f2)
        }
    },
    updateOrderSearchList: async (code) => {
        let sql = `update order_search_list set is_read = 1 where order_code = '${code}'`
        let result = await HttpApi.obs({ sql })
        if (result.code === 0) {
            return true
        }
        return false
    },
    getOrderUserList: async () => {
        let sql = `select distinct create_user,users.name as user_name from orders
        left join (select * from users where effective = 1) users on users.id = orders.create_user 
        where orders.isdelete = 0`
        let result = await HttpApi.obs({ sql })
        if (result.code === 0) {
            return result.data
        }
        return []
    },
    getUserList: async (username, password) => {
        let condition_sql = '';
        if (username && password) {
            condition_sql = `and username = '${username}' and password = '${password}'`
        }
        let sql = `select users.* ,group_concat(u_m_j.mj_id) as major_id_all, group_concat(majors.name) as major_name_all,levels.name as level_name from users
        left join (select * from levels where effective = 1)levels on levels.id = users.level_id
        left join (select * from user_map_major where effective = 1) u_m_j on u_m_j.user_id = users.id
        left join (select * from majors  where effective = 1) majors on majors.id = u_m_j.mj_id
        where users.effective = 1 ${condition_sql}
        group by users.id
        order by level_id`
        let result = await HttpApi.obs({ sql })
        if (result.code === 0) {
            return result.data
        }
        return []
    },
    getCurrentUserMajor: async () => {
        let user_id = userinfo().id
        let sql = `select user_map_major.*,majors.name as major_name from user_map_major
        left join (select * from majors where effective = 1) majors on majors.id = user_map_major.mj_id
        where user_map_major.user_id = ${user_id} and user_map_major.effective = 1`
        let result = await HttpApi.obs({ sql })
        if (result.code === 0) {
            return result.data
        }
        return []
    },
    /***
     * 查询出退库记录中出现过的人员信息
     */
    getUserListForOutIn: async (type_id = 1) => {
        let sql = `select distinct create_user as id,users.name from orders 
        left join (select * from users where effective = 1) users on users.id = orders.create_user
        where type_id = ${type_id} and isdelete = 0`
        let result = await HttpApi.obs({ sql })
        if (result.code === 0) {
            return result.data
        }
        return []
    },
    /***
     * 查询采购记录中出现过的人员信息
     */
    getUserListForPurchase: async (type_id = 1) => {
        let sql = type_id === 1 ? `select distinct buy_user_id as id,users.name from purchase_record
        left join (select * from users where effective = 1) users on users.id = purchase_record.buy_user_id
        where isdelete = 0 and purchase_record.buy_user_id is not NULL
        `: `select distinct record_user_id as id,users.name from purchase_record
        left join (select * from users where effective = 1) users on users.id = purchase_record.record_user_id
        where isdelete = 0 and purchase_record.record_user_id is not NULL`
        let result = await HttpApi.obs({ sql })
        if (result.code === 0) {
            return result.data
        }
        return []
    },
    /***
     * 获取工作时间区间表
     */
    getSpecialTime: async (type_id = 1) => {
        let sql = `select * from special_time where isdelete = 0`
        let result = await HttpApi.obs({ sql })
        if (result.code === 0) {
            return result.data
        }
        return []
    },
    updateSpecialTime: async (data) => {
        let sql = `update special_time set time_start = '${data.time_start}', time_end = '${data.time_end}',disable = '${data.disable}' where id = ${data.id}`
        let result = await HttpApi.obs({ sql })
        if (result.code === 0) {
            return true
        }
        return false
    },
    getNfc: (params) => {
        return Axios.post(Testuri + 'find_nfc', { ...params, effective: 1 })
    },
    getMajor: (params) => {
        return Axios.post(Testuri + 'find_major', { ...params, effective: 1 })
    },
    getLevel: (params) => {
        return Axios.post(Testuri + 'find_level', { ...params, effective: 1 })
    },
    updateLevel: (params) => {
        return Axios.post(Testuri + 'update_level', params)
    },
    addLevel: (params) => {
        return Axios.post(Testuri + 'insert_level', params)
    },
    deleteLevel: (id) => {
        return Axios.post(Testuri + 'update_level', { query: { id }, update: { effective: 0 } })
    },
    getUser: (params) => {
        return Axios.post(Testuri + 'find_user', { ...params, effective: 1 })
    },
    addUser: (params) => {
        return Axios.post(Testuri + 'insert_user', { ...params, effective: 1 })
    },
    updateUser: (params) => {
        return Axios.post(Testuri + 'update_user', params)
    },
    deleteUser: (id) => {
        return Axios.post(Testuri + 'update_user', { query: { id }, update: { effective: 0 } })
    },
}
export default HttpApi