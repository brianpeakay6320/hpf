const bodyParser = require('body-parser')
const express = require('express')
const mysql = require('mysql');
const axios = require('axios');
const base64 = require('base-64');
const app = express()
const consumerKey = 'bScGoTeYFdFtzDzY7Kq8T95Q9gd1xx9AUrbxbisNQx6U1BhY';
const passkey = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'
const consumerSecret = 'wZ75aORxRAozNMCxMQkZzL4Q0vSj4elKgrpoyNxGpSvZaCArk2xgGr5lOxvne7ch';



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

app.get('/mpesa', (req, res)=>{
  res.render('mpesa.ejs')
})


app.get('/', (req, res) => {
    // con.query('select * from patients', (err, results) => {
    //     if(!err){
    //         const result = results
           
    //     } else{
    //         throw err
    //     }
      
    // })
    // generateAccessToken()
    // .then((accessToken) => {
    //   console.log("😀 Your access token is " + accessToken);
    // })
    // res.json("name")
    res.render('home')
   
})


app.get("/access_token", (req, res) => {
  generateAccessToken()
    .then((accessToken) => {
      res.send("😀 Your access token is " + accessToken);
    })
    .catch(console.log);
});


app.post('/fetchData', (req, res) => {
  const token = req.body.token;  // Get token from request

  const query = 'SELECT tellNo, balance FROM patients WHERE token = ?';
  con.query(query, [token], (err, result) => {
      if (err) {
          console.error('Error querying database: ', err);
          return res.status(500).json({ error: 'Database query failed' });
      }

      if (result.length > 0) {
          // Send back the value of tellNo and balance as JSON
          res.json({ tellNo: result[0].tellNo, balance: result[0].balance });
      } else {
          res.json({ error: 'No data found for the provided token' });
      }
  });
});




///////   MY FUNCTIONS


// Function to generate Safaricom access token

const generateAccessToken = async () => {

    const url = 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

    const credentials = `${consumerKey}:${consumerSecret}`;
    const auth = 'Basic ' + Buffer.from(credentials).toString('base64');

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': auth,
                'Content-Type': 'application/json'
            }
        });
        return response.data.access_token;
    } catch (error) {
        console.error('Error generating access token:', error);
        throw error;
    }
};




// Calling the function
// generateAccessToken()
//     .then(token => {
//         console.log('Token generated:', token);
//     })
//     .catch(error => {
//         console.log('Failed to generate token:', error);
//     });




  const generateTimestamp = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  };

  // const initiatePayment = async (accessToken, paymentRequest) => {
  //   try {
  //     const response = await axios.post(
  //       'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
  //       paymentRequest,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${accessToken}`,
  //         },
  //       }
  //     );
  //     console.log('done one')
  //     return response.data;
  //   } catch (error) {
  //     console.log('error one')
  //     throw error;
  //   }
  // }

  // Generate Password
  const generatePassword = (shortcode, passkey, timestamp) => {
    const rawPassword = `${shortcode}${passkey}${timestamp}`;
    return Buffer.from(rawPassword).toString('base64');
  };
  
  const Password = generatePassword('174379', passkey, generateTimestamp());
  




  //////ROUTES
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


app.post('/callback', (req, res) => {
  // Handle M-Pesa callback data
  console.log('M-Pesa Callback:', req.body);
  res.sendStatus(200);  // Respond with 200 OK
});

app.post('/lipa', async (req, res) => {
  try {
      const accessToken = await generateAccessToken();

      const paymentRequest = {
          BusinessShortCode: '174379',
          Password: Password,
          Timestamp: generateTimestamp(),
          TransactionType: 'CustomerPayBillOnline',
          Amount: req.body.amount,  // Use the amount from the form
          PartyA: req.body.phone,
          PartyB: '174379',
          PhoneNumber: req.body.phone,
          CallBackURL: 'https://yourdomain.com/callback',
          AccountReference: 'test',
          TransactionDesc: 'Payment for Order',
      };

      const response = await axios.post('https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest', paymentRequest, {
          headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
          }
      });

      console.log('Payment response:', response.data);
      res.status(200).json({ message: 'Payment initiated successfully', data: response.data });
  } catch (error) {
      if (error.response) {
          console.error('Error response data:', error.response.data);
      } else {
          console.error('Error message:', error.message);
      }
      res.status(500).json({ message: 'Payment initiation failed', error: error.message });
  }
});


// app.get('/lipa', (req,res) => {
//   generateAccessToken()
//   .then((accessToken) => {
//     const url =
//       "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
//     const auth = "Bearer " + accessToken;
//     const timestamp = moment().format("YYYYMMDDHHmmss");
//     const password = new Buffer.from(
//       "174379" +
//         "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919" +
//         timestamp
//     ).toString("base64");

//     axios
//       .post(
//         url,
//         {
          
//             "BusinessShortCode": 174379,
//             "Password": "MTc0Mzc5YmZiMjc5ZjlhYTliZGJjZjE1OGU5N2RkNzFhNDY3Y2QyZTBjODkzMDU5YjEwZjc4ZTZiNzJhZGExZWQyYzkxOTIwMjQwODE1MTc1MDA4",
//             "Timestamp": "20240815175008",
//             "TransactionType": "CustomerPayBillOnline",
//             "Amount": 1,
//             "PartyA": 254748964048,
//             "PartyB": 174379,
//             "PhoneNumber": 254748964048,
//             "CallBackURL": "https://mydomain.com/path",
//             "AccountReference": "CompanyXLTD",
//             "TransactionDesc": "Payment of X" 
          
//         },
//         {
//           headers: {
//             Authorization: auth,
//           },
//         }
//       )
//       .then((response) => {
//         res.send("😀 Request is successful done ✔✔. Please enter mpesa pin to complete the transaction");
//       })
//       .catch((error) => {
//         console.log(error);
//         res.status(500).send("❌ Request failed");
//       });
//   })
//   .catch(console.log);
// });




app.listen(4444, ()=>{
    console.log('listening to  http://192.168.88.81:4444')
})