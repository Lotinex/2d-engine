const ws = io('http://lofence.kro.kr:7010', {reconnection: false})

const stage = document.querySelector('#stage')
/**
 * @type {CanvasRenderingContext2D}
 */
const renderer = stage.getContext("2d")
const me = new Player()
stage.setAttribute('width', window.innerWidth);
stage.setAttribute('height', window.innerHeight);
var users = [ [me.name, me.x, me.y, me.nameColor] ]
var objects = []
var dragDebugTool;
var debugToolXY = [0,0]
class MapObject {
    static src = { // for property of instance of Server side class MapObject 'imgKey' 
        stone : 'https://pngimg.com/uploads/stone/stone_PNG13603.png',
        grass : '/img/grass.png',
        tree : '/img/tree.png'
    }
    constructor(img, x, y, width, height){
        this.img = img 
        this.x = x
        this.y = y
        this.width = width
        this.height = height
    }
    render(renderer){ //오브젝트 렌더링
        renderer.drawImage(this.img, this.x, this.y, this.width, this.height)
    }
}
function rand(start, end){
    return Math.floor((Math.random() * (end-start+1)) + start);
}
function yell(text){
    document.querySelector('#yell').innerText = text
    document.querySelector('#yell').style.display = 'block'
    setTimeout(() => {
        document.querySelector('#yell').classList.add('disappear')

        document.querySelector('#yell').addEventListener('animationend', () => {
            document.querySelector('#yell').style.display = 'none'
            document.querySelector('#yell').classList.remove('disappear')
        })
    }, 2000)
}
function commandFeedback(text){
    let feedbackChat = document.createElement('div')
    feedbackChat.setAttribute('class', 'chatBox feedback')
    feedbackChat.innerText = `<system> ${text}`
    document.querySelector('#chatList').appendChild(feedbackChat)
    document.querySelector('#chatList').scrollTop = document.querySelector('#chatList').scrollHeight
}
function loop(){
    move()
    render()
    window.requestAnimationFrame(loop)
}
var [_xOffset, _yOffset] = [0, 0]
function clear (xOffset,yOffset,canvasWidth,canvasHeight,zoom) {
    renderer.clearRect(xOffset - (canvasWidth / zoom - canvasWidth)/2, yOffset - (canvasHeight / zoom - canvasHeight)/2, canvasWidth / zoom, canvasHeight / zoom);
}


document.querySelector('#players').addEventListener('mousedown', e => {
    dragDebugTool = true
    debugToolXY = [
        Number(document.querySelector('#players').style.left.replace('px','')) - e.clientX,
        Number(document.querySelector('#players').style.top.replace('px','')) - e.clientY
    ]

})
document.addEventListener('mouseup', e => {
    dragDebugTool = false
})
document.addEventListener('mousemove', e => {
    if(dragDebugTool){
        document.querySelector('#players').style.left = e.clientX + debugToolXY[0] + 'px'
        document.querySelector('#players').style.top = e.clientY + debugToolXY[1] + 'px'
    }
})


