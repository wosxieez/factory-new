import React, { useState, useRef } from 'react'
import { Breadcrumb, Col, Row, Button, List, Avatar, Icon, Modal, message, Menu, Dropdown } from 'antd'
import AddForm from './AddForm'
import UpdateForm from './UpdateForm'

import api from '../../http'
import { useEffect, useCallback } from 'react'
const { confirm } = Modal

export default () => {
  const [isAdding, setIsAdding] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const addForm = useRef()
  const updateForm = useRef()

  const [dataSource, setDataSource] = useState([])
  const [departments, setDepartments] = useState([])
  const [listIsLoading, setListIsLoading] = useState(false)
  const [currentItem, setCurrentItem] = useState({})

  const listData = useCallback(async () => {
    setListIsLoading(true)
    const response = await api.listDepartment(departments.length > 0 ? departments[departments.length - 1].id : null)
    if (response.code === 0) {
      setDataSource(response.data)
      setListIsLoading(false)
    }
  }, [departments])

  const addData = useCallback(
    async data => {
      if (departments.length > 0) data.did = departments[departments.length - 1].id
      const response = await api.addDepartment(data)
      if (response.code === 0) {
        setIsAdding(false)
        listData()
      }
    },
    [departments, listData]
  )

  const deleteDepartment = useCallback(
    item => {
      confirm({
        title: `确定删除【${item.name}】吗？`,
        content: '请慎重选择',
        okText: '删除',
        okType: 'danger',
        cancelText: '取消',
        onOk: async () => {
          let result = await api.removeDepartment(item.id)
          if (result.code === 0) {
            message.success('删除成功', 3)
            listData(departments)
          }
        },
        onCancel() {
          console.log('Cancel')
        }
      })
    },
    [departments, listData]
  )

  const updateData = useCallback(
    async data => {
      let result = await api.updateDepartment({ id: currentItem.id, ...data })
      if (result.code === 0) {
        message.success('修改成功', 3)
        setIsUpdating(false)
        listData(departments)
      }
    },
    [currentItem.id, departments, listData]
  )

  useEffect(() => {
    listData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departments])

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <div>
          <Avatar style={styles.avatar} icon={<Icon type='apartment' />} />
          <span style={styles.title}>中国节能</span>
        </div>
        <div>
          <Button style={styles.button} type='primary' icon={'plus'} onClick={setIsAdding.bind(this, true)}></Button>
        </div>
      </div>
      <Row type='flex' align='middle'>
        <Col span={16}>
          <Breadcrumb style={styles.breadcrumb}>
            <Breadcrumb.Item>
              <a
                onClick={e => {
                  setDepartments([])
                }}>
                中国节能
              </a>
            </Breadcrumb.Item>
            {departments.map((department, index) => (
              <Breadcrumb.Item key={index}>
                <a
                  onClick={e => {
                    setDepartments(departments.slice(0, index + 1))
                  }}>
                  {department.name}
                </a>
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>
        </Col>
      </Row>
      <List
        loading={listIsLoading}
        dataSource={dataSource}
        renderItem={item => {
          return (
            <List.Item style={styles.listItem}>
              <List.Item.Meta
                onClick={() => {
                  const newDepartments = [...departments, item]
                  setDepartments(newDepartments)
                }}
                avatar={<Avatar style={styles.avatar}>{item.name}</Avatar>}
                title={item.name}
                description={item.remark}
              />
              <div style={styles.icon_more}>
                <Dropdown
                  overlay={
                    <Menu
                      style={{ padding: 10 }}
                      onClick={e => {
                        if (e.key === '2') {
                          deleteDepartment(item)
                        } else {
                          setCurrentItem(item)
                          setIsUpdating(true)
                        }
                      }}>
                      <Menu.Item key='1'>
                        <span style={{ color: '#1890ff' }}>
                          <Icon type='edit' />
                          修改
                        </span>
                      </Menu.Item>
                      <Menu.Divider />
                      <Menu.Item key='2'>
                        <span style={{ color: '#f5222d' }}>
                          <Icon type='delete' />
                          删除
                        </span>
                      </Menu.Item>
                    </Menu>
                  }
                  placement='bottomRight'
                  trigger={['click']}>
                  <Icon type='more' style={styles.icon_more2} />
                </Dropdown>
              </div>
            </List.Item>
          )
        }}
      />
      <AddForm
        ref={addForm}
        title='新增部门'
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
        title='修改部门'
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
  )
}

const styles = {
  root: {
    padding: '0 24px 0 24px'
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
    marginLeft: 10
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
  avatar: { backgroundColor: '#1890ff', verticalAlign: 'middle' }
}
