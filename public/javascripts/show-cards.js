document.addEventListener('DOMContentLoaded', function() {
    let currentCardIndex = 0;
    const cards = document.querySelectorAll('.card-flip');

    function showCard(index) {
        cards.forEach(card => card.style.display = 'none');
        cards[index].style.display = 'flex';
    }

    function flipCard(card) {
        card.classList.toggle('flipped');
    }

    cards.forEach(card => {
        card.addEventListener('click', () => flipCard(card));
    });

    document.getElementById('prev').addEventListener('click', () => {
        if (currentCardIndex > 0) {
            currentCardIndex -= 1;
            showCard(currentCardIndex);
        }
    });

    document.getElementById('next').addEventListener('click', () => {
        if (currentCardIndex < cards.length - 1) {
            currentCardIndex += 1;
            showCard(currentCardIndex);
        }
    });

    showCard(currentCardIndex);
});
