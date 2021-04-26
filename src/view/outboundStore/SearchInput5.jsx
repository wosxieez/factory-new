import { message, Select, Tooltip } from 'antd';
import React, { useState, useCallback, forwardRef } from 'react';
import HttpApi from '../../http/HttpApi';
const { Option } = Select;
let timeout;
/**
 * 物品记录 搜索物品用
 * @param {*} param0 
 * @returns 
 */
const SearchInput5 = forwardRef((props, ref) => {
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
    const handleChange = useCallback((value, option) => {
        props.onChange(value)
    }, [props])
    const options = storeOptionList.map((item, index) => <Option value={item.id}
        key={index}
        all={item}
    >
        <Tooltip placement="left" key={index} title={item.num + '-' + item.name + '-' + item.model + '--剩余' + item.count}>
            {item.num + '-' + item.name}
        </Tooltip>
    </Option>);
    return (
        <Select
            value={props.value}
            mode='multiple'
            placeholder='编号、型号、名称'
            showSearch
            style={{ width: '100%' }}
            defaultActiveFirstOption={false}
            showArrow={false}
            filterOption={false}
            notFoundContent={null}
            onSearch={handleSearch}
            onChange={handleChange}
        >
            {options}
        </Select>
    );

})
export default SearchInput5