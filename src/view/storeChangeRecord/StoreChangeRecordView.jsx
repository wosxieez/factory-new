import React, { useState, useEffect, useCallback } from 'react'
import { Table, Button, Input, Row, Col, DatePicker, Tag, Form, Select, Alert, Badge, Icon, Collapse } from 'antd'
import moment from 'moment'
import HttpApi from '../../http/HttpApi'
const { Panel } = Collapse;
const { Option } = Select;
const FORMAT = 'YYYY-MM-DD HH:mm:ss';
var searchCondition = {};
var pageCondition = {};
export default function StoreChangeRecordView() {
    const [recordList, setRecordList] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [listLength, setListLength] = useState(0)
    const [defaultTime] = useState([moment().add(-1, 'month').startOf('day'), moment().endOf('day')])
    const [currentPage, setCurrentPage] = useState(1)
    const columns = [{
        title: '时间', dataIndex: 'time', width: 120, align: 'center'
    },
    { title: '操作人', dataIndex: 'user_name', width: 80, },
    {
        title: '原先', dataIndex: 'origin_content', render: (text, record) => {
            try {
                if (record['change_type'] === 0) {
                    let temp = JSON.parse(text)
                    return temp.map((item, index) => {
                        return <Tag key={index} color='#faad14'>
                            {item['has_rfid'] === 1 ? <Icon type="barcode" style={{ marginRight: 5 }} /> : null}
                            {item['name']} 数量 {item['count']}
                        </Tag>
                    })
                } else if (record['change_type'] === 1) {
                    if (record['add_content'] && !record['remove_content']) { return '-' }
                    else if (!record['add_content'] && record['remove_content']) {
                        let temp = JSON.parse(record['remove_content'])
                        return temp.map((item, index) => {
                            return <Tag key={index} color='red'>
                                {item['has_rfid'] === 1 ? <Icon type="barcode" style={{ marginRight: 5 }} /> : null}
                                {item['name']} 数量 {item['count']}
                            </Tag>
                        })
                    }
                }
            } catch (error) {
                return '-'
            }
        }
    },
    {
        title: '变动后', dataIndex: 'change_content', render: (text, record) => {
            try {
                if (record['change_type'] === 0) {
                    let temp = JSON.parse(text)
                    return temp.map((item, index) => {
                        return <Tag key={index} color='#faad14'>
                            {item['has_rfid'] === 1 ? <Icon type="barcode" style={{ marginRight: 5 }} /> : null}
                            {item['name']} 数量 {item['count']}
                        </Tag>
                    })
                } else if (record['change_type'] === 1) {
                    if (!record['add_content'] && record['remove_content']) { return '-' }
                    else if (record['add_content'] && !record['remove_content']) {
                        let temp = JSON.parse(record['add_content'])
                        return temp.map((item, index) => {
                            return <Tag key={index} color='#52c41a'>
                                {item['has_rfid'] === 1 ? <Icon type="barcode" style={{ marginRight: 5 }} /> : null}
                                {item['name']} 数量 {item['count']}
                            </Tag>
                        })
                    }
                }
            } catch (error) {
                return '-'
            }
        }
    },
    {
        title: '说明【备注】', dataIndex: 'other', render: (text, record) => {
            if (record['change_type'] === 0) {
                if (record['type'] === 0) {
                    return <Collapse accordion bordered={false}>
                        <Panel header={<Badge color='#faad14' text='数量变动' />} key={1} style={styles.customPanelStyle} showArrow={false}>
                            <div>{record['remark'] || '-'}</div>
                        </Panel>
                    </Collapse>
                } else if (record['type'] === 1) {
                    return <Badge color='#faad14' text='数量变动' style={styles.badgestyle} />
                }
                // return <Badge color='#faad14' text='数量变动' />
            } else if (record['change_type'] === 1) {
                if (record['add_content'] && !record['remove_content']) {
                    return <Badge color='#52c41a' text='创建物品' style={styles.badgestyle} />
                } else if (!record['add_content'] && record['remove_content']) {
                    return <Badge color='red' text='删除物品' style={styles.badgestyle} />
                }
            }
        }
    },
    {
        title: '货架', dataIndex: 'shelf_name', render: (text) => {
            return text || '-'
        }
    },
    {
        title: '操作端', dataIndex: 'type', render: (text) => {
            return text === 0 ?
                <div>
                    <Icon type="mobile" theme="twoTone" twoToneColor="#faad14" />
                    <span style={styles.subtitle}>PDA</span>
                </div>
                :
                <div>
                    <Icon type="appstore" theme="twoTone" />
                    <span style={styles.subtitle}>平台</span>
                </div>
        }
    }]
    const init = useCallback(async () => {
        setIsLoading(true)
        let conditions = { ...searchCondition, ...pageCondition }
        let data = await HttpApi.getStoreChangeRecords(conditions);
        setListLength(data['count'])
        let afterSort = data['list'].map((item, index) => { item['key'] = index; return item });
        setRecordList(afterSort)
        setIsLoading(false)
    }, [])
    useEffect(() => {
        console.log('初始条件')
        ///初始条件
        searchCondition = { time: [defaultTime[0].format(FORMAT), defaultTime[1].format(FORMAT)] }
        pageCondition = { page: 1, pageSize: 10 }
        init()
    }, [init, defaultTime])
    return (
        <div style={styles.root}>
            <div style={styles.header}><Searchfrom defaultTime={defaultTime} startSearch={async (conditionsValue) => {
                searchCondition = conditionsValue;
                pageCondition = { page: 1, pageSize: 10 }
                setCurrentPage(1)
                init();
            }} /></div>
            <div style={styles.body}>
                <Alert type='info' showIcon message='物品数量变动的历史记录【只包含在平台端库存列表模块中对物品的数量、种类的改动 + PDA端的数据修订记录】' />
                <Table
                    style={styles.marginTop}
                    loading={isLoading}
                    size='small'
                    bordered
                    columns={columns}
                    dataSource={recordList}
                    pagination={{
                        total: listLength,
                        showTotal: () => {
                            return <div>共{listLength}条记录</div>
                        },
                        current: currentPage,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        pageSizeOptions: ['10', '50', '100'],
                        onShowSizeChange: (page, pageSize) => {
                            pageCondition = { page, pageSize }
                            setCurrentPage(page)
                            init();
                        },
                        onChange: (page, pageSize) => {
                            pageCondition = { page, pageSize }
                            setCurrentPage(page)
                            init();
                        }
                    }}
                />
            </div>
        </div>
    )
}
const Searchfrom = Form.create({ name: 'form' })(props => {
    const itemProps = { labelCol: { span: 6 }, wrapperCol: { span: 18 } }
    return <Form onSubmit={(e) => {
        e.preventDefault();
        props.form.validateFields((err, values) => {
            ///values搜寻条件数据过滤
            let newObj = {};
            for (const key in values) {
                if (values.hasOwnProperty(key)) {
                    const element = values[key];
                    if ((element && element.length > 0) || element >= 0) {
                        if (key === 'time') {
                            newObj[key] = [element[0].startOf('day').format(FORMAT), element[1].endOf('day').format(FORMAT)]
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
                <Form.Item label='时间'  {...itemProps}>
                    {props.form.getFieldDecorator('time', {
                        initialValue: props.defaultTime,
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
                <Form.Item label='操作人' {...itemProps}>
                    {props.form.getFieldDecorator('user_name', {
                        rules: [{ required: false }]
                    })(<Input allowClear placeholder="请输入操作人名称" />)}
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label='物品' {...itemProps}>
                    {props.form.getFieldDecorator('store_name', {
                        rules: [{ required: false }]
                    })(<Input allowClear placeholder="请输入物品名称" />)}
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label='货架' {...itemProps}>
                    {props.form.getFieldDecorator('shelf_name', {
                        rules: [{ required: false }]
                    })(<Input allowClear placeholder="请输入货架名称" />)}
                </Form.Item>
            </Col>
        </Row>
        <Row>
            <Col span={6}>
                <Form.Item label='操作端' {...itemProps}>
                    {props.form.getFieldDecorator('type', {
                        rules: [{ required: false }]
                    })(
                        <Select style={{ width: '100%' }}>
                            <Option value={0}>PDA</Option>
                            <Option value={1}>平台</Option>
                        </Select>
                    )}
                </Form.Item>
            </Col>
            <Col span={18}>
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
    subtitle: {
        marginLeft: 5
    },
    alertMessage: {
        display: 'flex',
        justifyContent: 'space-between',
    },
    tiitleBar: {
        display: 'flex',
        flexDirection: 'row'
    },
    customPanelStyle: {
        // background: '#f7f7f7',
        background: '#ffffff',
        borderRadius: 4,
        border: 0,
        overflow: 'hidden',
    },
    badgestyle: {
        marginLeft: 10
    }
}