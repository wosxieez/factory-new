import React, { useState, useEffect, useCallback, useRef } from 'react'
import api from '../../http'
import { Table, Modal, Button, Icon, Input, message, Row, Col, Alert, Tooltip, DatePicker, Tag, TreeSelect } from 'antd'
import moment from 'moment'
import AddForm from './AddFrom'
import UpdateForm from './UpdateForm'
import { getJsonTree } from '../../util/tool'
var originStoreList
/**
 * 库品信息表单
 */
export default props => {
  const [treeData, setTreeData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const addForm = useRef()
  const updateForm = useRef()
  const [storeList, setStoreList] = useState([])
  const [currentItem, setCurrentItem] = useState({})
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [selectedRows, setSelectedRows] = useState([])
  const [searchName, setSearchName] = useState('')
  const [searchTags, setSearchTags] = useState([])
  const [searchTime, setSearchTime] = useState([])
  const listAllStore = useCallback(async () => {
    setIsLoading(true)
    setSelectedRowKeys([])
    setSelectedRows([])
    let result = await api.listAllStore()
    if (result.code === 0) {
      originStoreList = result.data
        .map((item, index) => {
          item.key = index
          item.icon = 'plus'
          return item
        })
        .reverse()
      setStoreList(originStoreList)
    }
    let result2 = await api.listAllTag()
    if (result2.code === 0) {
      let treeResult = result2.data.map((item) => { return { id: item.id, pId: item.tids ? item.tids[0] : 0, value: item.id, title: item.name } })
      setTreeData(getJsonTree(treeResult, 0))
    }
    setIsLoading(false)
  }, [])
  useEffect(() => {
    listAllStore()
  }, [props.selectNode, listAllStore])
  const addData = useCallback(
    async data => {
      const response = await api.addStore(data)
      if (response.code === 0) {
        setIsAdding(false)
        listAllStore()
      }
    },
    [listAllStore]
  )
  const updateData = useCallback(
    async data => {
      let result = await api.updateStore({ id: currentItem.id, ...data })
      if (result.code === 0) {
        message.success('修改成功', 3)
        setIsUpdating(false)
        listAllStore()
      }
    },
    [currentItem.id, listAllStore]
  )

  const batchDelete = useCallback(() => {
    Modal.confirm({
      title: `确认要批量删除这${selectedRows.length}条记录吗？`,
      content: '请自行确保所选的信息的准确性',
      okText: '删除',
      okType: 'danger',
      onOk: async function () {
        let idList = selectedRows.map(item => item.id)
        let result = await api.removeStore(idList)
        if (result.code === 0) {
          message.success('删除成功', 4)
        }
        listAllStore()
      },
      onCancel: function () {
        console.log('onCancel')
      }
    })
  }, [selectedRows, listAllStore])

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedRowKeys(selectedRowKeys)
      setSelectedRows(selectedRows)
    }
  }
  const columns = [
    { title: '名称', dataIndex: 'name', width: 120, align: 'center' },
    {
      title: '标签',
      dataIndex: 'tags',
      render: (text, record) => {
        let tagList = []
        if (text && text.length > 0) {
          tagList = text.map((item, index) => (
            <Tag key={index} color={item.color}>
              {item.name}
            </Tag>
          ))
        }
        return <div>{tagList}</div>
      }
    },
    {
      title: '入库时间',
      dataIndex: 'createdAt',
      align: 'center',
      width: 140,
      render: (text, record) => {
        return <div>{text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : ''}</div>
      }
    },
    {
      title: '备注',
      dataIndex: 'remark',
      align: 'center',
      width: 140,
      render: (text, record) => {
        return <div>{text || ''}</div>
      }
    },
    {
      title: '操作',
      dataIndex: 'action',
      width: 80,
      align: 'center',
      render: (text, record) => {
        return (
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <Button
              type='link'
              size='small'
              onClick={() => {
                setCurrentItem(record)
                setIsUpdating(true)
              }}>
              编辑
            </Button>
          </div>
        )
      }
    }
  ]
  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <Row gutter={16} {...rowProps}>
          <Col span={6}>
            <Row {...rowProps}>
              <Col span={4}>名称:</Col>
              <Col span={20}>
                <Input
                  allowClear
                  placeholder={'请输入物品名称'}
                  value={searchName}
                  onChange={e => {
                    setSearchName(e.target.value)
                  }}
                />
              </Col>
            </Row>
          </Col>
          <Col span={6}>
            <Row {...rowProps}>
              <Col span={4}>标签:</Col>
              <Col span={20}>
                <TreeSelect
                  allowClear
                  multiple
                  treeNodeFilterProp='title'
                  showSearch
                  treeData={treeData}
                  style={{ width: '100%' }}
                  dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                  placeholder='请选择标签-支持搜索'
                  showCheckedStrategy={TreeSelect.SHOW_PARENT}
                  value={searchTags}
                  onChange={v => {
                    setSearchTags(v)
                  }}
                />
              </Col>
            </Row>
          </Col>
          <Col span={8}>
            <Row {...rowProps}>
              <Col span={6}>入库时间:</Col>
              <Col span={18}>
                <DatePicker.RangePicker
                  value={searchTime}
                  ranges={{
                    今日: [moment(), moment()],
                    本月: [moment().startOf('month'), moment().endOf('month')]
                  }}
                  onChange={t => {
                    setSearchTime(t)
                  }}
                />
              </Col>
            </Row>
          </Col>
          <Col span={4}>
            <div style={styles.headerCell}>
              <Button
                type='primary'
                style={styles.button}
                onClick={() => {
                  console.log(searchTime, searchTags, searchName)
                }}>
                查询
              </Button>
              <Button
                style={styles.button}
                onClick={() => {
                  setSearchName('')
                  setSearchTags([])
                  setSearchTime([])
                }}>
                重置
              </Button>
            </div>
          </Col>
        </Row>
      </div>
      <div style={styles.body}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h3>物料管理</h3>
          <div>
            {selectedRowKeys.length === 0 ? (
              <Button
                style={styles.button}
                type='primary'
                icon={'plus'}
                onClick={() => {
                  setIsAdding(true)
                }}>
                新增
              </Button>
            ) : (
                <Button style={styles.button} type='danger' onClick={batchDelete}>
                  批量删除
              </Button>
              )}
            <Tooltip title='刷新'>
              <Icon
                style={styles.button}
                type='reload'
                onClick={() => {
                  listAllStore()
                }}
              />
            </Tooltip>
          </div>
        </div>
        <Alert
          style={styles.marginTop}
          message={
            <span style={styles.alertMessage}>
              <span>
                已选择 <span style={{ color: '#1890ff', fontWeight: 800 }}>{selectedRowKeys.length}</span> 项
              </span>
              <Button
                type='link'
                size='small'
                onClick={() => {
                  setSelectedRowKeys([])
                  setSelectedRows([])
                }}>
                清空
              </Button>
            </span>
          }
          type='info'
          showIcon
        />
        <Table
          loading={isLoading}
          style={styles.marginTop}
          rowSelection={rowSelection}
          size='small'
          bordered
          columns={columns}
          dataSource={storeList}
          pagination={{
            total: storeList.length,
            showTotal: () => {
              return <div>共{storeList.length}条记录</div>
            },
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ['10', '50', '100']
          }}
        />
        <AddForm
          ref={addForm}
          title='新增物品'
          visible={isAdding}
          onCancel={() => {
            addForm.current.resetFields()
            setIsAdding(false)
          }}
          onOk={() => {
            addForm.current.validateFields(async (error, data) => {
              if (!error) {
                addData(data)
                addForm.current.resetFields()
              }
            })
          }}
        />
        <UpdateForm
          data={currentItem}
          ref={updateForm}
          title='修改物品'
          visible={isUpdating}
          onCancel={() => {
            updateForm.current.resetFields()
            setIsUpdating(false)
          }}
          onOk={() => {
            updateForm.current.validateFields(async (error, data) => {
              if (!error) updateData(data)
            })
          }}
        />
      </div>
    </div>
  )
}
const styles = {
  root: {
    backgroundColor: '#F1F2F5',
    width: '100%',
    height: '100vh'
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    display: 'none'
  },
  marginTop: { marginTop: 10 },
  headerCell: {
    display: 'flex',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    height: 40
  },
  body: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    // marginTop: 16
  },
  button: {
    marginLeft: 10
  },
  alertMessage: {
    display: 'flex',
    justifyContent: 'space-between'
  }
}
const rowProps = {
  type: 'flex',
  justify: 'space-around',
  align: 'middle'
}
