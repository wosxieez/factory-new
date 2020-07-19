export const getJsonTree = function (data, pId) {
  let itemArr = []
  for (let i = 0; i < data.length; i++) {
    let node = data[i]
    if (node.pId === pId) {
      let newNode = {}
      newNode.selectable = node.pId > 0 ///不让首层treeSelect元素可选
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