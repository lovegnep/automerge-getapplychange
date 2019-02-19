'use strict';

const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http)
const Automerge = require("automerge")
const documentsList = require("./initialSlateValue").documentsList
const Slate = require("slate")
const SlateAutomergeBridge = require("./dist/slateAutomergeBridge")

const PORT  = 40001;
const { slateCustomToJson } = SlateAutomergeBridge
const Value = Slate.Value

const createNewDocument = function(room) {
    const initdoc = Automerge.init();
    const initialValue = nameDocsMap.get(room);
    if(!initialValue){
        console.error('can not find doc of ', room);
        return null
    }
    const initialSlateValue = Value.fromJSON(initialValue);
    const doc = Automerge.change(initdoc, "Initialize Slate state", doc => {
        doc.note = slateCustomToJson(initialSlateValue.document);
    })
    return doc
}

let clients = new Map()// clientId ==> socket
const roomDocsMap = new Map()  // docname ===> doc
const nameDocsMap = new Map()  // docname ===> initval
const clientRoomMap = new Map()// clientId ===> room

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

function getDocsOfNameList(){
    const nameList = [];
    for(const docitem of documentsList){
        nameList.push(docitem.name)
        nameDocsMap.set(docitem.name, docitem)
    }
    return nameList;
}

const docNameList = getDocsOfNameList()
function isValidRoot(room){
    return docNameList.includes(room)
}
function initRoomDoc(room){
    if(roomDocsMap.get(room)){
        return console.error('room exists.');
    }
    roomDocsMap.set(room, createNewDocument(room))
}
function getRoomDoc(room){
    let doc = roomDocsMap.get(room);
    if(doc){
        return doc;
    }else{
        initRoomDoc(room)
    }
    return roomDocsMap.get(room);
}

io.on('connection', function(socket) {
    const clientId = socket.handshake.query.clientId;
    clients.set(clientId, socket)
    console.log('client come...', clientId)

    socket.on('connect', function(data) {
        console.log('user connects socket');
    });

    // 异常处理
    socket.on('disconnect', (reason)=>{
        console.log('发生异常: ', reason, clientId)
        clientRoomMap.delete(clientId)
        socket.removeAllListeners()
        clients.delete(clientId)
        socket = null
    })
    socket.on('error', (err)=>{
        console.log('发生错误: ', err, clientId)
    })

    // 处理客户端发送来的change
    socket.on("send_operation", function(change) {
        console.log('receive send_operation:', clientId)
        const room = clientRoomMap.get(clientId);
        let doc = getRoomDoc(room);
        doc = Automerge.applyChanges(doc, change)
        roomDocsMap.set(room, doc)
        socket.to(room).emit('send_operation', change)
    })

    // 处理加入房间请求
    socket.on('joinRoom', function(room, cb){
        const oldroom = clientRoomMap.get(clientId)
        if(oldroom){
            if(oldroom === room){
                console.warn('client alwready in ', room);
                return;
            }else{
                socket.leave(oldroom)
            }
        }
        socket.join(room);
        clientRoomMap.set(clientId, room);
        cb(true)
    })

    socket.on('syncClock', (clock) =>{
        try{
            const room = clientRoomMap.get(clientId)
            const doc = getRoomDoc(room);
            const newOpt = Automerge.Frontend.getBackendState(doc).get('opSet').get('states').map(states => states.size).toJSON()
            console.log('当前时钟：', newOpt)
            console.log('客户端时钟：', clock)
            const optSet = Automerge.Frontend.getBackendState(doc).get('opSet').get('states')
            const missingChanges = optSet.map((states, actor) => {
                return states.skip(clock[actor] || 0)
            }).valueSeq()
                .flatten(1)
                .map(state => state.get('change')).toJSON()
            if(missingChanges.length > 0){
                console.log('丢失的change长度', missingChanges.length)
                socket.emit('send_operation', missingChanges)
            }else{
                console.log('未丢失change')
            }
            socket.emit('syncClock', newOpt)
        }catch (e) {
            console.error('syncClock发生错误：',e);
        }

    })

    // 处理请求初始数据
    socket.on('init', function(){
        const room = clientRoomMap.get(clientId)
        const doc = getRoomDoc(room);
        const change = Automerge.getChanges(Automerge.init(), doc);
        socket.emit('init', change)
    })


    socket.emit('docList', docNameList)
});


http.listen(PORT, function() {
    console.log('listening on *:', PORT);
});
