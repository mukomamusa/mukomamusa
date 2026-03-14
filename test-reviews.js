const fetch = require('node-fetch');

async function runTests() {
  // 1. POST: Create a review
  let res = await fetch('http://localhost:3000/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      booking_id: 1,
      company_id: 2,
      customer_id: 4,
      rating: 5,
      review_text: 'Great service!'
    })
  });
  const postData = await res.json();
  console.log('POST:', postData);

  // 2. GET: Fetch reviews for company 2
  res = await fetch('http://localhost:3000/api/reviews?company_id=2');
  const getData = await res.json();
  console.log('GET:', getData);

  // 3. PATCH: Approve the review
  res = await fetch('http://localhost:3000/api/reviews', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: postData.id, status: 'approved' })
  });
  const patchData = await res.json();
  console.log('PATCH:', patchData);

  // 4. GET again to confirm status
  res = await fetch('http://localhost:3000/api/reviews?company_id=2');
  const getData2 = await res.json();
  console.log('GET after PATCH:', getData2);
}

runTests().catch(console.error);
