import moment from 'moment'
import HttpApi from '../http/HttpApi';
export const colorList = [{ label: '薄暮', color: '#f5222d' }, { label: '火山', color: '#fa541c' }, { label: '日暮', color: '#fa8c16' }, { label: '金盏花', color: '#faad14' },
{ label: '日出', color: '#fadb14' }, { label: '青柠', color: '#a0d911' }, { label: '极光绿', color: '#52c41a' }, { label: '明青', color: '#13c2c2' },
{ label: '拂晓蓝', color: '#1890ff' }, { label: '极客蓝', color: '#2f54eb' }, { label: '酱紫', color: '#722ed1' }, { label: '法式洋红', color: '#eb2f96' }]
export const tagTypeList = [{ label: '物品', icon: 'code-sandbox', value: 0 }, { label: '人员', icon: 'user', value: 1 }]

export const getJsonTree = function (data, pId) {
  let itemArr = []
  for (let i = 0; i < data.length; i++) {
    let node = data[i]
    if (node.pId === pId) {
      let newNode = {}
      // newNode.selectable = node.allselectable ? true : node.pId > 0 ///不让首层treeSelect元素可选
      newNode.key = node.value
      newNode.value = node.value
      newNode.id = node.id
      newNode.title = node.title
      newNode.children = getJsonTree(data, node.id)
      itemArr.push(newNode)
    }
  }
  return itemArr
}

const getSubDepartmentTree = (departments, parentDepartment) => {
  const subTree = []

  departments.forEach(subDepartment => {
    if (subDepartment.dids && subDepartment.dids.indexOf(parentDepartment.id) >= 0) {
      const newSubDepartment = { ...subDepartment }
      newSubDepartment.title = newSubDepartment.name
      newSubDepartment.value = newSubDepartment.id
      newSubDepartment.key = parentDepartment.id + '-' + newSubDepartment.id
      subTree.push(newSubDepartment)
    }
  })

  if (subTree.length > 0) {
    subTree.forEach(tree => {
      tree.children = getSubDepartmentTree(departments, tree)
    })
  }

  return subTree
}

export const getDepartmentTree = departments => {
  const tree = []

  departments.forEach(department => {
    // 如果dids空,默认为第一级部门
    if (!department.dids) {
      const newDepartment = { ...department }
      newDepartment.title = newDepartment.name
      newDepartment.value = newDepartment.id
      newDepartment.key = newDepartment.id
      tree.push(newDepartment)
    }
  })

  if (tree.length > 0) {
    tree.forEach(t => {
      t.children = getSubDepartmentTree(departments, t)
    })
  }
  return tree
}

/**
 * 过滤Tag
 * 暂时前端根据type和tids是否存在过滤
 * @export
 * @param {*} tagList 标签数组
 * @param {String} filterType 需要保留的tag type   0 物品  1 人员
 */
export function filterTag(tagList, filterType) {
  if (tagList && tagList.length > 0 && filterType >= 0) {
    return tagList.filter((item) => {
      if (!item.tids) { return item.type === filterType }
      else { return true }
    })
  } else {
    return tagList
  }
}

export function xiaomeiParseFloat(value) {
  if (!value) return 0
  let newValue = parseInt(10 * value.toFixed()) === parseInt(10 * value.toFixed(2)) ? value.toFixed() : value.toFixed(2)
  newValue = parseFloat(newValue)
  return newValue
}

/**
 * 将申请单格式转换成已物品为单位的格式
 * 还要根据查询的物品条件 进行过滤
 * @param {*} orderList 
 */
export function translateOrderList(orderList, store_id_list = []) {
  let allStoreList = [];
  let sum_count = 0;///总件数
  let sum_price = 0;///总价
  orderList.forEach((order) => {
    const contentStr = order.content;
    if (contentStr) {
      try {
        const contentJSON = JSON.parse(contentStr);
        if (store_id_list && store_id_list.length > 0) {
          store_id_list.forEach((store_id) => {
            contentJSON.forEach((store) => {
              if (parseInt(store_id) === store.store_id) {
                sum_count = sum_count + store.count
                sum_price = sum_price + store.price
                allStoreList.push({ store, order })
              }
            })
          })
        } else {
          contentJSON.forEach((store) => {
            sum_count = sum_count + store.count
            sum_price = sum_price + store.price * store.count
            allStoreList.push({ store, order })
          })
        }
      } catch (error) {
        console.log('解析content出错')
      }
    }
  })
  return { allStoreList, sum_count, sum_price: xiaomeiParseFloat(sum_price) };
}

/**
 *
 *
 * @export
 */
export function translatePurchaseRecordList(purchaseRecordList) {
  let allStoreList = [];
  purchaseRecordList.forEach((item) => {
    const itemCopy = JSON.parse(JSON.stringify(item))
    delete itemCopy.content
    const storesList = JSON.parse(item.content)
    storesList.forEach((store) => {
      store.other = itemCopy
      allStoreList.push(store)
    })
  })
  return allStoreList
}
/**
 *
 * @export
 * @param {*} password
 */
/**
 *检查密码是否有非法字符。避免sql注入的情况
 * @export
 * @param {*} password
 * @returns 
 */
