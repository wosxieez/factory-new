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
    getUserRole: async (user_id) => {
        let sql = `select roles.id,roles.value,roles.des from role_map_user
          left join roles on roles.id = role_map_user.role_id
          where user_id = ${user_id} and effective = 1`
        let result_role = await HttpApi.obs({ sql })
        if (result_role.code === 0) {
            return result_role.data
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
    getNfcShelfList: async () => {
        let sql = `select nfc_shelfs.*,tags.name as tag_name from nfc_shelfs
        left join (select * from tags where isdelete = 0) tags on tags.id = nfc_shelfs.tag_id
        where nfc_shelfs.isdelete = 0 order by id desc`
        let result = await HttpApi.obs({ sql })
        if (result.code === 0) {
            return result.data
        }
        return []
    },
    /**
     * 获取相关RFID数据【未出库的】
     * @param {*} param0 
     */
    getRfidList: async ({ hasBinded, isAll, storeIdList, isOut = 0 }) => {
        let sql = `select * from rfids where isdelete = 0 and is_out = ${isOut} and store_id is ${hasBinded ? 'not' : ''} null`
        if (isAll) {
            sql = `select rfids.*,stores.name as store_name from rfids 
            left join (select * from stores where isdelete = 0) stores on stores.id = rfids.store_id
            where rfids.isdelete = 0 and rfids.is_out = ${isOut}`
        }
        if (storeIdList) {///根据store_id来查对应的rfid
            sql = `select * from rfids where isdelete = 0 and is_out = ${isOut} and store_id in (${storeIdList.join(',')})`
        }
        let result = await HttpApi.obs({ sql })
        if (result.code === 0) {
            return result.data
        }
        return []
    },
    bindRfidToStore: async ({ rfids, store_id }) => {
        let sql = `update rfids set store_id = ${store_id} where id in (${rfids.join(',')})`
        let result = await HttpApi.obs({ sql })
        if (result.code === 0) {
            return true
        }
        return false
    },
    unbindRfidToStore: async ({ store_id_list }) => {
        let sql = `update rfids set store_id = null where store_id in (${store_id_list.join(',')})`
        let result = await HttpApi.obs({ sql })
        if (result.code === 0) {
            return true
        }
        return false
    },
    getNFCShelflist: async (condition = {}) => {
        let sql_name = ''
        if (condition && condition.name) {
            sql_name = ` and nfc_shelfs.name like  '%${condition.name}%'`
        }
        let sql_tag_id = ''
        if (condition && condition.tag_id) {
            sql_tag_id = ` and nfc_shelfs.tag_id in (${condition.tag_id.join(',')})`
        }
        let sql_num = ''
        if (condition && condition.num) {
            sql_num = ` and nfc_shelfs.num like  '%${condition.num}%'`
        }
        let sql_model = ''
        if (condition && condition.model) {
            sql_model = ` and nfc_shelfs.model like  '%${condition.model}%'`
        }
        let sql = `select nfc_shelfs.*,tags.name as tag_name from nfc_shelfs 
        left join (select * from tags where isdelete = 0) tags on tags.id = nfc_shelfs.tag_id
        where nfc_shelfs.isdelete = 0 ${sql_name}${sql_tag_id}${sql_model}${sql_num} order by nfc_shelfs.id desc`
        let result = await HttpApi.obs({ sql })
        if (result.code === 0) {
            return result.data
        }
        return []
    },
    updateNfcShelf: async ({ code, name, tagId, model, num }) => {
        let sql = `update nfc_shelfs set name = '${name}', tag_id = ${tagId} ,model = ${model ? "'" + model + "'" : null},num = ${num ? "'" + num + "'" : null} where code = '${code}'`
        let res = await HttpApi.obs({ sql })
        if (res.code === 0) {
            return true
        }
        return false
    },
    deleteNfcShelf: async ({ id }) => {
        let sql = `update nfc_shelfs set isdelete = 1 where id = '${id}'`
        let res = await HttpApi.obs({ sql })
        if (res.code === 0) {
            return true
        }
        return false
    },
    getRfidListByStoreId: async ({ store_id }) => {
        let sql = `select * from rfids where isdelete = 0 and is_out = 0 and store_id = ${store_id}`
        let result = await HttpApi.obs({ sql })
        if (result.code === 0) {
            return result.data
        }
        return []
    },
    getStoreScanRecordLength: async () => {
        let sql = `select count(*) as count from store_scan_records`
        let result = await HttpApi.obs({ sql })
        if (result.code === 0) {
            return result.data
        }
        return []
    },
    /**
     * 分页查询物品扫描记录
     * @param {*} param0 
     */
    getStoreScanRecord: async ({ store_name, user_name, time, page, pageSize }) => {
        let sql_user_name = !user_name ? `` : ` and  user_name like '%${user_name}%'`
        let sql_store_name = !store_name ? `` : ` and  (content_scan like '%${store_name}%'  ||  content_lost like '%${store_name}%')`///扫描或遗漏的记录里面有这个物品的名字
        let sql_time = ` time >=  '${time[0]}' and time <= '${time[1]}'`
        let all_sql_condtion = sql_time + sql_user_name + sql_store_name
        // console.log('all_sql_condtion:', all_sql_condtion)
        let startPage = (page - 1) * pageSize;
        let sql = `select * from store_scan_records where ${all_sql_condtion} order by id desc limit ${startPage},${pageSize} `
        // console.log('sql:', sql)
        let result = await HttpApi.obs({ sql })
        if (result.code === 0) {
            return result.data
        }
        return []
    },
    /**
     * 标签出库
     * @param {*} param0 
     */
    rfidIsOut: async ({ rfid_id_list, out_time }) => {
        let sql = `update rfids set is_out = 1,out_time = '${out_time}' where id in (${rfid_id_list.join(',')})`
        let result = await HttpApi.obs({ sql })
        if (result.code === 0) {
            return true
        }
        return false
    }
}
export default HttpApi