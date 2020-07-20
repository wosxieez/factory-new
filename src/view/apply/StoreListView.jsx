import React, { useState } from 'react'
import { Breadcrumb, List, Avatar, Tag, message, Button, Input } from 'antd'
import api from '../../http'
import { useEffect, useCallback } from 'react'
import { filterTag } from '../../util/tool';
const { Search } = Input;

export default props => {
  const [dataSource, setDataSource] = useState([])
  const [Stores, setStores] = useState([])
  const [listIsLoading, setListIsLoading] = useState(false)
  const [searchKey, setSearchKey] = useState('')
  const listData = useCallback(async () => {
    setListIsLoading(true)
    const response_store = await api.listStore({ tid: Stores.length > 0 ? Stores[Stores.length - 1].id : null })
    const response_tag = await api.listTag(Stores.length > 0 ? Stores[Stores.length - 1].id : null)
    response_tag.data = filterTag(response_tag.data, 0)
    response_store.data = response_store.data.map(item => {
      item.type = 'store'
      return item
    })
    response_tag.data = response_tag.data.map(item => {
      item.type = 'tag'
      return item
    })
    ///查询现有的 那些处于待审核 和 审核中的 申请。得到对应的物品的id 和 count -- 对现有的store 数据进行相减
    const response_order = await api.query(
      `select * from orders where isdelete = 0 and status in (0,1) and type_id = 1`
    )
    if (response_order.code === 0 && response_order.data[0].length > 0) {
      let orderList = response_order.data[0]
      // console.log('申请列表数据:', orderList)
      orderList.forEach(order => {
        let contentList = JSON.parse(order.content)
        // console.log('contentList:', contentList)
        contentList.forEach(item => {
          response_store.data.forEach(store => {
            if (item.store_id === store.id) {
              store.count = store.count - item.count
            }
          })
        })
      })
    }
    setDataSource([...response_tag.data, ...response_store.data])
    setListIsLoading(false)
    // console.log('store 数据:', response_store.data)
    // console.log('tag 数据:', response_tag.data)
  }, [Stores])

  useEffect(() => {
    listData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Stores])

  return (
    <div style={styles.root}>
      <Search placeholder="物品名称或备注模糊查询" allowClear onSearch={async (value) => {
        if (value) {
          let result = await api.listStore({ key: value })
          if (result.code === 0) {
            setSearchKey(value)
            setDataSource(result.data.map((item, index) => { item.type = 'store'; return item }))
          }
        } else {
          setSearchKey('')
          listData()
        }
      }} enterButton />
      {searchKey ? null :
        <Breadcrumb style={styles.breadcrumb}>
          <Breadcrumb.Item>
            <Button
              style={{ padding: 0 }}
              type='link'
              onClick={e => {
                setStores([])
              }}>
              中国节能
              </Button>
          </Breadcrumb.Item>
          {Stores.map((User, index) => (
            <Breadcrumb.Item key={index}>
              <Button
                style={{ padding: 0 }}
                type='link'
                onClick={() => {
                  setStores(Stores.slice(0, index + 1))
                }}>
                {User.name}
              </Button>
            </Breadcrumb.Item>
          ))}
        </Breadcrumb>
      }
      <List
        loading={listIsLoading}
        dataSource={dataSource}
        renderItem={item => {
          return (
            <List.Item
              style={styles.listItem}
              extra={item.type === 'store' ? <Tag color={'blue'}>可用: {item.count}</Tag> : null}>
              <List.Item.Meta
                onClick={() => {
                  if (item.type === 'tag') {
                    const newStores = [...Stores, item]
                    setStores(newStores)
                  } else if (item.type === 'store') {
                    if (props.isReture) {
                      ///当是 退料表时，不用考虑库存可用是否为0
                      props.selectStore(item)
                    } else {
                      if (item.count > 0) {
                        props.selectStore(item)
                      } else {
                        message.error('可用为空-无法申领', 3)
                      }
                    }
                  }
                }}
                avatar={
                  item.type === 'store' ? (
                    <Avatar icon='code-sandbox' />
                  ) : (
                      <Avatar style={styles.avatar}>{item.name}</Avatar>
                    )
                }
                title={item.name}
                description={item.remark}
              />
            </List.Item>
          )
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
