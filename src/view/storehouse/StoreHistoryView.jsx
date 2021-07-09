import { Table } from 'antd';
import React, { useEffect, useCallback, useState } from 'react'
import { getStoreInHistoryRecord, getStoreOutHistoryRecord, getStoreChangeHistoryRecord, changeDataStructure } from '../../util/Tool';

export default function StoreHistoryView({ id }) {
    const [list, setList] = useState([])
    const init = useCallback(async () => {
        console.log('id:', id);
        let res_in_list = await getStoreInHistoryRecord({ id })
        let res_out_list = await getStoreOutHistoryRecord({ id })
        let res_change_list = await getStoreChangeHistoryRecord({ id })
        let data_list = changeDataStructure({ res_in_list, res_out_list, res_change_list, id })
        console.log('data_list:', data_list);
        setList(data_list.map((item, index) => { item.key = index; return item }))
    }, [id])
    useEffect(() => {
        init()
    }, [init])
    const columns = [
        {
            title: '时间', dataIndex: 'time', key: 'time'
        },
        {
            title: '物品', dataIndex: 'name', key: 'name'
        },
        {
            title: '单号', dataIndex: 'code_num', key: 'code_num', render: (text, record) => {
                return text || '-'
            }
        },
        {
            title: '说明', dataIndex: 'type_remark', key: 'type_remark'
        },
        {
            title: '数量变动', dataIndex: 'count', key: 'count', render: (text, record) => {
                let char_str = '+'
                if (record.type_remark === '自行出库') {
                    char_str = '-'
                } else if (record.type_remark === '修改物品数量') {
                    char_str = ''
                    let old_str = record.old_count ? record.old_count + ' -> ' : ''
                    return old_str + text
                }
                return char_str + text
            }
        },
    ]
    return (
        <div>
            <Table size='small' bordered columns={columns} dataSource={list} />
        </div>
    )
}
