import Axios from 'axios'
import { userinfo } from '../util/Tool';
import moment from 'moment'
// import Qs from 'qs'
const FORMAT = 'YYYY-MM-DD'
export const Testuri = 'http://ixiaomu.cn:3010/'///小木服务器数据库 3008正式 3010测试
// export const Testuri = 'http://60.174.196.158:3010/' ///60
// export const Testuri = 'http://localhost:3010/'///本地测试
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
        let sql = `select users.* ,group_concat(DISTINCT u_m_j.mj_id) as major_id_all, group_concat(DISTINCT majors.name) as major_name_all,levels.name as level_name,group_concat(DISTINCT r_m_u.role_id) as role_all from users
        left join (select * from levels where effective = 1)levels on levels.id = users.level_id
        left join (select * from user_map_major where effective = 1) u_m_j on u_m_j.user_id = users.id
        left join (select * from majors  where effective = 1) majors on majors.id = u_m_j.mj_id
        left join (select * from role_map_user where effective = 1) r_m_u on r_m_u.user_id = users.id
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
     * 查询出库记录中出现过的人员信息
     */
    getUserListForOutbound: async (type_id = 1) => {
        let sql = type_id === 1 ? `select distinct out_user_id as id,users.name from outbound_record
        left join (select * from users where effective = 1) users on users.id = outbound_record.out_user_id
        where isdelete = 0 and outbound_record.out_user_id is not NULL
        `: `select distinct record_user_id as id,users.name from outbound_record
        left join (select * from users where effective = 1) users on users.id = outbound_record.record_user_id
        where isdelete = 0 and outbound_record.record_user_id is not NULL`
        let result = await HttpApi.obs({ sql })
        if (result.code === 0) {
            return result.data
        }
        return []
    },
    /***
     * 查询退料记录中出现过的人员信息
     */
    getUserListForReturn: async (type_id = 1) => {
        let sql = type_id === 1 ? `select distinct return_user_id as id,users.name from return_record
        left join (select * from users where effective = 1) users on users.id = return_record.return_user_id
        where isdelete = 0 and return_record.return_user_id is not NULL
        `: `select distinct record_user_id as id,users.name from return_record
        left join (select * from users where effective = 1) users on users.id = return_record.record_user_id
        where isdelete = 0 and return_record.record_user_id is not NULL`
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
        if (condition && condition.store_area_id) {
            sql_tag_id = ` and nfc_shelfs.store_area_id = (${condition.store_area_id})`
        }
        let sql_num = ''
        if (condition && condition.num) {
            sql_num = ` and nfc_shelfs.num like  '%${condition.num}%'`
        }
        let sql_model = ''
        if (condition && condition.model) {
            sql_model = ` and nfc_shelfs.model like  '%${condition.model}%'`
        }
        let sql = `select nfc_shelfs.*,store_areas.name as store_area_name from nfc_shelfs 
        left join (select * from store_areas where isdelete = 0) store_areas on store_areas.id = nfc_shelfs.store_area_id
        where nfc_shelfs.isdelete = 0 ${sql_name}${sql_tag_id}${sql_model}${sql_num} order by nfc_shelfs.id desc`
        let result = await HttpApi.obs({ sql })
        if (result.code === 0) {
            return result.data
        }
        return []
    },
    updateNfcShelf: async ({ id, name, model, num, store_area_id, updatedAt }) => {
        let block_name = ''
        if (name) { block_name = `name = '${name}',` }
        let block_model = ''
        if (model) { block_model = `model = '${model}',` }
        let block_num = ''
        if (num) { block_num = `num = '${num}',` }
        let block_store_area_id = ''
        if (store_area_id) { block_store_area_id = `store_area_id = ${store_area_id},` }
        let block_update = ''
        if (updatedAt) { block_update = `updatedAt = '${updatedAt}'` }
        let set_sql = block_name + block_store_area_id + block_model + block_num + block_update
        let sql = `update nfc_shelfs set ${set_sql} where id = '${id}'`
        let res = await HttpApi.obs({ sql })
        if (res.code === 0) {
            return true
        }
        return false
    },
    addNfcShelf: async ({ name, model, num, store_area_id, createdAt }) => {
        let sql = `insert into nfc_shelfs (name, model, num,store_area_id, createdAt) values 
        ('${name}', '${model}', '${num}','${store_area_id}','${createdAt}')`
        let res = await HttpApi.obs({ sql })
        if (res.code === 0) {
            return true
        }
        return false
    },
    deleteNfcShelf: async ({ idList }) => {
        let sql = `update nfc_shelfs set isdelete = 1 where id in (${idList.join(',')})`
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
    /**
     * 分页查询物品扫描记录
     * @param {*} param0 
     */
    getStoreScanRecord: async ({ store_name, user_name, time, page, pageSize }) => {
        let result_data = { list: [], count: 0 };
        let sql_user_name = !user_name ? `` : ` and  user_name like '%${user_name}%'`
        let sql_store_name = !store_name ? `` : ` and  (content_scan like '%${store_name}%'  ||  content_lost like '%${store_name}%')`///扫描或遗漏的记录里面有这个物品的名字
        let sql_time = ` time >=  '${time[0]}' and time <= '${time[1]}'`
        let all_sql_condtion = sql_time + sql_user_name + sql_store_name
        // console.log('all_sql_condtion:', all_sql_condtion)
        let startPage = (page - 1) * pageSize;
        let sql = `select * from store_scan_records where ${all_sql_condtion} order by id desc limit ${startPage},${pageSize} `
        let result = await HttpApi.obs({ sql })
        if (result.code === 0) {
            result_data['list'] = result.data
        }
        let sql_len = `select  count(*) as count from store_scan_records where ${all_sql_condtion}`
        let result_len = await HttpApi.obs({ sql: sql_len })
        if (result_len.code === 0) {
            result_data['count'] = result_len.data[0].count
        }
        return result_data
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
    },
    /**
     *  分页查询物品数量变动记录
     * @param {*} param0 
     */
    getStoreChangeRecords: async ({ store_name, user_name, time, page, pageSize, shelf_name, type }) => {
        let result_data = { list: [], count: 0 };
        let sql_type = type === 0 || type > 0 ? ` and type = ${type}` : ''
        let sql_shelf_name = !shelf_name ? `` : ` and  shelf_name like '%${shelf_name}%'`
        let sql_user_name = !user_name ? `` : ` and  user_name like '%${user_name}%'`
        let sql_store_name = !store_name ? `` : ` and  (origin_content like '%${store_name}%'  ||  change_content like '%${store_name}%' ||  add_content like '%${store_name}%' ||  remove_content like '%${store_name}%')`///记录里面有这个物品的名字
        let sql_time = ` time >=  '${time[0]}' and time <= '${time[1]}'`
        let all_sql_condtion = sql_time + sql_user_name + sql_store_name + sql_shelf_name + sql_type
        let startPage = (page - 1) * pageSize;
        let sql = `select * from store_change_records where ${all_sql_condtion} order by id desc limit ${startPage},${pageSize} `
        // console.log('sql:', sql)
        let result = await HttpApi.obs({ sql })
        if (result.code === 0) {
            result_data['list'] = result.data
        }
        let sql_len = `select  count(*) as count from store_change_records where ${all_sql_condtion}`
        let result_len = await HttpApi.obs({ sql: sql_len })
        if (result_len.code === 0) {
            result_data['count'] = result_len.data[0].count
        }
        return result_data
    },
    /**
    *  分页查询货架扫描记录
    * @param {*} param0 
    */
    getShelfScanRecords: async ({ store_name, user_name, time, page, pageSize, shelf_name }) => {
        let result_data = { list: [], count: 0 };
        let sql_shelf_name = !shelf_name ? `` : ` and  shelf_name like '%${shelf_name}%'`
        let sql_user_name = !user_name ? `` : ` and  user_name like '%${user_name}%'`
        let sql_store_name = !store_name ? `` : ` and  (content like '%${store_name}%')`///记录里面有这个物品的名字
        let sql_time = ` time >=  '${time[0]}' and time <= '${time[1]}'`
        let all_sql_condtion = sql_time + sql_user_name + sql_store_name + sql_shelf_name
        let startPage = (page - 1) * pageSize;
        let sql = `select * from shelf_scan_records where ${all_sql_condtion} order by id desc limit ${startPage},${pageSize} `
        // console.log('sql:', sql)
        let result = await HttpApi.obs({ sql })
        if (result.code === 0) {
            result_data['list'] = result.data
        }
        let sql_len = `select  count(*) as count from shelf_scan_records where ${all_sql_condtion}`
        let result_len = await HttpApi.obs({ sql: sql_len })
        if (result_len.code === 0) {
            result_data['count'] = result_len.data[0].count
        }
        return result_data
    },
    /**
    * 物品数量种类变动记录
    * change_type = 0, 变动类型 0 数量 1 种类
    * type = 1, 操作平台类型 0 pda 1pc
    * add_content, 新增物品内容 【change_type=1时】
    * remove_content, 移除物品内容【change_type=1时】
    * origin_content, 原先物品数量 【change_type=0时】
    * change_content, 变动后物品数量 【change_type=0时】
    * time, 时间
    * user_id, 操作人id
    * user_name, 操作人名称
    * shelf_id, 货架id
    * shelf_name 货架名称
    * is_edit 1编辑库存列表操作 0出库、采购、退料
    * remark 出库、采购、退料
    * @param {*} param0 
    */
    insertStoreChangeRecord: async ({ change_type = 0, type = 1, add_content, remove_content, origin_content, change_content, time, user_id, user_name, shelf_id, shelf_name, is_edit, remark }) => {
        let sql = ``
        if (change_type === 0) {///物品数量变动
            sql = `insert into store_change_records (origin_content, change_content,time, user_id, user_name, shelf_id, shelf_name, type, change_type, is_edit, remark) values 
            (${origin_content ? "'" + origin_content + "'" : null},${change_content ? "'" + change_content + "'" : null},'${time}',${user_id},'${user_name}',${shelf_id ? shelf_id : null},${shelf_name ? "'" + shelf_name + "'" : null},${type},${change_type},${is_edit},${remark ? "'" + remark + "'" : null})`
        } else {///物品种类变动【新增或删除物品】
            sql = `insert into store_change_records (add_content, remove_content,time, user_id, user_name, shelf_id, shelf_name, type, change_type, is_edit, remark) values 
            (${add_content ? "'" + add_content + "'" : null},${remove_content ? "'" + remove_content + "'" : null},'${time}',${user_id},'${user_name}',${shelf_id ? shelf_id : null},${shelf_name ? "'" + shelf_name + "'" : null},${type},${change_type},${is_edit},${remark ? "'" + remark + "'" : null})`
        }
        // console.log('sql:', sql)
        let result = await HttpApi.obs({ sql })
        if (result.code === 0) {
            return true
        }
        return false
    },


    getStoreAttributeList: async ({ table_index = 0 }) => {
        const table_list = ['store_areas', 'store_types', 'store_majors', 'store_suppliers']
        const table_name = table_list[table_index]
        let sql = `select * from ${table_name} where isdelete = 0`
        return await HttpApi.obs({ sql })
    },

    /**
     * 新增各种物品的属性表
     * 包括 store_areas store_type store_majors store_suppliers
     * @param {*} param0 
     */
    addAttributeTable: async ({ table_index = 0, pid = null, name = '', num = '' }) => {
        const table_list = ['store_areas', 'store_types', 'store_majors', 'store_suppliers']
        const table_name = table_list[table_index]
        let sql = `insert into ${table_name} (name,pid) values ('${name}',${pid}) `
        if (table_index === 3) {
            sql = `insert into ${table_name} (name,pid,num) values ('${name}',${pid},${num}) `
        }
        return await HttpApi.obs({ sql })
    },
    /**
     * 修改各种物品的属性表
     * 包括 store_areas store_type store_majors store_suppliers
     * @param {*} param0 
     */
    updateAttributeTable: async ({ table_index = 0, pid = null, name = '', id }) => {
        const table_list = ['store_areas', 'store_types', 'store_majors', 'store_suppliers']
        const table_name = table_list[table_index]
        let sql = `update ${table_name} set name = '${name}', pid = ${pid} where id = ${id} `
        return await HttpApi.obs({ sql })
    },
    /**
     * 删除各种物品的属性表
     * 包括 store_areas store_type store_majors store_suppliers
     * @param {*} param0 
     */
    deleteAttributeTable: async ({ table_index = 0, id }) => {
        const table_list = ['store_areas', 'store_types', 'store_majors', 'store_suppliers']
        const table_name = table_list[table_index]
        let sql = `update ${table_name} set isdelete = 1 where id = ${id} `
        return await HttpApi.obs({ sql })
    },

    /**
     * 获取所有store 关联上 store_areas,store_majors,store_types
     */
    getAllStoreList: async ({ store_area_id, store_type_id, store_major_id, date, keyword }) => {
        let sql_keyword = !keyword ? `` : ` and (stores.name like '%${keyword}%' or stores.remark like '%${keyword}%' or  stores.num like '%${keyword}%' or stores.model like '%${keyword}%')`
        let sql_store_area_id = !store_area_id ? `` : ` and store_area_id = ${store_area_id}`
        let sql_store_type_id = !store_type_id ? `` : ` and store_type_id = ${store_type_id}`
        let sql_store_major_id = !store_major_id ? `` : ` and store_major_id = ${store_major_id}`
        let sql_createdAtRange = !date ? `` : ` and createdAt >= '${date[0]}' and createdAt <= '${date[1]}'`
        let conditon_sql = sql_keyword + sql_store_area_id + sql_store_type_id + sql_store_major_id + sql_createdAtRange
        let sql = `select stores.*,store_areas.name as store_area_name,store_majors.name as store_major_name,store_types.name as store_type_name from stores
        left join (select * from store_areas where isdelete = 0) store_areas on store_areas.id = stores.store_area_id
        left join (select * from store_majors where isdelete = 0) store_majors on store_majors.id = stores.store_major_id
        left join (select * from store_types where isdelete = 0) store_types on store_types.id = stores.store_type_id
        where stores.isdelete = 0 ${conditon_sql} order by stores.num
        `
        return await HttpApi.obs({ sql })
    },

    /**
     * 获取所有store 关联上 store_areas,store_majors,store_types
     */
    getStoreListById: async ({ id }) => {
        let sql_store_id = !id ? `` : ` and id = ${id}`
        let conditon_sql = sql_store_id
        let sql = `select stores.* from stores
        where stores.isdelete = 0 ${conditon_sql} order by stores.num
        `
        return await HttpApi.obs({ sql })
    },

    // updateAllstoreModelNumStoreAreaId: async ({ nfc_shelf_id, model, num, store_area_id }) => {
    //     let sql = `update stores set model = '${model}',num='${num}',store_area_id=${store_area_id} where nfc_shelf_id=${nfc_shelf_id}`
    //     return await HttpApi.obs({ sql })
    // }

    /**
     * 获取采购表、出库表、退料表的记录条数
     * 用于生成单号
     */
    getPurchaseOrOutboundOrReturnRecordListCount: async ({ type }) => {
        let date_range = [moment().startOf('year').format(FORMAT), moment().endOf('year').format(FORMAT)]
        let type_list = ['purchase_record', 'outbound_record', 'return_record']///进货(采购)、销售(出库)、退料
        let table_name = type_list[type]
        let sql = `select count(*) as count from ${table_name} where date >='${date_range[0]}' and date <='${date_range[1]}'`
        // console.log('sql:', sql)
        return await HttpApi.obs({ sql })
    },

    /**
     * 检查store的编号是否已经存在过
     * @param {*} param0 
     */
    checkStoreNumhasExisted: async ({ num }) => {
        let sql = `select id from stores where num = ${num} and isdelete = 0`
        return await HttpApi.obs({ sql })
    },
    getStoreReturnHistoryRecord: async ({ id }) => {
        let sql = `select * from return_record where locate('"store_id":${id},',content) and isdelete = 0`
        return await HttpApi.obs({ sql })
    },
    getStoreInHistoryRecord: async ({ id }) => {
        let sql = `select * from purchase_record where locate('"store_id":${id},',content) and isdelete = 0`
        return await HttpApi.obs({ sql })
    },
    getStoreOutHistoryRecord: async ({ id }) => {
        let sql = `select * from outbound_record where locate('"store_id":${id},',content) and isdelete = 0`
        return await HttpApi.obs({ sql })
    },
    getStoreChangeHistoryRecord: async ({ id }) => {
        let sql = `select * from store_change_records where locate('"id":${id},',origin_content) or locate('"id":${id},',change_content) or locate('"id":${id},',add_content) or locate('"id":${id},',remove_content)`
        return await HttpApi.obs({ sql })
    }
}
export default HttpApi