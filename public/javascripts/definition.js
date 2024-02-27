document.getElementById('fact-button').addEventListener('click', async function(e) {
    e.preventDefault();
    const response = await fetch(`/facts-random`);
    const data = await response.json();
    const response2 = await fetch(`/random-education-quote`)
    const data2 = await response2.json()
    document.getElementById('definition').textContent = `${data}`;
    document.getElementById('quote').textContent = `${data2.quote} - ${data2.author}`
});
