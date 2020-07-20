import React, { useState, useRef } from 'react'
import { Breadcrumb, Col, Row, Button, List, Avatar, Icon, Modal, message, Menu, Dropdown, Tag } from 'antd'

import api from '../../http'
import { useEffect, useCallback } from 'react'
import AddForm from './AddFrom'
import UpdateForm from './UpdateForm'
const { confirm } = Modal

export default () => {
  const [isAdding, setIsAdding] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const addForm = useRef()
  const updateForm = useRef()

  const [dataSource, setDataSource] = useState([])
  const [Users, setUsers] = useState([])
  const [listIsLoading, setListIsLoading] = useState(false)
  const [currentItem, setCurrentItem] = useState({})

  const listData = useCallback(async () => {
    setListIsLoading(true)
    const response = await api.listUser(Users.length > 0 ? Users[Users.length - 1].id : null)
    const response_dpt = await api.listDepartment(Users.length > 0 ? Users[Users.length - 1].id : null)
    response.data = response.data.map(item => {
      item.type = 'user'
      return item
    })
    response_dpt.data = response_dpt.data.map(item => {
      item.type = 'department'
      return item
    })
    if (response.code === 0) {
      setDataSource([...response_dpt.data, ...response.data])
      setListIsLoading(false)
    }
  }, [Users])

  const addData = useCallback(
    async data => {
      if (Users.length > 0) data.did = Users[Users.length - 1].id
      const response = await api.addUser(data)
      if (response.code === 0) {
        setIsAdding(false)
        listData()
      }
    },
    [Users, listData]
  )

  const deleteUser = useCallback(
    item => {
      confirm({
        title: `确定删除【${item.name}】吗？`,
        content: '请慎重选择',
        okText: '删除',
        okType: 'danger',
        cancelText: '取消',
        onOk: async () => {
          let result = await api.removeUser(item.id)
          if (result.code === 0) {
            message.success('删除成功', 3)
            listData(Users)
          }
        },
        onCancel() {
          console.log('Cancel')
        }
      })
    },
    [Users, listData]
  )

  const updateData = useCallback(
    async data => {
      let result = await api.updateUser({ id: currentItem.id, ...data })
      if (result.code === 0) {
        message.success('修改成功', 3)
        setIsUpdating(false)
        listData(Users)
      }
    },
    [currentItem.id, Users, listData]
  )

  useEffect(() => {
    listData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Users])

  return (
    <div style={styles.root}>
      <Row type='flex' align='middle'>
        <Col span={16}>
          <Breadcrumb style={styles.breadcrumb}>
            <Breadcrumb.Item>
              <Button
                type='link'
                onClick={e => {
                  setUsers([])
                }}>
                {localStorage.getItem('cname')}
              </Button>
            </Breadcrumb.Item>
            {Users.map((User, index) => (
              <Breadcrumb.Item key={index}>
                <Button
                  type='link'
                  onClick={e => {
                    setUsers(Users.slice(0, index + 1))
                  }}>
                  {User.name}
                </Button>
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>
        </Col>
        <Col span={8} style={{ textAlign: 'right' }}>
          <Button
            style={styles.button}
            size='small'
            type='primary'
            icon={'plus'}
            onClick={setIsAdding.bind(this, true)}>新增</Button>
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
                  if (item.type === 'department') {
                    const newUsers = [...Users, item]
                    setUsers(newUsers)
                  }
                }}
                avatar={
                  item.type === 'user' ? (
                    <Avatar icon="user" />
                  ) : (
                      <Avatar style={styles.avatar}>{item.name}</Avatar>
                    )
                }
                title={item.name}
                description={item.remark}
              />
              {item.type === 'user' && item.tags ? <div>{item.tags.map((item, index) => { return <div key={index}><Tag color={item.color || 'blue'}>{item.name}</Tag></div> })}</div> : null}
              {item.type === 'user' ? (
                <div style={styles.icon_more}>
                  <Dropdown
                    overlay={
                      <Menu
                        style={{ width: 120, textAlign: 'center' }}
                        onClick={e => {
                          if (e.key === '2') {
                            deleteUser(item)
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
              ) : null}
            </List.Item>
          )
        }}
      />
      <AddForm
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
    height: '100%',
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
