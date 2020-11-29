import React, { useState, useCallback, useEffect } from 'react'
import HttpApi from '../../http/HttpApi'
import { Table } from 'antd'

export default function RfidView() {
    const [rfidlist, setFridlist] = useState([])
    const init = useCallback(async () => {
        let res = await HttpApi.getRfidList({ isAll: true })
        let tempList = res.map((item, index) => { item.key = index; return item }).reverse();
        setFridlist(tempList)
    }, [])
    useEffect(() => {
        init();
    }, [init])
    const columns = [
        { title: 'RFID编码', dataIndex: 'rfid_code', key: 'rfid_code' },
        {
            title: 'RFID名称', dataIndex: 'name', key: 'name',
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
    ]
    return (
        <div style={styles.root}>
            <div style={styles.body}>
                <Table
                    title={() => { return 'RFID信息列表' }}
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
    marginBottom: { marginBottom: 10 }
}