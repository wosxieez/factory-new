import React, { useState, useEffect, useCallback, useRef } from 'react'
import api from '../../http'
import { Table, Modal, Button, Input, message, Row, Col, Alert, DatePicker, Tag, TreeSelect, Form, Badge } from 'antd'
import moment from 'moment'
import AddForm from './AddFrom'
import UpdateForm from './UpdateForm'
import { getJsonTree, filterTag } from '../../util/Tool'
import { userinfo } from '../../util/Tool';
import HttpApi from '../../http/HttpApi'
import AddFromRFID from './AddFromRFID'
import UpdateFormRFID from './UpdateFormRFID'
const FORMAT = 'YYYY-MM-DD HH:mm:ss';
var originStoreList
var rfidList = [];
// const tooltipTxt = '小件如螺丝等不需要rfid标签的物品直接填写数量；标签物品如电脑等需要绑定rfid标签'
/**
 * 库品信息表单
 */
export default props => {
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isAddingRFID, setIsAddingRFID] = useState(false)
  const [isUpdatingRFID, setIsUpdatingRFID] = useState(false)
  const addForm = useRef()
  const addFormRFID = useRef()
  const updateForm = useRef()
  const updateFormRFID = useRef()
  const [storeList, setStoreList] = useState([])
  const [currentItem, setCurrentItem] = useState({})
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [selectedRows, setSelectedRows] = useState([])
  const [isStorehouseManager] = useState(userinfo().permission && userinfo().permission.split(',').indexOf('5') !== -1)
  const listAllStore = useCallback(async () => {
    setIsLoading(true)
    setSelectedRowKeys([])
    setSelectedRows([])
    ///获取所有rfid。【理解为贴有rfid的标签物品】对应的store。就表示该标签物品的类型。如store 电脑 ; rfid 戴尔01 ...
    let res_rfid = await HttpApi.getRfidList({ hasBinded: true });
    if (res_rfid.length > 0) { rfidList = res_rfid }
    ///获取所有store
    let result = await api.listAllStore()
    if (result.code === 0) {
      originStoreList = result.data.map((item, index) => { item.key = index; return item }).reverse()
      originStoreList.forEach((store) => {
        store.subList = [];
        rfidList.forEach((storeSub) => {
          if (store.id === storeSub.store_id) { store.subList.push(storeSub) }
        })
      })
      // console.log('originStoreList:', originStoreList)
      setStoreList(originStoreList)
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
        if (data['has_rfid'] === 1) {
          ///如果是标签物品，要拿到返回结果。id，作为rfid的store_id参数进行更新。
          const store_id = response.data.id
          const rfids = data['rfids']
          let res_bind = await HttpApi.bindRfidToStore({ rfids, store_id })
          if (res_bind) { setIsAddingRFID(false); listAllStore(); message.success('添加成功') }
          else { message.error('添加失败1') }
        } else {
          setIsAdding(false)
          listAllStore()
          message.success('添加成功')
        }
      } else { message.error('添加失败2') }
    },
    [listAllStore]
  )
  const updateData = useCallback(
    async data => {
      let result = await api.updateStore({ id: currentItem.id, ...data })
      if (result.code === 0) {
        if (data['has_rfid'] === 1) {
          ///如果是标签物品，要根据物品的id，作为rfid的store_id参数进行更新。条件范围是data.rfids 数组
          const store_id = currentItem.id
          const rfids = data['rfids']
          let res_clean = await HttpApi.unbindRfidToStore({ store_id })
          if (!res_clean) { message.error('更新失败3') }
          if (rfids.length > 0) {
            let res_bind = await HttpApi.bindRfidToStore({ rfids, store_id })
            if (res_bind) { setIsUpdatingRFID(false); listAllStore(); message.success('更新成功') }
            else { message.error('更新失败4') }
          } else {
            message.success('更新成功')
            setIsUpdatingRFID(false);
            listAllStore();
          }
        } else {
          message.success('修改成功', 3)
          setIsUpdating(false)
          listAllStore()
        }
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
    // { title: '编号', dataIndex: 'no', width: 120, align: 'center' },
    {
      title: '种类名称', dataIndex: 'name', width: 120, render: (text, record) => {
        if (record['has_rfid']) return <Badge color="#f50" text={text} />
        return text
      }
    },
    {
      title: '属性',
      dataIndex: 'tags',
      render: (text) => {
        let tagList = []
        if (text && text.length > 0) {
          tagList = text.map((item, index) => (
            <Tag key={index} color={item.color}>
              {item.name}
            </Tag>
          ))
        }
        if (!text) { return '-' }
        return <div>{tagList}</div>
      }
    },
    {
      title: '货架标签',
      dataIndex: 'nfc_shelf',
      key: 'nfc_shelf_name',
      render: (text) => {
        // console.log('text:', text)
        ///后台listAllStore接口模型需要添加nfc_shelfs的字段 num 编号
        if (text) {
          return <Tag color='blue'>
            {/* {text.num}--{text.name} */}
            {text.name}
          </Tag>
        }
        return <div>-</div>
      }
    },
    // {
    //   title: '编号',
    //   dataIndex: 'nfc_shelf',
    //   key: 'nfc_shelf_num',
    //   render: (text) => {
    //     console.log('text:', text)
    //     if (text) {
    //       return <Tag color='blue'>
    //         {text.num}
    //       </Tag>
    //     }
    //     return <div>-</div>
    //   }
    // },
    {
      title: '数量',
      dataIndex: 'count',
      align: 'center',
      width: 100,
      render: (text, record) => {
        let unit = record.unit ? record.unit : '个'
        return <div>{text + ' ' + unit || ''}</div>
      }
    },
    {
      title: '明细',
      dataIndex: 'subList',
      width: 100,
      render: (text, record) => {
        if (text && text.length > 0) {
          return text.map((item, index) => { return <Tag color='tomato' key={index}>{item.name}</Tag> })
        }
        return <div>{'-'}</div>
      }
    },
    {
      title: '参考单价【元】',
      dataIndex: 'oprice',
      align: 'center',
      width: 120,
      render: (text) => {
        return <div>{text}</div>
      }
    },
    {
      title: '入库时间',
      dataIndex: 'createdAt',
      align: 'center',
      width: 140,
      render: (text) => {
        return <div>{text ? moment(text).format(FORMAT) : ''}</div>
      }
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 140,
      render: (text) => {
        return <div>{text || '-'}</div>
      }
    },
    {
      title: '操作',
      dataIndex: 'action',
      width: 80,
      align: 'center',
      render: (_, record) => {
        return (
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <Button
              type='link'
              size='small'
              icon='form'
              onClick={() => {
                setCurrentItem(record)
                if (record['has_rfid']) { setIsUpdatingRFID(true); return }
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
        <Searchfrom startSearch={async (conditionsValue) => {
          // console.log('conditionsValue:', conditionsValue)
          setIsLoading(true)
          let result = []
          if (JSON.stringify(conditionsValue) === '{}') {
            result = await api.listAllStore()
            // console.log('result123:', result)
          } else {
            result = await api.listStore(conditionsValue)
            // console.log('result456:', result)
          }
          if (result.code === 0) {
            let tempList = result.data.map((item, index) => { item.key = index; return item }).reverse()
            tempList.forEach((store) => {
              store.subList = [];
              rfidList.forEach((storeSub) => {
                if (store.id === storeSub.store_id) { store.subList.push(storeSub) }
              })
            })
            setStoreList(tempList)
          }
          setIsLoading(false)
        }} />
      </div>
      <div style={styles.body}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h3>物料管理</h3>
          <div>
            {isStorehouseManager ? (selectedRowKeys.length === 0 ? (
              <>
                {/* <Tooltip title={tooltipTxt}>
                  <Icon type="question-circle" />
                </Tooltip> */}
                <Button
                  style={styles.button}
                  type='primary'
                  icon={'plus'}
                  onClick={() => {
                    setIsAdding(true)
                  }}>
                  普通物品
              </Button>
                <Button
                  style={styles.button}
                  type='danger'
                  icon={'plus'}
                  onClick={() => {
                    setIsAddingRFID(true)
                  }}>
                  标签物品
            </Button>
              </>
            ) : (
                <Button style={styles.button} type='danger' onClick={batchDelete}>
                  批量删除
                </Button>
              )) : null}
          </div>
        </div>
        {isStorehouseManager ?
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
          /> : null}
        <Table
          loading={isLoading}
          style={styles.marginTop}
          rowSelection={isStorehouseManager ? rowSelection : null}
          size='small'
          bordered
          columns={isStorehouseManager ?
            columns : columns.filter((item) => item.title !== '操作')}
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
          title='新增普通物品'
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
        <AddFromRFID
          ref={addFormRFID}
          title='新增标签物品'
          visible={isAddingRFID}
          onCancel={() => {
            addFormRFID.current.resetFields()
            setIsAddingRFID(false)
          }}
          onOk={() => {
            addFormRFID.current.validateFields(async (error, data) => {
              if (!error) {
                data['has_rfid'] = 1;
                data['count'] = data['rfids'].length
                addData(data)
                addFormRFID.current.resetFields()
              }
            })
          }}
        />
        <UpdateForm
          data={currentItem}
          ref={updateForm}
          title='修改普通物品'
          visible={isUpdating}
          onCancel={() => {
            updateForm.current.resetFields()
            setIsUpdating(false)
          }}
          onOk={() => {
            updateForm.current.validateFields(async (error, data) => {
              if (!error) {
                if (!data['nfc_shelf_id']) { data['nfc_shelf_id'] = null }
                updateData(data)
              }
            })
          }}
        />
        <UpdateFormRFID
          data={currentItem}
          ref={updateFormRFID}
          title='修改标签物品'
          visible={isUpdatingRFID}
          onCancel={() => {
            updateFormRFID.current.resetFields()
            setIsUpdatingRFID(false)
          }}
          onOk={() => {
            updateFormRFID.current.validateFields(async (error, data) => {
              if (!error) {
                if (!data['nfc_shelf_id']) { data['nfc_shelf_id'] = null }
                if (!data['no']) { data['no'] = null }
                data['has_rfid'] = 1;
                data['count'] = data['rfids'].length
                updateData(data)
              }
            })
          }}
        />
      </div>
    </div>
  )
}
const Searchfrom = Form.create({ name: 'form' })(props => {
  const [treeData, setTreeData] = useState([])
  const getType = useCallback(async () => {
    let result2 = await api.listAllTag()
    if (result2.code === 0) {
      result2.data = filterTag(result2.data, 0)
      let treeResult = result2.data.map((item) => { return { id: item.id, pId: item.tids ? item.tids[0] : 0, value: item.id, title: item.name } })
      setTreeData(getJsonTree(treeResult, 0))
    }
  }, [])
  const listAllOptions = useCallback(async () => {
    getType()
  }, [getType])
  useEffect(() => {
    listAllOptions()
  }, [listAllOptions])
  const itemProps = { labelCol: { span: 6 }, wrapperCol: { span: 18 } }
  return <Form onSubmit={(e) => {
    e.preventDefault();
    props.form.validateFields((err, values) => {
      ///values搜寻条件数据过滤
      let newObj = {};
      for (const key in values) {
        if (values.hasOwnProperty(key)) {
          const element = values[key];
          if (element && element.length > 0) {
            if (key === 'date') {
              newObj[key] = [element[0].startOf('day').format('YYYY-MM-DD HH:mm:ss'), element[1].endOf('day').format('YYYY-MM-DD HH:mm:ss')]
            } else {
              newObj[key] = values[key]
            }
          }
        }
      }
      props.startSearch(newObj);
    });
  }}>
    <Row>
      <Col span={6}>
        <Form.Item label='入库时间'  {...itemProps}>
          {props.form.getFieldDecorator('date', {
            rules: [{ required: false }]
          })(
            <DatePicker.RangePicker
              allowClear={false}
              style={{ width: '100%' }}
              disabledDate={(current) => {
                return current > moment().endOf('day');
              }}
              ranges={{
                今日: [moment(), moment()],
                昨日: [moment().add(-1, 'day'), moment().add(-1, 'day')],
                本月: [moment().startOf('month'), moment().endOf('day')],
                上月: [moment().add(-1, 'month').startOf('month'), moment().add(-1, 'month').endOf('month')]
              }}
            />
          )}
        </Form.Item>
      </Col>
      <Col span={6}>
        <Form.Item label='属性' {...itemProps}>
          {props.form.getFieldDecorator('tids', {
            rules: [{ required: false }]
          })(<TreeSelect
            allowClear
            multiple
            treeNodeFilterProp='title'
            showSearch
            treeData={treeData}
            style={{ width: '100%' }}
            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
            placeholder='请选择属性-支持搜索'
            showCheckedStrategy={TreeSelect.SHOW_PARENT}
          />)}
        </Form.Item>
      </Col>
      <Col span={6}>
        <Form.Item label='关键字' {...itemProps}>
          {props.form.getFieldDecorator('key', {
            rules: [{ required: false }]
          })(<Input allowClear placeholder="请输入名称或备注" />)}
        </Form.Item>
      </Col>
      <Col span={6}>
        <div style={{ textAlign: 'right', paddingTop: 3 }}>
          <Button type="primary" htmlType="submit">查询</Button>
          <Button style={{ marginLeft: 8 }} onClick={() => { props.form.resetFields() }}>清除</Button>
        </div>
      </Col>
    </Row>
  </Form>
})
const styles = {
  root: {
    backgroundColor: '#F1F2F5',
    width: '100%',
    height: '100vh'
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: '24px 24px 0px 24px',
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
    marginTop: 16
  },
  button: {
    marginLeft: 10
  },
  alertMessage: {
    display: 'flex',
    justifyContent: 'space-between'
  }
}