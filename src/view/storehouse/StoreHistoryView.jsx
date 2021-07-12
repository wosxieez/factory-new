import { Table } from 'antd';
import React, { useEffect, useCallback, useState } from 'react'
import { getStoreInHistoryRecord, getStoreOutHistoryRecord, getStoreChangeHistoryRecord, changeDataStructure, getStoreReturnHistoryRecord } from '../../util/Tool';

export default function StoreHistoryView({ id }) {
    const [list, setList] = useState([])
    const init = useCallback(async () => {
        console.log('id:', id);
        let res_return_list = await getStoreReturnHistoryRecord({ id })
        let res_in_list = await getStoreInHistoryRecord({ id })
        let res_out_list = await getStoreOutHistoryRecord({ id })
        let res_change_list = await getStoreChangeHistoryRecord({ id })
        let data_list = changeDataStructure({ res_return_list, res_in_list, res_out_list, res_change_list, id })
        // let after_sort = sortHandler({ list: data_list, targetKey: 'time_stamp', desc: 1 })
        // console.log('after_sort:', after_sort);
        setList(data_list.map((item, index) => { item.key = index; return item }))
    }, [id])
    useEffect(() => {
        init()
    }, [init])
    const columns = [
        {
            title: '时间', dataIndex: 'time', key: 'time',
            defaultSortOrder: 'descend',
            sorter: (a, b) => a.key - b.key,
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
                    let change_count = record.count - record.old_count
                    let result2 = change_count
                    let old_str = record.old_count >= 0 ? record.old_count + '->' : ''
                    return result2 + "【" + old_str + text + "】"
                }
                if (record.removed) {
                    return <s style={{ color: 'red' }}>{char_str + text} 已撤销</s>
                }
                return char_str + text
            }
        },
        {
            title: '库存总数', dataIndex: 'sum_count', key: 'sum_count', render: (text, record) => {
                if (record.removed) {
                    return <s style={{ color: 'red' }}>{text} 已撤销</s>
                }
                return text
            }
        },
    ]
    return (
        <div>
            <Table size='small' bordered columns={columns} dataSource={list}
                pagination={{
                    total: list.length,
                    showTotal: () => {
                        return <div>共{list.length}条记录</div>
                    },
                    showSizeChanger: true,
                    showQuickJumper: true,
                    pageSizeOptions: ['10', '50', '100'],
                }} />
        </div>
    )
}
