import { Icon, message, Select } from 'antd';
import React, { useState, useCallback } from 'react';
import HttpApi from '../../http/HttpApi';
const { Option } = Select;
let timeout;
/**
 * 出库时的物品选择
 * 申请时的物品选择
 * @param {*} param0 
 * @returns 
 */
export default function SearchInput1({ orderList, storeList, value, onChange }) {
    const [storeOptionList, setStoreOptionList] = useState([])
    const handleSearch = useCallback((value) => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
        setStoreOptionList([])
        if (value) {
            timeout = setTimeout(async () => {
                let result = await HttpApi.getAllStoreList({ keyword: value })
                if (result.code === 0) {
                    let list = result.data
                    if (result.data.length > 20) {
                        message.warning('符合条件的数据量很多，已为你截取20条；可输入更多关键字缩小查找范围', 5)
                        list = result.data.slice(0, 20)
                        ///根据申请中的数据临时减去对应物品的可选数量
                        orderList.forEach(order => {
                            let contentList = JSON.parse(order.content)
                            // console.log('contentList:', contentList)
                            contentList.forEach(item => {
                                list.forEach(store => {
                                    if (item.store_id === store.id) {
                                        store.count = store.count - item.count
                                    }
                                })
                            })
                        })
                        // console.log('list:', list)
                    }
                    setStoreOptionList(list)
                }
            }, 1000);
        }
    }, [orderList])
    const handleChange = useCallback((_, option) => {
        onChange(option)
    }, [onChange])
    const options = storeOptionList.map((item, index) => <Option value={item.id}
        key={index}
        all={item}
        disabled={(storeList.map((item) => item.store_id).indexOf(item.id) !== -1) || (item.count === 0)}
    >
        {item['has_rfid'] ? <Icon type="barcode" style={{ marginRight: 5 }} /> : null} {item.num + '-' + item.name + '-' + item.model + '--剩余' + item.count}
    </Option>);
    return (
        <Select
            value={value}
            placeholder='输入物品编号、型号、名称搜索并且选择物品'
            showSearch
            style={{ width: 400 }}
            defaultActiveFirstOption={false}
            showArrow={false}
            filterOption={false}
            onSearch={handleSearch}
            onChange={handleChange}
            notFoundContent={null}
        >
            {options}
        </Select>
    );
}