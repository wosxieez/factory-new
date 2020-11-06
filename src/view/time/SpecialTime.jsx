import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Table, Alert, Button, Modal, Form, TimePicker, Switch, message } from 'antd';
import HttpApi from '../../http/HttpApi';
import moment from 'moment';
import { userinfo } from '../../util/Tool';
const today = moment().format('YYYY-MM-DD ')
const format = 'HH:mm'
export default () => {
    const setForm = useRef()
    const [data, setData] = useState([])
    const [currentItem, setCurrentItem] = useState({})
    const [operationVisible, setOperationVisible] = useState(false)
    const [isStorehouseManager] = useState(userinfo().permission && userinfo().permission.split(',').indexOf('5') !== -1)
    const getData = useCallback(async () => {
        let result = await HttpApi.getSpecialTime()
        setData(result.map((item, index) => { item.key = index; return item }))
    }, [])
    useEffect(() => {
        getData()
    }, [getData])
    const columns = [{
        title: '日期', dataIndex: 'des', key: 'des', render: (text, record) => {
            return <div style={{ color: record.disable ? '#bfbfbf' : '#595959' }}>{text}</div>
        }
    },
    {
        title: '起始', dataIndex: 'time_start', key: 'time_start', render: (text, record) => {
            return <div style={{ color: record.disable ? '#bfbfbf' : '#595959' }}>{text}</div>
        }
    },
    {
        title: '结束', dataIndex: 'time_end', key: 'time_end', render: (text, record) => {
            return <div style={{ color: record.disable ? '#bfbfbf' : '#595959' }}>{text}</div>
        }
    },
    {
        title: '状态', dataIndex: 'disable', key: 'disable', render: (text) => {
            if (text) {
                return <div style={{ color: '#bfbfbf' }}>禁用</div>
            } else {
                return <div style={{ color: '#52c41a' }}>启用</div>
            }
        }
    },
    {
        title: '操作', dataIndex: 'action', key: 'action', width: 100, align: 'center', render: (text, record) => {
            return (
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                    <Button
                        type='link'
                        size='small'
                        icon='form'
                        onClick={() => {
                            setCurrentItem(record)
                            setOperationVisible(true)
                        }}>
                        设定</Button>
                </div>
            )
        }
    }]
    return <div style={styles.root}>
        <div style={styles.body}>
            <Alert style={styles.marginBottom} message={'仓库正常运转时段表设定：非时间段内提交的领料申请会被自动标记为【特殊】状态'} type='info' showIcon />
            <Table
                columns={isStorehouseManager ? columns : columns.filter((item) => item.title !== '操作')}
                size='small'
                bordered
                dataSource={data}
            />
            <SettingPanel
                data={currentItem}
                ref={setForm}
                title='时间设定'
                visible={operationVisible}
                onCancel={() => {
                    setForm.current.resetFields()
                    setOperationVisible(false)
                }}
                onOk={() => {
                    setForm.current.validateFields(async (error, data) => {
                        if (!error) {
                            if (data.time_start - data.time_end >= 0) { message.error('起始时间必须小于结束时间'); return }
                            data.time_start = moment(data.time_start).format(format)
                            data.time_end = moment(data.time_end).format(format)
                            data.disable = data.able ? 0 : 1
                            data.id = currentItem.id
                            delete data.able
                            // console.log('data:', data)
                            let result = await HttpApi.updateSpecialTime(data)
                            if (result) {
                                message.success('设定成功')
                            }
                            setForm.current.resetFields()
                            setOperationVisible(false)
                            getData()
                        }
                    })
                }}
            />
        </div>
    </div>
}

const SettingPanel = Form.create({ name: 'form' })(props => {
    return <Modal
        destroyOnClose
        {...props}
    >
        <Alert style={styles.marginBottom} message={`【${props.data.des}】起始必须小于结束；不需要则将状态置成【禁用】`} type='info' showIcon />
        <Form labelCol={{ span: 4 }} wrapperCol={{ span: 18 }}>
            <Form.Item label='起始'>
                {props.form.getFieldDecorator('time_start', {
                    initialValue: moment(today + props.data.time_start),
                    rules: [{ required: true, message: '请选择起始时间' }]
                })(<TimePicker format={format} />)}
            </Form.Item>
            <Form.Item label='结束'>
                {props.form.getFieldDecorator('time_end', {
                    initialValue: moment(today + props.data.time_end),
                    rules: [{ required: true, message: '请选择结束时间' }]
                })(<TimePicker format={format} />)}
            </Form.Item>
            <Form.Item label='状态'>
                {props.form.getFieldDecorator('able', {
                    initialValue: !props.data.disable,
                    valuePropName: 'checked'
                })(<Switch checkedChildren="启用" unCheckedChildren="禁用" />)}
            </Form.Item>
        </Form>
    </Modal>
})

const styles = {
    root: {
        backgroundColor: '#F1F2F5',
        width: '100%',
        height: '100vh'
    },
    header: {
        backgroundColor: '#FFFFFF',
        padding: 24,
    },
    body: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        marginBottom: 16,
    },
    marginBottom: { marginBottom: 10 }
}