var lastCalled;
var fps;
function render(){
    clear(_xOffset, _yOffset, stage.width, stage.height, me.zoom * 0.2)
    for(const user of users){
        
        renderer.beginPath()
        renderer.rect(user[1], user[2], me.width, me.height)
        renderer.fillStyle = "#000000"
        renderer.fill()
        renderer.closePath()

        renderer.font = '20px NanumSquareRound'
        renderer.fillStyle = user[3];
        renderer.textAlign = "center"
        renderer.fillText(user[0], user[1] + 25 , user[2] - 7)

        
    }
    for(const object of objects){
        object.render(renderer)
    }
    let cameraMoveX = me.x + me.zoomX - stage.width / 2 + me.width
    let cameraMoveY = me.y + me.zoomY - stage.height / 2 + me.height
    renderer.translate(_xOffset - cameraMoveX, _yOffset - cameraMoveY)
    _xOffset = cameraMoveX
    _yOffset = cameraMoveY
    document.querySelector('#players').innerHTML = /*users.join('\n') + */`<div class="imsiTitle">오브젝트</div><pre class="tags">${JSON.stringify(objects, null, 2)}<pre><div>총 오브젝트 수 : ${objects.length} 개</div>`

    if(!lastCalled) {
        lastCalled = performance.now()
        fps = 0
    } else {

    let delta = (performance.now() - lastCalled) / 1000
    lastCalled = performance.now()
    fps = ~~(1 / delta)

    }
    document.querySelector('#fps').innerText = `FPS : ${fps}`
    
}
function move(){
    if(me.keys.a) updateLocation('right')
    if(me.keys.d) updateLocation('left')
    if(me.keys.w) updateLocation('up')
    if(me.keys.s) updateLocation('down')
}
function updateLocation(type){
    switch(type){
        case 'right':
            me.x -= me.moveSpd
            ws.emit('updateLocation', me.x, me.y)
            break;
        case 'left':
            me.x += me.moveSpd
            ws.emit('updateLocation', me.x, me.y)
            break;
        case 'up':
            me.y -= me.moveSpd
            ws.emit('updateLocation', me.x, me.y)
            break;
        case 'down':
            me.y += me.moveSpd
            ws.emit('updateLocation', me.x, me.y)
            break;
    }
}
//맵 오브젝트를 서버로부터 받아 저장
ws.on('initObjects', objectsArr => {
    console.log(objectsArr)
    for(let o of objectsArr){
        let objectImage = new Image()
        objectImage.src = MapObject.src[o.imgKey]
        let staticObject = new MapObject(
            objectImage,
            o.x,
            o.y,
            o.width,
            o.height
        )
        objects.push(staticObject)
    }
})
//유저 위치 변경사항 반영
ws.on('updateUserLocation', (index, x, y) => {
    users[index] = [users[index][0], x, y, users[index][3]]
})
//유저 리스트 교체
ws.on('updateState', newList => {
    users = newList
})
//연결 끊김 감지
ws.on('disconnect', () => {
    yell('서버와의 연결이 끊어졌습니다.')
})
//공지
ws.on('yell', text => yell(text))

//관리자 인증
ws.on('gm', () => {
    me.gm = true
    me.name = "asdf"
    me.nameColor = 'blue'
    commandFeedback('관리자 권한을 얻었습니다.')
})
//채팅
ws.on('newChat', (name, value, isAdmin) => {
    let chatBox = document.createElement('div')
    chatBox.setAttribute('class', `chatBox ${isAdmin ? 'gm' : ''}`)
    chatBox.innerText = `${name} : ${value}`
    document.querySelector('#chatList').appendChild(chatBox)
    document.querySelector('#chatList').scrollTop = document.querySelector('#chatList').scrollHeight
})
//킥 (미완성)
ws.on('kill', () => {
    alert('서버와의 연결이 끊어졌습니다!')
    ws.close()
})
document.addEventListener('keydown', e => {
    if(document.activeElement == document.querySelector('#name') ||document.activeElement ==  document.querySelector('#chatInput')) return;
    me.keys[e.key] = true
})
document.addEventListener('keyup', e => {
    delete me.keys[e.key]
})
document.addEventListener('keydown', e => {
    if(document.activeElement == document.querySelector('#name') ||document.activeElement ==  document.querySelector('#chatInput')) return;
    if(e.which == 187){
        renderer.scale(1.25, 1.25)
        me.zoom *= 1.25
        me.zoomX += me.x * 0.2
        me.zoomY += me.y * 0.2
    }
    if(e.which == 189){
        renderer.scale(0.8, 0.8)
        me.zoom *= 0.8
        me.zoomX -= me.x * 0.25
        me.zoomY -= me.y * 0.25
    }
})
document.querySelector('#chatInput').addEventListener('keyup', e => {
    if(e.key == 'Enter'){
        ws.emit('sendChat', me.name, document.querySelector('#chatInput').value)
        document.querySelector('#chatInput').value = ''
    }
})
document.querySelector('#setName').addEventListener('click', e => {
    if(me.name ===  document.querySelector('#name').value) return alert('이미 해당 닉네임을 사용 중입니다.')
    me.name = document.querySelector('#name').value
    ws.emit('changeName', me.name)
})
window.requestAnimationFrame(loop)