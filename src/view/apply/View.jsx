import React, { useState, useEffect, useCallback } from 'react'
import api from '../../http'
import { Row, Col, Select } from 'antd'
import MaterialForm from './MaterialForm'
import ReturnForm from './ReturnForm'
import ApplyFormView from './ApplyFormView';
const { Option } = Select
/**
 * 发起申请界面
 */
export default props => {
  const [selectType, setSelectType] = useState(1)
  const [orderType, setOrderType] = useState([])

  const getOrderType = useCallback(async () => {
    let result = await api.query(`select * from order_type where isdelete = 0`)
    if (result.code === 0) {
      setOrderType(
        result.data[0].map((item, index) => {
          return { key: index, value: item.id, label: item.order_name }
        })
      )
    }
  }, [])
  useEffect(() => {
    getOrderType()
  }, [getOrderType])

  const getFormByType = useCallback(() => {
    switch (selectType) {
      case 1:
        return <MaterialForm orderType={selectType} />
      case 2:
        return <ReturnForm orderType={selectType} />
      case 3:
        return <ReturnForm orderType={selectType} />
      default:
        break
    }
  }, [selectType])

  return (
    <div style={styles.root}>
      <div style={styles.body}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h3>申请模块</h3>
          {/* <Button style={styles.button} type="primary" onClick={() => { }}>清空</Button> */}
        </div>
        {/* <ApplyFormView /> */}
        {/* <div style={styles.main}>
          <div style={styles.row}>
            <Row {...rowProps}>
              <Col span={4}>表单类型:</Col>
              <Col span={20}>
                <Select
                  showSearch
                  style={{ width: 400 }}
                  placeholder='选择一个申请表类型'
                  optionFilterProp='children'
                  value={selectType}
                  filterOption={(input, option) =>
                    option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                  onChange={v => {
                    setSelectType(v)
                  }}>
                  {orderType.map((item, index) => (
                    <Option key={index} value={item.value}>
                      {item.label}
                    </Option>
                  ))}
                </Select>
              </Col>
            </Row>
          </div>
          <div style={styles.row}>{getFormByType()}</div>
        </div> */}
      </div>
    </div>
  )
}
const styles = {
  root: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 24
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
  },
  main: {
    display: 'flex',
    flexDirection: 'column'
  },
  row: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%'
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
