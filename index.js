const bodyParser = require('body-parser')
const express = require('express')
const mysql = require('mysql');
const app = express()

app.use(express.static('public'))
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())



const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "mypass",
    database: "tvet_clinic"
})

con.connect((err) => {
    if(err) throw err;
    console.log("connected successefully")
  
})

app.get('/about', (req, res)=>{
    res.render('about.ejs')
})


app.get('/', (req, res) => {
    // con.query('select * from patients', (err, results) => {
    //     if(!err){
    //         const result = results
           
    //     } else{
    //         throw err
    //     }
      
    // })
    res.render('home')
   
})



app.post('/appointment', (req, res) => {
    const {name, email, tellNo, date, time} = req.body

    const insertQuery = 'insert into appointments (name, email, tellNo, date, time) values (?, ?, ?, ?, ?)'
    con.query(insertQuery, [name, email, tellNo, date, time], (err, result) => {
        if(!err){
            console.log(result + 'rows changedddd')
            res.end('Submitted Successefully')
        } else {
            console.log('an erroe occured' + err)
        }
    })
})


app.listen(4444, ()=>{
    console.log('listening to port 4444')
})