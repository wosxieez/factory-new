import React, { useState, useRef } from 'react'
import { Breadcrumb, Col, Row, Button, List, Avatar, Icon, Modal, message, Menu, Dropdown } from 'antd'
import api from '../../http'
import { useEffect, useCallback } from 'react'
import AddForm from './AddFrom'
import UpdateForm from './UpdateForm'
import { filterTag, userinfo } from '../../util/Tool';
const { confirm } = Modal

export default (props) => {
  const [isAdding, setIsAdding] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const addForm = useRef()
  const updateForm = useRef()

  const [dataSource, setDataSource] = useState([])
  const [Tags, setTags] = useState([])
  const [listIsLoading, setListIsLoading] = useState(false)
  const [currentItem, setCurrentItem] = useState({})
  const [isStorehouseManager] = useState(userinfo().permission && userinfo().permission.indexOf('5') !== -1)

  const listData = useCallback(async () => {
    setListIsLoading(true)
    const response = await api.listTag(Tags.length > 0 ? Tags[Tags.length - 1].id : null)
    if (response.code === 0) {
      response.data = filterTag(response.data, props.type)
      setDataSource(response.data)
      setListIsLoading(false)
    }
  }, [Tags, props.type])

  const addData = useCallback(
    async data => {
      if (Tags.length > 0) data.tid = Tags[Tags.length - 1].id
      const response = await api.addTag({ ...data, type: props.type })
      if (response.code === 0) {
        setIsAdding(false)
        listData()
      }
    },
    [Tags, listData, props.type])

  const deleteTag = useCallback(
    item => {
      confirm({
        title: `确定删除【${item.name}】吗？`,
        content: '请慎重选择',
        okText: '删除',
        okType: 'danger',
        cancelText: '取消',
        onOk: async () => {
          let result = await api.removeTag(item.id)
          if (result.code === 0) {
            message.success('删除成功', 3)
            listData(Tags)
          }
        },
        onCancel() {
          console.log('Cancel')
        }
      })
    },
    [Tags, listData]
  )

  const updateData = useCallback(
    async data => {
      data.tids = data.tids ? [data.tids] : data.tids
      let result = await api.updateTag({ id: currentItem.id, ...data })
      if (result.code === 0) {
        message.success('修改成功', 3)
        setIsUpdating(false)
        listData(Tags)
      }
    },
    [currentItem.id, Tags, listData]
  )

  useEffect(() => {
    listData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Tags])

  return (
    <div style={styles.root}>
      <Row type='flex' align='middle'>
        <Col span={22}>
          <Breadcrumb style={styles.breadcrumb}>
            <Breadcrumb.Item>
              <Button
                style={{ padding: 0 }}
                type='link'
                onClick={e => {
                  setTags([])
                }}>
                物料属性
              </Button>
            </Breadcrumb.Item>
            {Tags.map((Tag, index) => (
              <Breadcrumb.Item key={index}>
                <Button
                  style={{ padding: 0 }}
                  type='link'
                  onClick={e => {
                    setTags(Tags.slice(0, index + 1))
                  }}>
                  {Tag.name}
                </Button>
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>
        </Col>
        <Col span={2} style={{ textAlign: 'right' }}>
          {isStorehouseManager ?
            <Button
              style={styles.button}
              size='small'
              type='primary'
              icon={'plus'}
              onClick={setIsAdding.bind(this, true)}>新增</Button> : null}
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
                  const newTags = [...Tags, item]
                  setTags(newTags)
                }}
                avatar={<Avatar style={{ ...styles.avatar, backgroundColor: item.color }}>{item.name}</Avatar>}
                title={item.name}
                description={item.remark}
              />
              {isStorehouseManager ?
                <div style={styles.icon_more}>
                  <Dropdown
                    overlay={
                      <Menu
                        style={{ width: 120, textAlign: 'center' }}
                        onClick={e => {
                          if (e.key === '2') {
                            deleteTag(item)
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
                </div> : null}
            </List.Item>
          )
        }}
      />
      <AddForm
        data={currentItem}
        ref={addForm}
        title='新增标签'
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
        title='修改标签'
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
    marginLeft: 10
  },
  icon_more: {
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
  avatar: { verticalAlign: 'middle' }
}
