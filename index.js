/**
 * Created by Codeorg.com on 2016/9/30.
 */
"use strict";
let net = require('net');
const events = require('events');
let util = require('co-util');
const Pool=require('./bin/pool');
//let pool=new Pool({port:config.leveldb.port,host:config.leveldb.host,password:config.leveldb.password});
// let test= {
//     port: 7770,
//     host: '127.0.0.1',
//     min:2,
//     max:10,
//     password: '96188',
//     collections: ['admin','user',{name:'config',prefix:'config:'}]
// }
class Level extends events.EventEmitter{
    constructor(opts){
        super();
        this._opts=this._validator(opts);
        this._pool=new Pool({port:this._opts.port,host:this._opts.host,min:this._opts.min,max:this._opts.max,password:this._opts.password});
        this._extendDb();
    }
    _validator(opts){
        if(!opts) throw new Error('leveldb options is null!');
        opts.host=opts.host||'127.0.0.1';
        opts.port=opts.port||7770;
        opts.prefix=opts.prefix||'';
        opts.min=opts.min||2;
        opts.max=opts.max||10;
        opts.password=opts.password||'codeorg.com';
        return opts;
    }
    _extendDb(){
        this._opts.collections.forEach((collection)=>{
            if(util.isPlainObject(collection)){
                this[collection.name]=this._extendFn({db:collection.db,prefix:collection.prefix});
            }else{
                this[collection]=this._extendFn({db:collection,prefix:''});
            }
        })
    }
    _extendFn(collection){
        let _fnObj={};
        let fns=["get","set","remove","find"];
        fns.forEach( (fn)=>{
            _fnObj[fn]=async function () {
                let obj={db:collection.db,fn:fn};
                var arr = [];
                for (var i = 0, len = arguments.length; i < len; i++) {
                    arr.push(arguments[i]);
                }
                if (fn == "get" || fn == "set" || fn == "remove") {
                    if(arr.length>0)arr[0]=collection.prefix+arr[0];
                }else if(fn=="find") {
                    if(arr.length==0){
                        arr[0] ={start:collection.prefix};
                    }else{
                        let obj = arr[0];
                        if (!obj || typeof obj != "object") obj.start = collection.prefix;
                        obj.start=obj.start||"";
                        obj.start += collection.prefix;
                        arr[0] =obj;
                    }
                }
                obj.args=arr;
                console.log(obj)
                let res=await this._pool.send(obj);
                return res;
            }.bind(this);
        })
        return _fnObj;
    }

}

module.exports=Level;

//
//
// class Level2 {
//     //构造函数
//     constructor(option) {
//         this.option=option;
//         this.option.prefix=this.option.prefix||"";
//         this.pool=pool;
//         let fns=["get","set","remove","find"];
//         fns.forEach( (fn)=>{
//             this[fn]=async function(){
//                 let obj={db:this.option.db,fn:fn};
//                 var arr = [];
//                 for (var i = 0, len = arguments.length; i < len; i++) {
//                     arr.push(arguments[i]);
//                 }
//                 if (fn == "get" || fn == "set" || fn == "remove") {
//                     if(arr.length>0)arr[0]=this.option.prefix+arr[0];
//                 }else if(fn=="find") {
//                     if(arr.length==0){
//                         arr[0] ={start:this.option.prefix};
//                     }else{
//                         let obj = arr[0];
//                         if (!obj || typeof obj != "object") obj.start = this.option.prefix;
//                         obj.start=obj.start||"";
//                         obj.start += this.option.prefix;
//                         arr[0] =obj;
//                     }
//                 }
//                 obj.args=arr;
//                 console.log(obj);
//                 let res=await this.pool.send(obj);
//                 //console.log(res);
//                 return res;
//             }.bind(this);
//         })
//     }
// }
//



// exports.admin=new Level({db:"admin"});
// exports.user=new Level({db:"user"});
// //exports.cache=new Level({db:"cache"});
// exports.epaysort=new Level({db:"cache",prefix:"epay:"});
// exports.cardsort=new Level({db:"cache",prefix:"cs:"});
// exports.banksort=new Level({db:"cache",prefix:"bs:"});
// exports.captcha=new Level({db:"captcha"});