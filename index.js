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

mongoose.connect('mongodb+srv://umar:umar123@nba.uiwzmyr.mongodb.net/?retryWrites=true&w=majority',{
    useNewUrlParser: true,
    useUnifiedTopology: true
});

var db = mongoose.connection;

db.on('error',()=>console.log("Error in Connecting to Database"));
db.once('open',()=>console.log("Connected to Database"))

let enrglobal;
let examglobal;
let courseglobal;

app.post("/createstudent",(req,res)=>{  //add new student
    let name = req.body.name;
    let enr = req.body.enr;
    let course = req.body.course;

    let data = {
        "_id" : enr,
        "name": name,
        "midsem":{
        },
        "endsem":{
        }
    }

    db.collection(course).save(data,(err,collection)=>{
        if(err){
            throw err;
        }
        console.log(`${enr} inserted successfully in ${course}`);
    });

    return res.redirect('/addstudent.html');

})
app.post("/updatestudent",(req,res)=>{  //update student
    enrglobal = req.body.enr;
    courseglobal = req.body.course;
    examglobal = req.body.exam;
    return res.redirect('/updatestudent.html')

})

app.post("/addquestion",async(req,res)=>{
    let co = req.body.co;
    let qid = req.body.qid;
    let marksOb = req.body.marksOb;
    let marksTotal = req.body.marksTotal;
    const filter = {_id:enrglobal};
    const options = { upsert: true };
    const course = db.collection(courseglobal.toString());
    const marksO = `${examglobal}.${co}.${qid}.marksObtained`;
    const marksT = `${examglobal}.${co}.${qid}.totalMarks`;
    const updateDoc={
        $set: {
            [marksO]:marksOb,
            [marksT]:marksTotal
        }
    }
    const result = await course.updateOne(filter, updateDoc,options);
    
    return res.redirect('updatestudent.html')

})


app.post("/createcsv",async(req,res)=>{
    courseglobal = req.body.course;
    examglobal = req.body.exam;
    const filter = {_id:`${examglobal}schema`};
    const options = { upsert: true };
    const course = db.collection(courseglobal.toString());
    const updateDoc={
        $set: {
            _id:`${examglobal}schema`,
            "name": "name"
        }
    }
    const result = await course.updateOne(filter, updateDoc,options);
    return res.redirect('/updatecsv.html');
})

app.post("/updatecsv",async(req,res)=>{
    let co = req.body.co;
    let qid = req.body.qid;
    const filter = {_id:`${examglobal}schema`};
    const options = { upsert: true };
    const course = db.collection(courseglobal.toString());
    const marksObkey = `${qid}Ob`;
    const marksTkey = `${qid}T`;
    const marksObvalue = `${examglobal}.co${co}.${qid}.obt`;
    const marksTvalue = `${examglobal}.co${co}.${qid}.total`;
    const updateDoc={
        $set: {
            [marksObkey]:marksObvalue,
            [marksTkey]:marksTvalue
        }
    }
    const result = await course.updateOne(filter, updateDoc,options);
    
    return res.redirect('updatecsv.html')

})


app.get('/exportcsv',async(req,res)=>{
    let parserObj = new Parser();
    const doc = await db.collection(courseglobal.toString()).findOne(
    {
        _id:`${examglobal}schema`
    },
    (err,result)=>{
        if(err) throw err;
        console.log(result);
        let csv = parserObj.parse(result);
        console.log("csv file created:",csv);
        fs.writeFile('./data.csv',csv,callback);
        function callback()
        {
            return res.redirect('/csvdownload');
        }
    })
});


app.get('/csvdownload', (req, res) => {
    const filePath = `${__dirname}/data.csv`;

    const stream = fs.createReadStream(filePath);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'inline; filename="mydata.csv"');

    stream.pipe(res);
});

