let MongoClient = require('mongodb').MongoClient;
let assert = require('assert');
let dateFormat = require('dateformat');
let appConfig = require('./config');
let connector = require('./connector');
let connection;

module.exports = {aggregate:
    async function aggregate(_connection, parameters) {
        connection = _connection;
        let docs = await connection.db.collection(parameters.collectionName).aggregate(parameters.options).toArray();
        console.log(parameters.putinto);
        if (parameters.putinto == 'goodsByDay'){
            saveGoodsByDay(docs, parameters);
        }
        else if (parameters.putinto == 'salesByDay') {
            saveDataByDay(docs, parameters);
        }
        else if (parameters.putinto == 'goods') {
            saveGoods(docs, parameters);
        }
    }
};

async function saveDataByDay(docs, parameters){

    if (!docs){
        console.log('Нет данных для сохранения');
        return;
    }
    let closeConnection = false;

    for (let i = 0; i < docs.length; i++) {
        try {
            let item = docs[i];
            let ts_hms = Date.parse(item._id.date);
            let date = dateFormat(ts_hms, "yyyy-mm-dd");
            let sales = Number.parseFloat(item.sales);
            let costs = Number.parseFloat(item.costs);
            let profit = (sales-costs).toPrecision(6);
            let margin = 0;
            if (costs==0){
                margin = 0
            }
            else {
                margin = ((sales-costs)/costs*100).toPrecision(6);
            }
            if (connection.client.closed)
            {
                connection = await connector.connect();
                closeConnection = true;
            }
            await connection.db.collection(parameters.putinto).updateOne(
                {dim: date},
                {
                    $set: {
                        tsUser: item._id.tsUser,
                        dim: date,
                        shop:item._id.shop,
                        sales: sales,
                        profit: profit,
                        margin: margin,
                        costs: costs,
                    }
                }
                , {upsert: true}
            )
        } catch (e) {
            console.log(e);
        }
    }
    if (closeConnection){
        connection.client.close();
    }
}

async function saveGoodsByDay(docs, parameters){
    if (!docs){
        console.log('Нет данных для сохранения');
        return;
    }

    let closeConnection = false;

    for (let i = 0; i < docs.length; i++) {
        try {
            let item = docs[i];
            let sales = Number.parseFloat(item.sales);
            let costs = Number.parseFloat(item.costs);
            let profit = (sales-costs).toPrecision(6);
            let margin = 0;
            if (costs==0){
                margin = 0
            }
            else {
                margin = ((sales-costs)/costs*100).toPrecision(6);
            }
            if (connection.client.closed)
            {
                connection = await connector.connect();
                closeConnection = true;
            }
            await connection.db.collection(parameters.putinto).updateOne(
                {dim: item._id.product_id},
                {
                    $set: {
                        tsUser: item._id.tsUser,
                        dim: item._id.product_id,
                        shop:item._id.shop,
                        sales: sales,
                        profit: profit,
                        margin: margin,
                        costs: costs,
                    }
                }
                , {upsert: true}
            )
        } catch (e) {
            console.log(e);
        }
    }
    if (closeConnection){
        connection.client.close();
    }
}

async function saveGoods(docs, parameters){
    if (!docs){
        console.log('Нет данных для сохранения');
        return;
    }

    let closeConnection = false;

    for (let i = 0; i < docs.length; i++) {
        try {
            let item = docs[i];
            if (connection.client.closed)
            {
                connection = await connector.connect();
                closeConnection = true;
            }
            await connection.db.collection(parameters.putinto).updateOne(
                {dim: item._id.product_id},
                {
                    $set: {
                        product_id:item._id.product_id,
                        shop:item._id.shop,
                        tsUser:item._id.tsUser,
                        product_name:item._id.product_name
                    }
                }
                , {upsert: true}
            )
        } catch (e) {
            console.log(e);
        }
    }
    if (closeConnection){
        connection.client.close();
    }
}