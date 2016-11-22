/**
 * Created by Codeorg.com on 2016/11/13.
 */
"use strict";
let events = require('events');
let net = require('net');
let Connection=require('./connection');
let util=require('co-util');

class Pool extends events.EventEmitter{
    constructor(opts){
        super();
        this._opts=opts;
        this._freeConnections = []; //空闲连接
        this._activeConnections = new Set();//活动连接
        this._init();
    }
    _init(){
        for(let i=0;i<this._opts.min;i++){
            this._enqueue();
        }
    }
    _handleConnectionError(err,_conn){
        //连接出错
        //console.log(err);
        this._handleConnectionEnd(_conn);
    }
    _handleConnectionEnd(_conn) {
        //连接结束
        if (!_conn && this._activeConnections.has(_conn)) {
            this._activeConnections.delete(_conn);
            _conn = null;//释放内存
        }
        this._enqueue();
    }
    async _enqueue(){
        //加入队列
        let size=this._freeConnections.length+this._activeConnections.size;
        if(size>=this._opts.max) {
            //throw new Error('超过最大连接数')
            return false;
        }
        let conn=new Connection({host:this._opts.host,port:this._opts.port,password:this._opts.password});
        await conn.connect();
        conn.on('end',this._handleConnectionEnd.bind(this));
        conn.on('error',this._handleConnectionError.bind(this));
        this._freeConnections.push(conn);
        return true;
    }
    async getConnection(){
        if(this._freeConnections.length==0) {
            await this._enqueue();
            return await this.getConnection();
        }
        let conn=this._freeConnections.shift();
        if(!conn.available()) {
            return await this.getConnection();
        }
        this._activeConnections.add(conn);
        return conn;
    }
   async send(msg) {
       let conn = await this.getConnection();
       return await conn.send(msg);
   }



}
module.exports=Pool;
// var pool=new Pool({port:7777,host:'127.0.0.1',max:10,min:2});
// for(let j=0;j<200;j++){
//      pool.send('ssssss'+j);
//
// }
//
// pool.send('你好');
//
// console.log(pool._activeConnections.size)
// console.log(pool._freeConnections.length)

