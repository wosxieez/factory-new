import React, { useEffect, useCallback, useState } from 'react';
import api from '../../http';
import { Table, Button, Tag, Row, Col, Input, DatePicker, Select } from 'antd';
import moment from 'moment';
// import OperationView from '../approve/OperationView';
import { xiaomeiParseFloat, translateOrderList } from '../../util/Tool';
var allCondition = {}
let timeout;
// let currentValue;
export default _ => {
    const [isLoading, setIsLoading] = useState(false)
    const [dataSource, setDataSource] = useState([])
    const [sum_price, setSumPrice] = useState(0)
    const [sum_count, setSumCount] = useState(0)
    const [storeOption, setStoreOption] = useState([])
    const [storeOption2, setStoreOption2] = useState([])

    const listData = useCallback(async () => {
        setIsLoading(true)
        let code_sql = allCondition.code ? ` and orders.code like '%${allCondition.code}%'` : ''
        let store_sql = ''
        if (allCondition.store_id_list && allCondition.store_id_list.length > 0) {
            allCondition.store_id_list.forEach((store_id) => {
                store_sql = store_sql + ` or orders.content like '%"store_id":${store_id}%'`
            })
            store_sql = ' and (' + store_sql.substring(4) + ')'
        }
        let user_sql = ''
        if (allCondition.create_user_list && allCondition.create_user_list.length > 0) {
            allCondition.create_user_list.forEach((user_id) => {
                user_sql = user_sql + ` or orders.create_user = ${user_id}`
            })
            user_sql = ' and (' + user_sql.substring(4) + ')'
        }
        let date_sql = allCondition.dateDuring && allCondition.dateDuring.length > 0 ? ` and orders.createdAt>'${allCondition.dateDuring[0].startOf('day').format('YYYY-MM-DD HH:mm:ss')}' and orders.createdAt<'${allCondition.dateDuring[1].endOf('day').format('YYYY-MM-DD HH:mm:ss')}'` : ''

        let condition_sql = code_sql + store_sql + user_sql + date_sql;
        // console.log('条件sql:', condition_sql)
        /////////////////////////////
        let sql = `select orders.*,users.name as user_name from orders
        left join (select * from users where isdelete = 0) users on orders.create_user = users.id
        where orders.isdelete = 0 and orders.status in (2,3) and orders.type_id = 1 ${condition_sql}
        order by id desc`
        // console.log('sql:', sql)
        let result = await api.query(sql)
        if (result.code === 0) {
            ///到此-查询出(本月的所有)出库的单子-现在要进行数据格式的转换，将数据转换成已物品为分割单位
            let result2 = translateOrderList(result.data[0], allCondition.store_id_list)
            // console.log('result2:', result2)
            // console.log('ad:', result2.allStoreList.map((item, index) => { item.key = index; return item }))
            setDataSource(result2.allStoreList.map((item, index) => { item.key = index; return item }))
            setSumPrice(result2.sum_price)
            setSumCount(result2.sum_count)
        }
        setIsLoading(false)
    }, [])

    const handleSearch = useCallback(async (v) => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
        async function fake() {
            let tempList = [];
            let result = await api.listAllStore();
            if (result.code === 0) {
                result.data.forEach((store) => {
                    if (store.name.indexOf(v) !== -1) {
                        tempList.push({
                            value: store.id,
                            text: store.name,
                        })
                    }
                })
            }
            setStoreOption(tempList)
        }
        timeout = setTimeout(fake, 300);
    }, [])

    const handleChange = useCallback((v) => {
        if (v && v.length > 0) {
            allCondition.store_id_list = v
        } else {
            allCondition.store_id_list = undefined
            setStoreOption([])
        }
    }, [])
    //////////////////
    const handleSearch2 = useCallback(async (v) => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
        async function fake() {
            let tempList = [];
            let result = await api.listAllUser();
            if (result.code === 0) {
                result.data.forEach((store) => {
                    if (store.name.indexOf(v) !== -1) {
                        tempList.push({
                            value: store.id,
                            text: store.name,
                        })
                    }
                })
            }
            setStoreOption2(tempList)
        }
        timeout = setTimeout(fake, 300);
    }, [])
    const handleChange2 = useCallback((v) => {
        if (v && v.length > 0) {
            allCondition.create_user_list = v
        } else {
            allCondition.create_user_list = undefined
            setStoreOption2([])
        }
    }, [])
    ////////////////
    useEffect(() => {
        allCondition = {}
        listData();
    }, [listData])
    const columns = [
        {
            title: '时间',
            dataIndex: 'order.createdAt',
            key: 'createdAt',
            width: 180,
            render: (text) => {
                return moment(text).format('YYYY-MM-DD HH:mm:ss')
            }
        },
        {
            title: '物品',
            dataIndex: 'store.store_name',
            key: 'store_name',
            render: (text, record) => {
                return <Tag color='cyan'>{text}</Tag>
            }
        },
        {
            title: '单价[元]',
            dataIndex: 'store.oprice',
            key: 'oprice',
            render: (text) => {
                return <Tag color='orange'>{text}</Tag>
            }
        },
        {
            title: '数量(个)',
            dataIndex: 'store.count',
            key: 'count',
            render: (text) => {
                return <Tag color='#faad14'>{text}</Tag>
            }
        },
        {
            title: '总价[元]',
            dataIndex: 'store',
            key: 'sum_oprice',
            render: (_, record) => {
                const oprice = record.store.oprice
                const count = record.store.count
                return <Tag color='#fa541c'>{xiaomeiParseFloat(oprice * count)}</Tag>
            }
        },
        {
            title: '人员',
            dataIndex: 'order.user_name',
            key: 'user_name',
            align: 'center',
            width: 100,
        },
        {
            title: '流水',
            dataIndex: 'order.code',
            key: 'code',
            render: (text) => {
                return <Tag color='blue'>{text}</Tag>
            }
        },
    ]
    return (<div style={styles.root}>
        <div style={styles.header}>
            <Row gutter={16} {...rowProps}>
                <Col span={5}>
                    <Row {...rowProps}>
                        <Col span={4}>流水:</Col>
                        <Col span={20}>
                            <Input
                                allowClear
                                placeholder={'请输入流水'}
                                onChange={e => {
                                    allCondition.code = e.target.value;
                                }}
                            />
                        </Col>
                    </Row>
                </Col>
                <Col span={5}>
                    <Row {...rowProps}>
                        <Col span={4}>物品:</Col>
                        <Col span={20}>
                            <Select
                                mode="multiple"
                                style={{ width: '100%' }}
                                showSearch
                                placeholder={'请搜寻某些物品'}
                                defaultActiveFirstOption={true}
                                showArrow={false}
                                filterOption={false}
                                allowClear
                                onSearch={handleSearch}
                                onChange={handleChange}
                                notFoundContent={null}
                            >
                                {storeOption.map((d) => <Select.Option key={d.value}>{d.text}</Select.Option>)}
                            </Select>
                        </Col>
                    </Row>
                </Col>
                <Col span={5}>
                    <Row {...rowProps}>
                        <Col span={4}>人员:</Col>
                        <Col span={20}>
                            <Select
                                mode="multiple"
                                style={{ width: '100%' }}
                                showSearch
                                placeholder={'请搜寻某些人员'}
                                defaultActiveFirstOption={true}
                                showArrow={false}
                                filterOption={false}
                                allowClear
                                onSearch={handleSearch2}
                                onChange={handleChange2}
                                notFoundContent={null}
                            >
                                {storeOption2.map((d) => <Select.Option key={d.value}>{d.text}</Select.Option>)}
                            </Select>
                        </Col>
                    </Row>
                </Col>
                <Col span={7}>
                    <Row {...rowProps}>
                        <Col span={3}>时间:</Col>
                        <Col span={21}>
                            <DatePicker.RangePicker
                                allowClear={false}
                                // defaultValue={allCondition.dateDuring}
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
                                onChange={t => {
                                    allCondition.dateDuring = t;
                                }}
                            />
                        </Col>
                    </Row>
                </Col>
                <Col span={2}>
                    <div style={styles.headerCell}>
                        <Button
                            icon='search'
                            // size='small'
                            type='primary'
                            style={styles.button}
                            onClick={() => {
                                console.log('查询:', allCondition)
                                listData();
                            }}>查询</Button>
                    </div>
                </Col>
            </Row>
        </div>
        <div style={styles.body}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h3>出库物品记录</h3>
                <div>
                    <Tag color={'#faad14'}>总数量#: {sum_count}</Tag>
                    <Tag color={'#fa541c'}>总价格¥: {sum_price}</Tag>
                </div>
            </div>
            <Table
                loading={isLoading}
                style={styles.marginTop}
                size='small'
                bordered
                columns={columns}
                dataSource={dataSource}
                pagination={{
                    total: dataSource.length,
                    showTotal: () => {
                        return <div>共{dataSource.length}条记录</div>
                    },
                    showSizeChanger: true,
                    showQuickJumper: true,
                    pageSizeOptions: ['10', '50', '100'],
                    onChange: (page, pageSize) => {
                        // setCurrentPage(page)
                        // setCurrentPageSize(pageSize)
                        allCondition.currentPage = page
                        allCondition.currentPageSize = pageSize
                        // listOrders()
                    },
                    onShowSizeChange: (page, pageSize) => {
                        // setCurrentPage(page)
                        // setCurrentPageSize(pageSize)
                        allCondition.currentPage = page
                        allCondition.currentPageSize = pageSize
                        // listOrders()
                    },
                }}
            />
        </div>
    </div >
    )
}
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
const rowProps = {
    type: 'flex',
    justify: 'space-around',
    align: 'middle'
}
