import React, { useState, useRef } from 'react'
import { Breadcrumb, Col, Row, Button, List } from 'antd'
import AddFrom from './AddFrom'
import api from '../../http'
import { useEffect } from 'react'
import { useCallback } from 'react'

export default () => {
  const [isAdding, setIsAdding] = useState(false)
  const addForm = useRef()
  const [dataSource, setDataSource] = useState([])
  const [departments, setDepartments] = useState([])

  const listData = useCallback(async () => {
    const response = await api.listDepartment(departments.length > 0 ? departments[departments.length - 1].id : null)
    if (response.code === 0) {
      setDataSource(response.data)
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
    <div style={{ padding: 24 }}>
      <Row type='flex' align='middle'>
        <Col span={16}>
          <Breadcrumb style={{ margin: '16px 0' }}>
            <Breadcrumb.Item>中国节能</Breadcrumb.Item>
            {departments.map(department => (
              <Breadcrumb.Item>{department.name}</Breadcrumb.Item>
            ))}
          </Breadcrumb>
        </Col>
        <Col span={8}>
          <Button style={{ float: 'right' }} onClick={setIsAdding.bind(this, true)}>
            hello
          </Button>
        </Col>
      </Row>
      <List
        dataSource={dataSource}
        renderItem={item => {
          return (
            <List.Item
              onClick={() => {
                const newDepartments = [...departments, item]
                setDepartments(newDepartments)
              }}>
              <List.Item.Meta title={item.name} description={item.remark} />
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
