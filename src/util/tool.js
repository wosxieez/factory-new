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
                sum_price = sum_price + store.avg_price
                allStoreList.push({ store, order })
              }
            })
          })
        } else {
          contentJSON.forEach((store) => {
            sum_count = sum_count + store.count
            sum_price = sum_price + store.avg_price * store.count
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