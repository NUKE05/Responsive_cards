document.addEventListener('DOMContentLoaded', function() {
    fetchCardsAndDisplay();
});
function fetchCardsAndDisplay() {
    fetch('/get-cards')
        .then(response => response.json())
        .then(cards => {
            const tableBody = document.querySelector('#editable tbody');
            tableBody.innerHTML = '';
            cards.forEach(card => {
                const row = tableBody.insertRow();
                const wordCell = row.insertCell(0);
                const definitionCell = row.insertCell(1);
                wordCell.textContent = card.word;
                definitionCell.textContent = card.definition;
                
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.className = 'btn btn-danger btn-sm';
                deleteButton.setAttribute('data-word', card._id);
                deleteButton.addEventListener('click', function() {
                    deleteCard(card._id); // Assuming `word` is the identifier for a card
                });

                const deleteCell = row.insertCell(2);
                deleteCell.appendChild(deleteButton);

                const editCell = row.insertCell(3);
                const editButton = document.createElement('button');
                editButton.textContent = 'Edit';
                editButton.className = 'btn btn-success btn-sm';
                editButton.addEventListener('click', () => editCard(card._id, card.word));
                editCell.appendChild(editButton);


            });
        })
        .catch(error => console.error('Error fetching card:', error));
}

function deleteCard(wordId) {
    fetch(`/delete-card/${wordId}`, {
        method: 'DELETE',
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok.');
        }
        fetchCardsAndDisplay(); // Refresh the list of cards after deletion
    })
    .catch(error => {
        console.error('Error deleting card:', error);
    });
}

function editCard(cardId, currentWord) {
    document.getElementById('edit-word').value = currentWord;
    document.getElementById('edit-definition').value = '';
    document.getElementById('edit-card-form').style.display = 'block';

    document.getElementById('edit-card-form').onsubmit = (event) => {
        event.preventDefault();
        const newWord = document.getElementById('edit-word').value.trim();
        const newDefinition = document.getElementById('edit-definition').value.trim();

        if (!newWord) {
            console.error('Card cannot be empty');
            return;
        }

        fetch(`/update-card/${cardId}`, { // Change this line
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word: newWord, definition: newDefinition })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }
            fetchCardsAndDisplay();
            document.getElementById('edit-card-form').style.display = 'none';
        })
        .catch(error => console.error('Error updating card:', error));
    };
}