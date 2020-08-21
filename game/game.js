const http = require('http')
const socket = require('socket.io')


const Server = http.createServer()

const ws = socket(Server)

const users = {}
function usersArray(){
    let usersArr = []
    for(let k in users){
        usersArr.push(users[k])
    }
    return usersArr
}
function integerRand(start, end){
  // return Math.round((Math.random() * (end-start+1)) + start);
  return (Math.random() * (end-start+1)) + start
}
var objects = []
class MapObject {
    constructor(imgKey, x, y, width, height){
        this.imgKey = imgKey
        this.x = x
        this.y = y
        this.width = width
        this.height = height
    }
    static rangeExpression(expression){
        if(!expression.match(/\d+~\d+/)) return null;
        return [Number(expression.split('~')[0]), Number(expression.split('~')[1])]
    }
    static addObject(objectName, number, x, y, width, height){ //나중에 자체 문법으로 랜덤 범위를 인식 가능하게 하자.
        if(number.match(/\d+~\d+/)) number = 
        integerRand(
        MapObject.rangeExpression(number)[0],
         MapObject.rangeExpression(number)[1]
        )

        for(let i=0;i<number;i++){
            let newObject = new MapObject(
                objectName,

                x.match(/\d+~\d+/) ? 
                integerRand(MapObject.rangeExpression(x)[0], MapObject.rangeExpression(x)[1]) : x,

                y.match(/\d+~\d+/) ? 
                integerRand(MapObject.rangeExpression(y)[0], MapObject.rangeExpression(y)[1]) : y,

                width.match(/\d+~\d+/) ? 
                integerRand(MapObject.rangeExpression(width)[0], MapObject.rangeExpression(width)[1]) : width,

                height.match(/\d+~\d+/) ? 
                integerRand(MapObject.rangeExpression(height)[0], MapObject.rangeExpression(height)[1]) : height
                )
            objects.push(newObject)
        }
    }
}
ws.on('connection', socket => {
    function checkAdmin(){
        return socket.handshake.address.replace('::ffff:','') == "192.168.35.1"
    }
    console.log(socket.id)
    users[socket.id] = [checkAdmin() ? 'asdf' : '익명', 0, 0, checkAdmin() ? 'blue' : 'black']

    if(checkAdmin()) ws.emit('gm')

    ws.to(socket.id).emit('initObjects', objects)

    ws.emit('updateState', usersArray())

    socket.on('updateLocation', (x, y) => {
        users[socket.id] = [users[socket.id][0], x, y, users[socket.id][3]]
        ws.emit('updateUserLocation', Object.keys(users).indexOf(socket.id), x, y)
    })
    socket.on('disconnect', () => {
        delete users[socket.id]
        ws.emit('updateState', usersArray())
    })
    socket.on('changeName', name => {
        users[socket.id] = [name, users[socket.id][1], users[socket.id][2]]
        ws.emit('updateState', usersArray())
    })
    socket.on('sendChat', (name, value) => {
        if(value.startsWith('/kill') && checkAdmin()){
            let target = value.split(' ')[1]
            delete users[target]

            ws.to(target).emit('kill')
        } else if(value.startsWith('/yell') && checkAdmin()){
            let text = value.substring(value.indexOf(' ') + 1, value.length)
            ws.emit('yell', text)
        }
        else {
        ws.emit('newChat', name, value, checkAdmin())
        }
    })
})
Server.listen(7010, () => {
    console.log('서버가 열렸습니다.')
    MapObject.addObject('grass', '30~40', '-500~500', '-5000~5000', '50~200', '30~70')
    MapObject.addObject('stone', '30~40', '-500~500', '-5000~5000', '50~200', '30~70')
    MapObject.addObject('tree', '30~40', '-500~500', '-5000~5000', '180~250', '200~350')
    MapObject.addObject('tree', '1', '0', '0', '1000', '3500')
})