export function checkPasswordChart(password) {
  let illegal_list = [',', "'", '"', '=', ' ']
  for (let index = 0; index < password.length; index++) {
    const chart = password[index];
    if (illegal_list.indexOf(chart) !== -1) {
      return false
    }
  }
  return true
}
/**
 *当前时刻是否为特殊时刻--即 不在正常工作时段表中
 * @export
 * @returns true 是特殊时刻  false 正常时刻
 */
export async function checkCurrentTimeIsSpecial() {
  let time_list = await HttpApi.getSpecialTime()
  let flag = true;
  let current_time = moment();
  time_list = time_list.filter((element) => { return element.disable === 0 }).map((item) => {
    item.time_start = moment(current_time.format('YYYY-MM-DD ') + item.time_start).format('YYYY-MM-DD HH:mm:ss')
    item.time_end = moment(current_time.format('YYYY-MM-DD ') + item.time_end).format('YYYY-MM-DD HH:mm:ss')
    return item
  })
  time_list.forEach((item) => {
    if (current_time.day() === item.day) {
      if (current_time >= moment(item.time_start) && current_time <= moment(item.time_end)) {
        flag = false
      }
    }
  })
  return flag
}

export function userPermissions() {
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
    return result
  }
  return []
}

export function userinfo() {
  let result = {};
  try {
    result = JSON.parse(localStorage.getItem('user'))
  } catch (error) {
    console.log('error:', error)
  }
  return result
}

/**
 * 物品种类发生变动
 * change_type 0 数量 1种类
 * content [{store_id:1,store_name:'物品A',count:x},...]
 * is_add 1 / 0 增加或删除
 * is_edit = 1, 物品种类发生变动一定是编辑物品列表新增物品
 * @param {*} param0 
 */
export async function storeClassChange({ content, is_add, user_id, user_name, shelf_id, shelf_name, is_edit = 1 }) {
  let data = {};
  data['change_type'] = 1;
  data['time'] = moment().format('YYYY-MM-DD HH:mm:ss');
  data['user_id'] = user_id;
  data['user_name'] = user_name;
  data['shelf_id'] = shelf_id;
  data['shelf_name'] = shelf_name;
  data['is_edit'] = is_edit;
  if (is_add) {
    data['add_content'] = JSON.stringify(content);
  } else {
    data['remove_content'] = JSON.stringify(content);
  }
  let res = await HttpApi.insertStoreChangeRecord(data)
  return res
}
/**
 * 物品数量发生变动
 * origin_content [{store_id:1,store_name:'物品A',count:x},...]
 * change_content [{store_id:1,store_name:'物品A',count:y},...]
 * @param {*} param0 
 */
export async function storeCountChange({ origin_content, change_content, user_id, user_name, shelf_id, shelf_name, is_edit, remark = null }) {
  let data = {};
  data['change_type'] = 0;
  data['time'] = moment().format('YYYY-MM-DD HH:mm:ss');
  data['user_id'] = user_id;
  data['user_name'] = user_name;
  data['shelf_id'] = shelf_id;
  data['shelf_name'] = shelf_name;
  data['origin_content'] = JSON.stringify(origin_content);
  data['change_content'] = JSON.stringify(change_content);
  data['is_edit'] = is_edit;
  data['remark'] = remark;
  let res = await HttpApi.insertStoreChangeRecord(data)
  return res
}

export async function checkStoreCountChange({ origin_store, change_store, is_edit }) {
  let user = userinfo();
  let data = {};
  data['user_id'] = user['id']
  data['user_name'] = user['name']
  data['shelf_id'] = origin_store['nfc_shelf_id']
  data['shelf_name'] = origin_store['nfc_shelf'] ? origin_store['nfc_shelf']['name'] : null
  data['is_edit'] = is_edit
  let origin_data = {};
  origin_data['id'] = origin_store['id']
  origin_data['name'] = origin_store['name']
  origin_data['count'] = origin_store['count']
  origin_data['has_rfid'] = origin_store['has_rfid'] ? 1 : 0
  let change_data = {};
  change_data['id'] = origin_store['id']
  change_data['name'] = origin_store['name']
  change_data['count'] = change_store['count']
  change_data['has_rfid'] = change_store['has_rfid'] ? 1 : 0
  await storeCountChange({ ...data, origin_content: [origin_data], change_content: [change_data] })
}
/**
 * content JSON
 * @param {*} param0 
 */
export async function checkStoreClassChange({ is_add, content }) {
  let user = userinfo();
  let content_temp = [];
  content_temp = content.map((item) => {
    let obj = {};
    obj['id'] = item['id']
    obj['name'] = item['name']
    obj['count'] = item['count']
    obj['has_rfid'] = item['has_rfid'] ? 1 : 0
    return obj
  })
  let data = {};
  data['user_id'] = user['id']
  data['user_name'] = user['name']
  if (is_add) {///添加物品种类时，是一个一个添加的可能有货架信息一一对应。删除时，可能存在物品所属不同的货架。所以删除时，不包含货架信息
    data['shelf_id'] = content[0]['nfc_shelf_id']
    data['shelf_name'] = content[0]['shelf_name']
  }
  await storeClassChange({ is_add, content: content_temp, ...data });
}