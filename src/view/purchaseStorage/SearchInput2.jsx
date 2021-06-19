import { Button, Divider, Icon, message, Select } from 'antd';
import React, { useState, useCallback } from 'react';
import HttpApi from '../../http/HttpApi';
const { Option } = Select;
let timeout;
/**
 * 采购入库时的物品选择
 * @param {*} param0 
 * @returns 
 */
export default function SearchInput2({ isInsert, storeList, value, onChange, setIsRFIDStore, setIsAdding, isStorehouseManager }) {
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
                        // console.log('list:', list)
                    }
                    setStoreOptionList(list)
                }
            }, 1000);
        }
    }, [])
    const handleChange = useCallback((_, option) => {
        onChange(option)
    }, [onChange])
    const options = storeOptionList.map((item, index) => {
        return <Option value={item.id}
            key={index}
            all={item}
            disabled={storeList.map((item) => item.store_id).indexOf(item.id) !== -1}
        >
            {item['has_rfid'] ? <Icon type="barcode" style={{ marginRight: 5 }} /> : null}
            {item.num + '-' + item.name + '-' + item.model + '--库存' + item.count}
        </Option>
    });
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
            dropdownRender={menu => {
                return <div>
                    {menu}
                    {isInsert ? null : <>
                        <Divider style={{ margin: '4px 0' }} />
                        <div style={{ padding: '4px 8px', cursor: 'pointer' }} onMouseDown={e => e.preventDefault()}>
                            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                                <Button onClick={() => { setIsRFIDStore(false); setIsAdding(true) }} disabled={!isStorehouseManager} size='small' type='primary' style={{ width: '48%' }} icon='plus'>普通物品</Button>
                            </div>
                        </div></>}
                </div >
            }}>
            {options}
        </Select>
    );
}