const csvStorage = multer.diskStorage({
    // Destination to store csv     
    destination: 'csv', 
      filename: (req, file, cb) => {
        cb(null, 'myupload.csv')
    }
});
const csvUpload = multer({
    storage: csvStorage,
    limits: {
      fileSize: 5000000 //5MB
    }
})

app.post('/upload_csv', csvUpload.single('csvupload'), (req, res) => {
    
    courseglobal = req.body.course;
    return res.redirect("/csv_2_json");
})

app.get("/csv_2_json",(req,res)=>{
    fs.createReadStream(`${__dirname}/csv/myupload.csv`)
    .pipe(csv2json({separator:','}))
    .pipe(fs.createWriteStream('mydata.json'));
    return res.redirect("/upload_json_database");
})


app.get("/upload_json_database",async(req,res)=>{
    const uploadedData = require('./mydata');
    console.log(uploadedData);
    for(let i=0;i<uploadedData.length;i++) //loop through the documents
    {
        let studentString = JSON.stringify(uploadedData[i]); //synchr...
        let idString;
        let keyString;
        let k;
        let marks;
        for(let j=1;j<studentString.length;j++)
        {

            if(studentString[j]=='_')
            {
                idString = studentString.substr(j+6,6);
            }
            if((studentString[j]=='"')&&(studentString[j+1]=='m'||studentString[j+1]=='e'))
            {
                k = j;
            }
            if((studentString[j]=='t'||studentString[j]=='l')&&(studentString[j-1]=='b'||studentString[j-1]=='a'))
            {
                keyString = studentString.substr(k+1,j-k)
                let x=0;
                while(x<2)
                {
                    if(studentString[j++]=='"')x++;
                }
                marks = studentString[j];
                while(studentString[++j]!='"')
                {
                    marks = marks + studentString[j];
                }
        
                const course = db.collection(courseglobal.toString());
                const filter = {_id:`${idString}`};
                const updateDoc={
                    $set: {
                        [keyString]:marks
                    }
                }
                const options = { upsert: true };
                const result = await course.updateOne(filter, updateDoc,options);
            }
        }
    }
    return res.redirect('addcsv.html');
})

app.get("/",(req,res)=>{
    res.set({
        "Allow-access-Allow-Origin": '*'
    })
    return res.redirect('home.html');
}).listen(port);

console.log(`Listening on PORT ${port}`);




// app.get("/upload_json_database",async(req,res)=>{

//     for(let i=0;i<uploadedData.length;i++) //loop through the documents
//     {
//         let studentString = JSON.stringify(uploadedData[i]); //synchr...
//         let idString;
//         let keyString;
//         let k;
//         let l;
//         for(let j=1;j<studentString.length;j++)
//         {
//             if(studentString[j]=='_')
//             {
//                 idString = studentString.substr(j+6,6);
//             }
//             if((studentString[j]=='"')&&(studentString[j+1]=='m'||studentString[j+1]=='e'))
//             {
//                 k = j;
//                 console.log('k=',k);
//             }
//             if(studentString[j]=='.')
//             {
//                 studentString = studentString.substr(0,j)+'":{"'+studentString.substr(j+1);
//             }
//             if((studentString[j]=='t'||studentString[j]=='l')&&(studentString[j-1]=='b'||studentString[j-1]=='a'))
//             {
//                 let x=0;
//                 while(x<3)
//                 {
//                     if(studentString[j++]=='"')x++;
//                 }
//                 keyString = studentString.substr(k,j-k)+"}}}}";
//                 keyString ='{"_id":"'+ idString +'",'+ keyString;
//                 finalDocumentJson = JSON.parse(keyString);
//                 console.log("final:",finalDocumentJson);
//                 await db.collection(courseglobal.toString()).save(finalDocumentJson,(err,collection)=>{
//                     if(err){
//                         throw err;
//                     }
//                     console.log(`json data inserted successfully in ${courseglobal}`);
//                 })
//             }
//         }
//     }
//     return res.redirect('addcsv.html');
// })
