export const getJsonTree = function (data, pId) {
    let itemArr = [];
    for (let i = 0; i < data.length; i++) {
        let node = data[i];
        if (node.pId === pId) {
            let newNode = {};
            newNode.key = node.value;
            newNode.value = node.value;
            newNode.id = node.id;
            newNode.title = node.title;
            newNode.children = getJsonTree(data, node.id);
            itemArr.push(newNode);
        }
    }
    return itemArr;
};