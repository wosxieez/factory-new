import React, { useState, useEffect, useCallback } from 'react'
import { Table, Button, Input, Row, Col, DatePicker, Tag, Form, Collapse, Switch, Alert } from 'antd'
import moment from 'moment'
import HttpApi from '../../http/HttpApi'
const { Panel } = Collapse;
// const testList = [
//     { time: "2020-10-10 10:10:10", user_name: "tom", content_scan: '[{"store_id":43,"store_name":"测试法兰","rfid_list":[{"code":"300833B2DDD9014000000000","name":"鼠标(1)"},{"code":"E200001D881200871760395B","name":"鼠标"}],"rfid_count":2}]', content_lost: '[]' },
//     { time: "2020-10-10 10:10:10", user_name: "tom", content_scan: '[{"store_id":45,"store_name":"纸纸纸2333","rfid_list":[{"code":"E200001D881200871760395B","name":"纸质rfid"}],"rfid_count":1}]', content_lost: '[{"store_id":46,"count":1,"store_name":"塑料","is_lost":true,"count_lost":1}]' },]
// function copyList(list, times = 1) {
//     let temp_list = []
//     for (let index = 0; index < times; index++) {
//         temp_list = [...JSON.parse(JSON.stringify(temp_list)), ...list]
//     }
//     return temp_list
// }
// const testData = copyList(testList, 100)
const FORMAT = 'YYYY-MM-DD HH:mm:ss';
var searchCondition = {};
var pageCondition = {};
export default function StoreScanRecordView() {
    const [recordList, setRecordList] = useState([])
    const [listLength, setListLength] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [defaultTime] = useState([moment().add(-1, 'month').startOf('day'), moment().endOf('day')])
    const [isExpand, setIsExpand] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const columns = [{
        title: '时间', dataIndex: 'time', width: 120, align: 'center'
    },
    { title: '记录人', dataIndex: 'user_name', width: 80, },
    {
        title: '盘存', dataIndex: 'content_scan', render: (text) => {
            if (text) {
                try {
                    let content = JSON.parse(text)
                    return renderScanContent(content, isExpand)
                } catch (error) {
                    console.log('error:', error)
                    return '-'
                }
            }
            return '-'
        }
    },
    {
        title: '遗漏', dataIndex: 'content_lost', render: (text) => {
            if (text) {
                try {
                    let content = JSON.parse(text)
                    return renderLostContent(content, isExpand)
                } catch (error) {
                    console.log('error:', error)
                    return '-'
                }
            }
            return '-'
        }
    },
    { title: '备注', dataIndex: 'remark', render: (text) => { return text || '-' } }]
    const init = useCallback(async () => {
        setIsLoading(true)
        let conditions = { ...searchCondition, ...pageCondition }
        let data = await HttpApi.getStoreScanRecord(conditions);
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
                <Alert type='warning' showIcon message={<div style={styles.alertMessage}>
                    <span>针对【标签物品】的盘存记录。点击盘存物品展示对应标签数据；盘存物品数量过多时，可以点击右边开关【精简 . 展开】</span>
                    <Switch checkedChildren="展开" unCheckedChildren="精简" defaultChecked={isExpand} onChange={(v) => { setIsExpand(v) }} />
                </div>} style={{ width: '100%' }} />
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
                    if (element && element.length > 0) {
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
                <Form.Item label='记录人' {...itemProps}>
                    {props.form.getFieldDecorator('user_name', {
                        rules: [{ required: false }]
                    })(<Input allowClear placeholder="请输入记录人名称" />)}
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
                <div style={{ textAlign: 'right', paddingTop: 3 }}>
                    <Button type="primary" htmlType="submit">查询</Button>
                    <Button style={{ marginLeft: 8 }} onClick={() => { props.form.resetFields() }}>清除</Button>
                </div>
            </Col>
        </Row>
    </Form>
})
function renderScanContent(contentlist, isExpand) {
    let temp_header = [];
    let temp_rfid_count = 0;
    contentlist.forEach((item) => {
        temp_rfid_count = temp_rfid_count + item['rfid_count'];
    })
    temp_header = <Tag index={'x'} color={'#f5222d'}>{'共计:' + temp_rfid_count}</Tag>
    if (!isExpand) {
        contentlist = contentlist.slice(0, 2)
    }
    let collapse_list = <Collapse accordion bordered={false}>
        {contentlist.map((item, index) => {
            return <Panel header={renderTtile(item, index, temp_header)} key={index} style={styles.customPanelStyle} showArrow={false}>
                {renderPanel(item['rfid_list'])}
            </Panel>
        })}
    </Collapse>
    return collapse_list
    function renderTtile(data, index, temp_header) {
        return <div style={styles.tiitleBar}> <Tag color={'#1890ff'}>物品:{data['store_name']}</Tag> <Tag color={'#faad14'}>数量:{data['rfid_count']}</Tag>{index === 0 ? temp_header : null}</div>
    }
    function renderPanel(rfidlist) {
        return rfidlist.map((item, index) => {
            return <div key={index}><Tag color={'volcano'}>标签:{item['name']} 编码:{item['code']}</Tag></div>
        })
    }
}
function renderLostContent(contentlist, isExpand) {
    let temp_rfid_count_lost = 0;
    contentlist.forEach((item) => {
        temp_rfid_count_lost = temp_rfid_count_lost + item['count_lost'];
    })
    if (!isExpand) {
        contentlist = contentlist.slice(0, 2)
    }
    return contentlist.map((item, index) => {
        return <div key={index} style={{ ...styles.tiitleBar, marginBottom: 10 }}>
            <Tag color={'#1890ff'}>物品:{item['store_name']}</Tag>
            <Tag color={'#faad14'}>数量:{item['count_lost']}</Tag>
            {index === 0 ? <Tag index={'x'} color={'#f5222d'}>{'共计:' + temp_rfid_count_lost}</Tag> : null}
        </div>
    })
}
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
    }
}