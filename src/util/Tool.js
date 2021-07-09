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

/**
 * json 2 tree 新数据情况下
 * @param {*} data 
 * @param {*} pid 
 * @returns 
 */
export const getJson2Tree = function (data, pid) {
  let itemArr = [];
  for (let i = 0; i < data.length; i++) {
    let node = data[i];
    if (node.pid === pid) {
      let newNode = {};
      newNode.num = node.num;
      newNode.id = node.id;
      newNode.key = node.id;
      newNode.value = node.id;
      newNode.title = node.name;
      newNode.pid = node.pid;
      newNode.children = getJson2Tree(data, node.id);
      itemArr.push(newNode);
    }
  }
  return itemArr;
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
      // store.other = itemCopy
      // allStoreList.push(store)
      let new_obj = { ...store }
      new_obj.other = itemCopy
      new_obj.record_content = storesList
      allStoreList.push(new_obj)
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
/**
 * 检查物品数量发生变化
 *  origin_store, 原始数据
 * change_store,  变动后数据
 * is_edit 是否为编辑
 * @param {*} param0 
 */
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
 * 检查物品种类发生变化
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
    obj['count'] = item['count'] || 0
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

/**
 * 获取物品税后单价
 * @param {*} oprice  原价
 * @param {*} tax  税率 %
 * @returns 
 */
export function getTaxPrice(oprice, tax) {
  if (!tax) { return oprice }
  return parseFloat((oprice / (1 + tax / 100)).toFixed(2))
}

/**
 * 根据原始价格和税后价格 算出税率
 * @param {*} oprice 
 * @param {*} taxprice 
 * @returns 
 */
export function getTaxByOpriceAndTaxPrice(oprice, taxprice) {
  if (oprice && taxprice) {
    return parseFloat((((oprice / taxprice) - 1) * 100).toFixed(2))
  }
}

/**
 * storeList 总税价 针对采购单中存在temp_tax 和 temp_tax_price的情况
 * @param {*} storeList 
 * @returns 
 */
export function getListAllTaxPrice(storeList) {
  if (storeList) {
    let sum_price = 0;
    storeList.forEach((item) => {
      const price = item.temp_tax_price
      const count = item.count
      sum_price = sum_price + price * count
    })
    return sum_price
  }
  return 0
}

/**
 * storeList 总税价 针对出库和退料单中存在temp_tax 和 tax_price的情况
 * @param {*} storeList 
 * @returns 
 */
export function getListAllTaxPrice2(storeList) {
  if (storeList) {
    let sum_price = 0;
    storeList.forEach((item) => {
      const price = item.tax_price
      const count = item.count
      sum_price = sum_price + price * count
    })
    return sum_price
  }
  return 0
}

/**
 * storeList 总价
 * @param {*} storeList 
 * @returns 
 */
export function getListAllPriceAndCount(storeList) {
  let sum_price = 0;
  let sum_count = 0;
  if (storeList) {
    storeList.forEach((item) => {
      const price = item.price
      const count = item.count
      sum_price = sum_price + price * count
      sum_count = sum_count + count
    })
  }
  return { sum_price, sum_count }
}

/**
 * 计算 流程出库物品记录 中的数据 的税总价
 * @param {*} list 
 */
export function calculOrderListStoreTaxAllPrice(list) {
  if (!list) { return 0 }
  let sum_tax_price = 0
  list.forEach((item) => {
    const store = item.store
    sum_tax_price += store.tax_price * store.count
  })
  return sum_tax_price
}

export function undefined2null(data) {
  let tempObj = {}
  for (const key in data) {
    const element = data[key];
    if (element === undefined) {
      tempObj[key] = null
    } else {
      tempObj[key] = element
    }
  }
  return tempObj
}

export function addCharToHead({ originString = '', targetString = '', Targetlength = 5 }) {
  let count = 0
  let result = originString
  while (count < Targetlength - originString.length) {
    result = targetString + result
    count++;
  }
  return result
}

/**
 * 自动计算单号
 * ['JH', 'XS', 'TL']///进货(采购)、销售(出库)、退料
 */
export async function autoGetOrderNum({ type = 0 }) {
  let type_list = ['JH', 'XS', 'TL']///进货(采购)、销售(出库)、退料
  let type_des = type_list[type]
  let year_des = moment().toDate().getFullYear()
  let res = await HttpApi.getPurchaseOrOutboundOrReturnRecordListCount({ type })
  if (res.code === 0) {
    let new_count = res.data[0].count + 1
    let no_str = addCharToHead({ originString: String(new_count), targetString: '0', Targetlength: 5 })
    let result_res = type_des + '-' + year_des + '-' + no_str
    return result_res
  }
}

/**
 * 判断出那些元素准备移除 【只支持两个原始条件匹配】
 * @param {*} param0 
 */
export function checkWhichItemReadyRemove({ targetList, conditionList, targetKey, conditionKey }) {
  let result_list = targetList.map((targetItem) => {
    let new_obj = { ...targetItem }
    conditionList.forEach((condtionItem) => {
      if (targetItem[targetKey[0]] === condtionItem[conditionKey[0]] && targetItem[targetKey[1]] === condtionItem[conditionKey[1]]) {
        new_obj.removed = true
      }
    })
    return new_obj
  })
  return result_list
}
/**
 * 计算移除后的订单总数量和总价
 * @param {*} list 
 * @returns 
 */
export function checkSumCountAndSumPrice(list) {
  let sumCount = 0
  let sumPrice = 0
  list.forEach((item) => {
    if (!item.removed) {
      sumCount = sumCount + item.count
      sumPrice = sumPrice + (item.count * item.price)
    }
  })
  return { newSumCount: sumCount, newSumPrice: sumPrice }
}

export function addRemoveRemarkForStoreItem({ targetList, removedRemark, removedTime, removedUsername }) {
  return targetList.map((item) => {
    if (item.removed && !item['removedRemark'] && !item['removedTime'] && !item['removedUsername']) {
      item['removedRemark'] = removedRemark
      item['removedTime'] = removedTime
      item['removedUsername'] = removedUsername
    }
    return item
  })
}

/**
 * content中 物品的removed 字段代表 是否做过撤销操作
 * @param {*} list 
 * @returns 
 */
export function allStoreItemIsRemoved(list) {
  if (!list || list.length === 0) { return true }
  let is_all_removed = true
  list.forEach((item) => {
    if (!item.removed) { is_all_removed = false }
  })
  return is_all_removed
}

export function deleteListSomeKeys(list) {
  return JSON.parse(JSON.stringify(list)).map((item) => {
    delete item.db_count
    delete item.db_is_reduced
    delete item.db_is_removed
    return item
  })
}

/**
 * 将入库单中统一编号的物品进行融合
 */
export function unionSameStore(storeList) {
  let has_repeated = false
  let result_list = []
  let copy_store_list = JSON.parse(JSON.stringify(storeList))
  // console.log('copy_store_list:', copy_store_list)
  let after_group_list_obj = {}
  copy_store_list.forEach((store) => {
    if (after_group_list_obj[String(store.num)]) {
      after_group_list_obj[String(store.num)].push(store)
    } else {
      after_group_list_obj[String(store.num)] = [store]
    }
  })
  // console.log('after_group_list_obj:', after_group_list_obj)
  for (const key in after_group_list_obj) {
    const element = after_group_list_obj[key]; ///重复的store,等待整合
    if (element && element.length > 1) {
      has_repeated = true
      // console.log('element:', element)
      let first_store_copy = JSON.parse(JSON.stringify(element[0]))///复制第一个
      let o_count = first_store_copy.o_count;///数据库中原始的count
      let o_price = first_store_copy.o_price;///数据库中原始的price 
      let o_tax_price = first_store_copy.tax_price;///数据库中原始的tax_price ///税后单价
      let all_tax_price = o_tax_price * o_count///原始总物品的总税价 all_tax_price
      let all_price = o_price * o_count
      let all_count = o_count
      element.forEach((store) => {
        all_tax_price = all_tax_price + store.all_tax_price
        all_price = all_price + store.price * store.count
        all_count = all_count + store.count
      })
      let avg_price = parseFloat((all_price / all_count).toFixed(2))
      let avg_tax_price = parseFloat((all_tax_price / all_count).toFixed(2))
      let new_obj = {
        store_id: first_store_copy.store_id,
        num: first_store_copy.num,
        store_name: first_store_copy.store_name,
        all_count,
        avg_price,
        avg_tax_price
      }
      // console.log('new_obj:', new_obj)
      result_list.push(new_obj)
    } else if (element && element.length === 1) {
      const obj = after_group_list_obj[key][0]; ///重复的store,等待整合
      result_list.push(obj)
    }
  }
  let result = { result_list, has_repeated };
  // console.log('result:', result)
  return result
}

/**
 * 撤销入库的物品时，计算数据库中物品的单价和税价
 * @param {*} select_store 
 * @returns 
 */
export function calculPriceAndTaxPriceAndCount(db_store, select_store) {
  let db_price = db_store.oprice; ///数据库中的含税单价 
  let db_tax_price = db_store.tax_price; ///数据库中的去税单价
  let db_count = db_store.count;///db_count 数据中物品的总数量
  let temp_price = select_store.price;///当前准备撤销的物品的含税单价 
  let temp_tax_price = select_store.temp_tax_price;///temp_tax_price 当前准备撤销的物品的去税单价
  let temp_count = select_store.count;///当前准备撤销的物品的数量
  let oprice = parseFloat((((db_price * db_count) - (temp_price * temp_count)) / (db_count - temp_count)).toFixed(2))
  let tax_price = parseFloat((((db_tax_price * db_count) - (temp_tax_price * temp_count)) / (db_count - temp_count)).toFixed(2))
  let result = { oprice: oprice || 0, tax_price: tax_price || 0, count: db_count - temp_count };///计算的结果
  /////////////////////////////
  let sss1 = `(${db_price}*${db_count} - ${temp_price}*${temp_count}) / (${db_count}-${temp_count})=${oprice}`
  let sss2 = `(${db_tax_price}*${db_count} - ${temp_tax_price}*${temp_count}) / (${db_count}-${temp_count})=${tax_price}`
  console.log('含税sss1:', sss1)
  console.log('去税sss2:', sss2)
  return result
}

/**
 * 获取某个物品的入库历史记录
 * @param {*} param0 
 */
export async function getStoreInHistoryRecord({ id }) {
  let res = await HttpApi.getStoreInHistoryRecord({ id })
  if (res.code === 0) {
    return res.data
  }
  return []
}

/**
 * 获取某个物品的出库历史记录
 * @param {*} param0 
 */
export async function getStoreOutHistoryRecord({ id }) {
  let res = await HttpApi.getStoreOutHistoryRecord({ id })
  if (res.code === 0) {
    return res.data
  }
  return []
}

/**
 * 获取某个物品的编辑历史记录
 * @param {*} param0 
 */
export async function getStoreChangeHistoryRecord({ id }) {
  let res = await HttpApi.getStoreChangeHistoryRecord({ id })
  if (res.code === 0) {
    return res.data
  }
  return []
}

export function changeDataStructure({ res_in_list, res_out_list, res_change_list, id }) {
  res_in_list = res_in_list.map((item) => { item.time = item.date; item.type_remark = '采购入库'; item.content_list = JSON.parse(item.content).filter((store_item) => { return store_item.store_id === id }); return item })
  res_out_list = res_out_list.map((item) => { item.time = item.date; item.type_remark = '自行出库'; item.content_list = JSON.parse(item.content).filter((store_item) => { return store_item.store_id === id }); return item })
  res_change_list = res_change_list.map((item) => {
    item.add_content_data = []
    item.remove_content_data = null
    item.origin_content_data = null
    item.change_content_data = null
    if (item.add_content) { item.temp_data = JSON.parse(item.add_content).filter((store_item) => { return store_item.id === id })[0]; item.temp_data.time = item.time; item.temp_data.type_remark = '创建物品' }
    if (item.remove_content) { item.temp_data = JSON.parse(item.remove_content).filter((store_item) => { return store_item.id === id })[0]; item.temp_data.time = item.time; item.temp_data.type_remark = '删除物品' }
    // if (item.origin_content) { item.origin_content_data = JSON.parse(item.origin_content)[0] }
    if (item.change_content) {
      let temp_change_content = JSON.parse(item.change_content).filter((store_item) => { return store_item.id === id })[0];
      let old_count = JSON.parse(item.origin_content).filter((store_item) => { return store_item.id === id })[0].count
      temp_change_content['old_count'] = old_count
      temp_change_content['type_remark'] = '修改物品数量'
      temp_change_content['time'] = item.time;
      item.temp_data = temp_change_content
    }
    return item
  })
  let in_list_store = []
  res_in_list.forEach((oneRecord) => {
    let { time, code_num, content_list, type_remark } = oneRecord
    content_list.forEach((oneStore) => {
      const { count, store_id, store_name } = oneStore;
      in_list_store.push({ id: store_id, name: store_name, time, count, code_num, type_remark })
    })
  })
  let out_list_store = []
  res_out_list.forEach((oneRecord) => {
    let { time, code_num, content_list, type_remark } = oneRecord
    content_list.forEach((oneStore) => {
      const { count, store_id, store_name } = oneStore;
      out_list_store.push({ id: store_id, name: store_name, time, count, code_num, type_remark })
    })
  })

  // console.log('res_in_list:', res_in_list);
  // console.log('res_out_list:', res_out_list);
  // console.log('res_change_list:', res_change_list);
  let change_list_store = res_change_list.map((item) => {
    return item.temp_data
  })
  // console.log('change_list_store:', change_list_store)
  // console.log('in_list_store:', in_list_store);
  // console.log('out_list_store:', out_list_store);
  let all_list_temp = change_list_store.concat(in_list_store).concat(out_list_store)
  let res_list = all_list_temp.sort(function (a, b) { return moment(a.time).toDate().getTime() - moment(b.time).toDate().getTime() });
  return res_list
}