const seatGrid = document.getElementById('seat-grid');
const bookBtn = document.getElementById('book-btn');
const resetBtn = document.getElementById('reset-btn');
const statusMsg = document.getElementById('status-msg');

let selectedSeat = null;

async function fetchSeats() {
    try {
        const response = await fetch('/seats');
        const seats = await response.json();
        renderSeats(seats);
    } catch (err) {
        console.error('Failed to fetch seats:', err);
        showMessage('Error loading seats.', 'error');
    }
}

function renderSeats(seats) {
    seatGrid.innerHTML = '';
    seats.forEach(seatData => {
        const seatId = seatData.seat.split(':')[1];
        const div = document.createElement('div');
        div.className = `seat ${seatData.status}`;
        div.textContent = seatId;

        if (selectedSeat === seatId) {
            div.classList.add('selected');
        }

        if (seatData.status === 'available') {
            div.onclick = () => selectSeat(seatId, div);
        }

        seatGrid.appendChild(div);
    });
}

function selectSeat(seatId, el) {
    if (selectedSeat === seatId) {
        selectedSeat = null;
        el.classList.remove('selected');
        bookBtn.disabled = true;
    } else {
        selectedSeat = seatId;
        document.querySelectorAll('.seat').forEach(s => s.classList.remove('selected'));
        el.classList.add('selected');
        bookBtn.disabled = false;
        showMessage(`Selected Seat ${seatId}`, '');
    }
}

bookBtn.onclick = async () => {
    if (!selectedSeat) return;

    bookBtn.disabled = true;
    showMessage(`Booking seat ${selectedSeat}...`, 'loading');

    try {
        const response = await fetch(`/book/${selectedSeat}`, { method: 'POST' });
        const text = await response.text();

        if (response.ok) {
            showMessage(text, 'success');
            selectedSeat = null;
            bookBtn.disabled = true;
            fetchSeats();
        } else {
            showMessage(text, 'error');
            fetchSeats();
        }
    } catch (err) {
        showMessage('Booking failed. Server error.', 'error');
    }
};

resetBtn.onclick = async () => {
    if (!confirm('Are you sure you want to reset all seats?')) return;

    try {
        await fetch('/reset', { method: 'POST' });
        showMessage('All seats reset!', 'success');
        selectedSeat = null;
        bookBtn.disabled = true;
        fetchSeats();
    } catch (err) {
        showMessage('Reset failed.', 'error');
    }
};

function showMessage(msg, type) {
    statusMsg.textContent = msg;
    statusMsg.className = `status-msg ${type}`;
}

// Initial fetch and poll every 3 seconds
fetchSeats();
setInterval(fetchSeats, 3000);
