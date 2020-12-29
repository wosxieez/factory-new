import React, { useState, useCallback, useEffect } from 'react'
import HttpApi from '../../http/HttpApi'
import { Alert, Switch, Table } from 'antd'

export default function RfidView() {
    const [rfidlist, setFridlist] = useState([])
    const [isOut, setIsOut] = useState(false)
    const init = useCallback(async () => {
        let res = await HttpApi.getRfidList({ isAll: true, isOut: isOut ? 1 : 0 })
        let tempList = res.map((item, index) => { item.key = index; return item }).reverse();
        setFridlist(tempList)
    }, [isOut])
    useEffect(() => {
        init();
    }, [init])
    const columns = [
        { title: 'RFID编码', dataIndex: 'rfid_code', key: 'rfid_code' },
        {
            title: '名称', dataIndex: 'name', key: 'name',
            render: (text, record) => {
                return text || '-'
            }
        },
        {
            title: '关联物品名称', dataIndex: 'store_name', key: 'store_name',
            render: (text, record) => {
                return text || '-'
            }
        },
        {
            title: '出库时间', dataIndex: 'out_time', key: 'out_time',
            render: (text, record) => {
                return record['is_out'] ? text : '-'
            }
        },
    ]
    return (
        <div style={styles.root}>
            <div style={styles.body}>
                <Alert style={styles.marginBottom} type='info' showIcon message={<div style={styles.alertMessage}>
                    <span>物品标签信息列表；使用PDA进行物品标签的录入</span>
                    <Switch checkedChildren="库内" unCheckedChildren="出库" defaultChecked={!isOut} onChange={(v) => { setIsOut(!v) }} />
                </div>} />
                <Table
                    columns={columns}
                    dataSource={rfidlist}
                    size='small'
                    bordered
                    pagination={false}
                />
            </div>
        </div>
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
    body: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        marginBottom: 16,
    },
    alertMessage: {
        display: 'flex',
        justifyContent: 'space-between',
    },
    marginBottom: { marginBottom: 10 }
}