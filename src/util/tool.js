export const getJsonTree = function (data, pId) {
  let itemArr = []
  for (let i = 0; i < data.length; i++) {
    let node = data[i]
    if (node.pId === pId) {
      let newNode = {}
      newNode.selectable = node.allselectable ? true : node.pId > 0 ///不让首层treeSelect元素可选
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
 * 暂时前端根据名称和tids是否存在过滤
 * @export
 * @param {*} tagList 标签数组
 * @param {String} filterName 需要保留的tag name
 */
export function filterTag(tagList, filterName) {
  if (tagList && tagList.length > 0 && filterName) {
    return tagList.filter((item) => {
      if (!item.tids) { return item.name === filterName }
      else { return true }
    })
  } else {
    return tagList
  }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////

export const colorList = [{ label: '薄暮', color: '#f5222d' }, { label: '火山', color: '#fa541c' }, { label: '日暮', color: '#fa8c16' }, { label: '金盏花', color: '#faad14' },
{ label: '日出', color: '#fadb14' }, { label: '青柠', color: '#a0d911' }, { label: '极光绿', color: '#52c41a' }, { label: '明青', color: '#13c2c2' },
{ label: '拂晓蓝', color: '#1890ff' }, { label: '极客蓝', color: '#2f54eb' }, { label: '酱紫', color: '#722ed1' }, { label: '法式洋红', color: '#eb2f96' }]