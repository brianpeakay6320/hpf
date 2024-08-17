

const btn = document.getElementById('btn')
const token = document.getElementById('token')
const phone = document.getElementById('phone')
const amount = document.getElementById('amount')

btn.addEventListener('click', function () {
    const token = token.value;  // Get token value

    // Make a POST request to the backend to fetch data
    fetch('/fetchData', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: token }),  // Send token to server
    })
    .then(response => response.json())  // Parse the JSON response
    .then(data => {
        // Update column 4 field with the response data
        document.getElementById('column4').value = data.column4Data;
    })
    .catch(error => {
        console.error('Error fetching data: ', error);
    });
});