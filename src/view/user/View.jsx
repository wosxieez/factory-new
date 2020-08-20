import React, { useState, useRef } from 'react'
import { Button, Icon, Modal, message, Tag, Table, Tooltip } from 'antd'

import api from '../../http'
import { useEffect, useCallback } from 'react'
import AddForm from './AddFrom'
import UpdateForm from './UpdateForm'

export default (props) => {
  const [isAdding, setIsAdding] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const addForm = useRef()
  const updateForm = useRef()
  const [dataSource, setDataSource] = useState([])
  const [listIsLoading, setListIsLoading] = useState(false)
  const [currentItem, setCurrentItem] = useState({})///当前选中的人员
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [selectedRows, setSelectedRows] = useState([])

  const listData = useCallback(async () => {
    setListIsLoading(true)
    let dptid = null
    if (props.selectdpt) {
      dptid = props.selectdpt.id
    }
    let response;
    if (dptid) {
      response = await api.listUser(dptid)
    } else {
      response = await api.listAllUser()
    }
    if (response.code === 0) {
      let temp = response.data.map((item, index) => { item.key = index; return item });
      setDataSource(temp)
      setListIsLoading(false)
    }
  }, [props.selectdpt])

  const addData = useCallback(
    async data => {
      const response = await api.addUser(data)
      if (response.code === 0) {
        message.success('添加成功', 3)
        setIsAdding(false)
        listData()
      }
    },
    [listData]
  )
  const updateData = useCallback(
    async data => {
      let result = await api.updateUser({ id: currentItem.id, ...data })
      if (result.code === 0) {
        message.success('修改成功', 3)
        setIsUpdating(false)
        listData()
      }
    },
    [currentItem.id, listData]
  )

  const batchDelete = useCallback(() => {
    Modal.confirm({
      title: `确认要批量删除这${selectedRows.length}条记录吗？`,
      content: '请自行确保所选的信息的准确性',
      okText: '删除',
      okType: 'danger',
      onOk: async function () {
        let idList = selectedRows.map(item => item.id)
        let result = await api.removeUser(idList)
        if (result.code === 0) {
          message.success('删除成功', 4)
        }
        listData();
      },
    })
  }, [selectedRows, listData])

  useEffect(() => {
    listData()
  }, [props.selectdpt, listData])

  const columns = [
    { title: '名称', dataIndex: 'name', width: 120 },
    {
      title: '部门', dataIndex: 'departments', render: (text) => {
        return <div>{(text || []).map((item, index) => { return <Tag key={index}>{item.name}</Tag> })}</div>
      }
    },
    {
      title: '标签', dataIndex: 'tags', render: (text) => {
        return <div>{(text || []).map((item, index) => { return <Tag key={index} color={item.color}>{item.name}</Tag> })}</div>
      }
    },
    {
      title: '操作', dataIndex: 'action', width: 100, align: 'center', render: (_, record) => {
        return <Button size='small' type='link' icon='edit' onClick={() => {
          setCurrentItem(record);
          setIsUpdating(true);
        }}>修改</Button>
      }
    },
  ]
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedRowKeys(selectedRowKeys)
      setSelectedRows(selectedRows)
    }
  }
  return (
    <div style={styles.root}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h3 style={{ marginTop: 2 }}>员工列表</h3>
        <div>
          {selectedRowKeys.length === 0 ? (
            <Button
              size='small'
              style={styles.button}
              type='primary'
              icon={'plus'}
              onClick={() => {
                setIsAdding(true)
              }}>
              新增
              </Button>
          ) : (
              <Button size='small' style={styles.button} type='danger' onClick={batchDelete}>
                批量删除
              </Button>
            )}
          <Tooltip title='刷新'>
            <Icon
              style={styles.button}
              type='reload'
              onClick={() => {
                listData();
              }}
            />
          </Tooltip>
        </div>
      </div>
      <Table loading={listIsLoading} style={styles.marginTop} columns={columns} bordered dataSource={dataSource} rowSelection={rowSelection} />
      <AddForm
        currentDpt={props.selectdpt}
        ref={addForm}
        title='新增员工'
        visible={isAdding}
        onCancel={() => {
          addForm.current.resetFields()
          setIsAdding(false)
        }}
        onOk={() => {
          addForm.current.validateFields(async (error, data) => {
            if (!error) {
              delete data.confirm_password
              addData(data)
              addForm.current.resetFields()
            }
          })
        }}
      />
      <UpdateForm
        data={currentItem}
        ref={updateForm}
        title='修改员工'
        visible={isUpdating}
        onCancel={() => {
          updateForm.current.resetFields()
          setIsUpdating(false)
        }}
        onOk={() => {
          updateForm.current.validateFields(async (error, data) => {
            if (!error) {
              delete data.confirm_password
              updateData(data)
            }
          })
        }}
      />
    </div>
  )
}

const styles = {
  root: {
    padding: '12px 24px 12px 24px',
    width: '100%',
    height: '100vh',
    backgroundColor: '#FFFFFF',
  },
  title: {
    marginLeft: 10,
    fontSize: 15
  },
  header: {
    borderBottomStyle: 'solid',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    height: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  button: {
    marginLeft: 10, marginTop: 4
  },
  icon_more: {
    // backgroundColor: 'red',
    width: 70,
    height: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  icon_more2: { fontSize: 18 },
  breadcrumb: {
    marginTop: 8
  },
  listItem: {
    cursor: 'pointer'
  },
  avatar: { backgroundColor: '#1890ff', verticalAlign: 'middle' },
  marginTop: {
    marginTop: 10
  }
}
