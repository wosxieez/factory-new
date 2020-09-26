export default {
    userinfo: () => {
        let result = {};
        try {
            result = JSON.parse(localStorage.getItem('user'))
        } catch (error) {
            console.log('error:', error)
        }
        return result
    }
}