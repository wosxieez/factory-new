import React, { useState, useRef } from 'react'
import { Breadcrumb, Col, Row, Button, List, Avatar, Icon } from 'antd'
import AddFrom from './AddFrom'
import api from '../../http'
import { useEffect, useCallback } from 'react'


export default () => {
  const [isAdding, setIsAdding] = useState(false)
  const addForm = useRef()
  const [dataSource, setDataSource] = useState([])
  const [departments, setDepartments] = useState([])
  const [listIsLoading, setListIsLoading] = useState(false)

  const listData = useCallback(async () => {
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

  useEffect(() => {
    listData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departments])

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <div>
          <Avatar style={styles.avatar} icon={<Icon type="apartment" />} />
          <span style={styles.title}>中国节能</span>
        </div>
        <Button type='primary' icon={'plus'} onClick={setIsAdding.bind(this, true)}>添加部门</Button>
      </div>
      <Row type='flex' align='middle'>
        <Col span={16}>
          <Breadcrumb style={styles.breadcrumb}>
            <Breadcrumb.Item><a onClick={(e) => { setDepartments([]) }}>中国节能</a></Breadcrumb.Item>
            {departments.map((department, index) => (
              <Breadcrumb.Item key={index}><a onClick={(e) => { setDepartments(departments.slice(0, index + 1)) }}>{department.name}</a></Breadcrumb.Item>
            ))}
          </Breadcrumb>
        </Col>
      </Row>
      <List
        loading={listIsLoading}
        dataSource={dataSource}
        renderItem={item => {
          return (
            <List.Item
              style={styles.listItem}
              onClick={() => {
                setListIsLoading(true)
                const newDepartments = [...departments, item]
                setDepartments(newDepartments)
              }}>

              <List.Item.Meta
                avatar={<Avatar style={styles.avatar} >{item.name}</Avatar>}
                title={item.name} description={item.remark} />
            </List.Item>
          )
        }}
      />
      <AddFrom
        ref={addForm}
        title='新增部门'
        visible={isAdding}
        onCancel={setIsAdding.bind(this, false)}
        onOk={() => {
          addForm.current.validateFields(async (error, data) => {
            if (!error) addData(data)
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
    fontSize: 15,
  },
  header: {
    borderBottomStyle: 'solid', borderBottomWidth: 1, borderBottomColor: '#e8e8e8',
    height: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: 'space-between'
  },
  breadcrumb: {
    marginTop: 8
  },
  listItem: {
    cursor: 'pointer'
  },
  avatar: { backgroundColor: '#1890ff', verticalAlign: 'middle' }
}

