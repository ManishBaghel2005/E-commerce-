import BASE_URL from "./config.js";

let pendingCartAction = null;

// ==========================================
// 1. OPEN & CLOSE MODAL FUNCTIONS
// ==========================================
window.openLeadModal = function(actionElement) {
    pendingCartAction = actionElement; 
    const modal = document.getElementById('leadModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex'; // Extra safety fallback
    }
};

window.closeLeadModal = function() {
    const modal = document.getElementById('leadModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none'; // Extra safety fallback
    }
    pendingCartAction = null;
};

// ==========================================
// 2. GLOBAL EVENT DELEGATION (CROSS BUTTON & OVERLAY CLICK)
// ==========================================
document.addEventListener('click', (event) => {
    // A) Check if Cross (×) button was clicked
    const isCloseBtn = event.target.closest('#closeLeadModal') || 
                       event.target.closest('.close-modal-btn') || 
                       event.target.innerText === '×' || 
                       event.target.textContent.trim() === '×';

    if (isCloseBtn) {
        event.preventDefault();
        event.stopPropagation();
        window.closeLeadModal();
        return;
    }

    // B) Check if clicked on Dark Backdrop Overlay outside the form
    const modal = document.getElementById('leadModal');
    if (modal && event.target === modal) {
        window.closeLeadModal();
    }
});

// ESC Key shortcut to close lead modal
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        window.closeLeadModal();
    }
});

// ==========================================
// 3. CART BUTTON HANDLER LOGIC
// ==========================================
window.handleCartButtonClick = function(buttonElement) {
    const isLeadFilled = localStorage.getItem('leadFilled');
    
    if (isLeadFilled === 'true') {
        if (typeof window.toggleCartState === 'function') {
            window.toggleCartState(buttonElement);
        } else if (typeof toggleCartState === 'function') {
            toggleCartState(buttonElement);
        } else {
            console.error("Critical: toggleCartState handler missing on this layout viewport.");
        }
    } else {
        window.openLeadModal(buttonElement);
    }
};

// ==========================================
// 4. LEAD FORM SUBMISSION
// ==========================================
window.handleLeadSubmit = async function(event) {
    event.preventDefault();
    
    const name = document.getElementById('leadName')?.value;
    const email = document.getElementById('leadEmail')?.value;
    const phone = document.getElementById('leadPhone')?.value;
    const address = document.getElementById('leadAddress')?.value;

    try {
        const response = await fetch(`${BASE_URL}/api/lead/newlead`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, address })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('leadFilled', 'true');
            window.closeLeadModal();
            
            alert("Details verified successfully!");
            
            if (pendingCartAction) {
                if (typeof window.toggleCartState === 'function') {
                    window.toggleCartState(pendingCartAction);
                } else if (typeof toggleCartState === 'function') {
                    toggleCartState(pendingCartAction);
                }
            }
        } else {
            alert(data.error || "Please check the form fields.");
        }
    } catch (err) {
        console.error("Lead submission network error:", err);
        alert("Server validation processing failed.");
    }
};