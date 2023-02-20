let express = require("express")
let bodyParser = require("body-parser")
let mongoose = require("mongoose")
let { Parser } = require('json2csv')
let csv2json = require('csv2json')
let fs = require('fs')
const { parse } = require("path")
const multer = require('multer');


const port  = process.env.PORT || 3000;

const app = express()

app.use(bodyParser.json())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({
    extended:true
}))
// mongodb://0.0.0.0:27017/nba

mongoose.connect('mongodb+srv://umar:0UZjg4HZnKl6aQRQ@dictonary.olrnvoz.mongodb.net/?retryWrites=true&w=majority',{
    useNewUrlParser: true,
    useUnifiedTopology: true
});

var db = mongoose.connection;

db.on('error',()=>console.log("Error in Connecting to Database"));
db.once('open',()=>console.log("Connected to Database"))


let myCollection = 'myCollection'

app.post("/addword",async(req,res)=>{  
    let word = req.body.word;
    let meaning = req.body.meaning;
    let synonyms = req.body.synonyms;
    const collection = db.collection(myCollection);
    const filter = {_id:`${word}`};
    const updateDoc = {
        $set: {
            "meaning": meaning,
            "synonyms":synonyms
        }
    }
    const options = { upsert: true };

    const result = await collection.updateOne(filter, updateDoc, options);
    return res.redirect('/home.html');
})

app.post("/findword",async(req,res)=>{  
    word = req.body.word;
    const collection = db.collection(myCollection);
    const query = { _id:{ $regex:`${word}`}};
    const options = {
        sort: { "_id": 1 },
        projection: { _id: 1, meaning: 1, synonyms: 1 },
    };
    const result = await collection.find(query, options).toArray();
    console.log(result);


    const jsonArray = JSON.stringify(result)
    console.log(jsonArray);
    fs.writeFile("public/result.json", jsonArray,callback)
    function callback()
    {
        return res.redirect('searchresult.html');
    }

})

app.post("/deleteword",async(req,res)=>{  
    word = req.body.word;
    const query = { _id:`${word}`};
    const collection = db.collection(myCollection);
    console.log(query);
    const result = await collection.deleteOne(query);
    return res.redirect('/home.html');

})



app.get("/",(req,res)=>{
    res.set({
        "Allow-access-Allow-Origin": '*'
    })
    return res.redirect('home.html');
}).listen(port);

console.log(`Listening on PORT ${port}`);



