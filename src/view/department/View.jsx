import React, { useState, useRef } from 'react'
import { Breadcrumb, Col, Row, Button, List, Avatar, Icon, Modal, message, Menu, Dropdown } from 'antd'
import AddForm from './AddForm'
import UpdateForm from './UpdateForm'

import api from '../../http'
import { useEffect, useCallback } from 'react'
const { confirm } = Modal

export default (props) => {
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
      data.dids = data.dids ? [data.dids] : data.dids
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
      <Row type='flex' align='middle'>
        <Col span={18}>
          <Breadcrumb style={styles.breadcrumb}>
            <Breadcrumb.Item>
              <Button
                size='small'
                style={{ padding: 0 }}
                type='link'
                onClick={e => {
                  setDepartments([])
                  props.selectDpt(null);
                }}>
                {localStorage.getItem('cname')}
              </Button>
            </Breadcrumb.Item>
            {departments.map((department, index) => (
              <Breadcrumb.Item key={index}>
                <Button
                  style={{ padding: 0 }}
                  size='small'
                  type='link'
                  onClick={e => {
                    let selectBreadcrumb = departments.slice(0, index + 1);
                    setDepartments(selectBreadcrumb)
                    props.selectDpt(selectBreadcrumb[selectBreadcrumb.length - 1])
                  }}>
                  {department.name}
                </Button>
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>
        </Col>
        <Col span={4}>
          <Button
            style={styles.button}
            size='small'
            type='primary'
            icon={'plus'}
            onClick={setIsAdding.bind(this, true)} />
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
                  props.selectDpt(item);
                }}
                avatar={<Avatar style={styles.avatar}>{item.name}</Avatar>}
                title={item.name}
                description={item.remark}
              />
              <div style={styles.icon_more}>
                <Dropdown
                  overlay={
                    <Menu
                      style={{ width: 120, textAlign: 'center' }}
                      onClick={e => {
                        if (e.key === '2') {
                          deleteDepartment(item)
                        } else {
                          setCurrentItem(item)
                          setIsUpdating(true)
                        }
                      }}>
                      <Menu.Item key='1'>
                        <span style={{ color: '#1890ff' }}><Icon type='edit' />修改</span>
                      </Menu.Item>
                      <Menu.Item key='2'>
                        <span style={{ color: '#f5222d' }}><Icon type='delete' />删除</span>
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
    padding: '12px 24px 12px 24px',
    width: '100%',
    height: '100vh',
    backgroundColor: '#FFFFFF',
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
    marginLeft: 38
  },
  icon_more: {
    width: 70,
    height: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end'
  },
  icon_more2: { fontSize: 18 },
  listItem: {
    cursor: 'pointer'
  },
  breadcrumb: {
    marginTop: 8
  },
  avatar: { backgroundColor: '#1890ff', verticalAlign: 'middle' }
}
