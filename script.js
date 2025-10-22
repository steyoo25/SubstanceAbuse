// Game state
const state = {
    money: 0,
    withdrawalLevel: 0,
    substanceAbuseCount: 0,
    lastUsedDrug: null,
    drugTolerance: {},
    isUsingDrug: false
};

// DOM elements
const moneyDisplay = document.getElementById('money');
const moneyBtn = document.getElementById('moneyBtn');
const drugsContainer = document.querySelector('.drugs-container');
const rehabBtn = document.getElementById('rehabBtn');
const rehabModal = document.getElementById('rehabModal');
const rehabText = document.getElementById('rehabText');
const typingArea = document.getElementById('typingArea');
const submitRehab = document.getElementById('submitRehab');
const cancelRehab = document.getElementById('cancelRehab');
const flashOverlay = document.getElementById('flashOverlay');
const message = document.getElementById('message');
const backgroundMusic = document.getElementById('backgroundMusic');
const upbeatMusic = document.getElementById('upbeatMusic');

// Drug data
const drugs = [
    { id: 'alcohol', name: 'Alcohol', price: 3, icon: '🍺', effectTime: 5 },
    { id: 'marijuana', name: 'Marijuana', price: 5, icon: '🌿', effectTime: 7 },
    { id: 'cocaine', name: 'Cocaine', price: 10, icon: '❄️', effectTime: 9 },
    { id: 'heroin', name: 'Heroin', price: 20, icon: '💉', effectTime: 11 }
];

// Initialize drug tolerance
drugs.forEach(drug => {
    state.drugTolerance[drug.id] = drug.effectTime;
});

// Typing text for rehab
const rehabTypingText = "Recovery is a difficult journey that requires commitment and perseverance. Each day sober is a victory in the battle against addiction. You have the strength within you to overcome this challenge and rebuild your life. Stay focused on your goals and remember why you started this journey.";

// Initialize the game
function init() {
    updateDisplays();
    createDrugCards();
    setupEventListeners();
    playBackgroundMusic();
}

// Update money and withdrawal displays
function updateDisplays() {
    moneyDisplay.textContent = state.money;
    
    // Calculate background color based on withdrawal level
    const withdrawalFactor = Math.min(state.withdrawalLevel / 10, 1); // Cap at 1 (0.0 to 1.0)
    const greenValue = Math.floor(90 - (withdrawalFactor * 70)); // Green goes from 90 to 20
    const blueValue = Math.floor(45 - (withdrawalFactor * 35)); // Blue goes from 45 to 10
    const redValue = Math.floor(45 + (withdrawalFactor * 30)); // Red goes from 45 to 75
    
    // Create grayish color that gets more pronounced with withdrawal
    const grayValue = Math.floor(40 + (withdrawalFactor * 40)); // Gray goes from 40 to 80
    
    // Mix green nature color with gray based on withdrawal
    const finalRed = Math.floor(45 * (1 - withdrawalFactor) + grayValue * withdrawalFactor);
    const finalGreen = Math.floor(90 * (1 - withdrawalFactor) + grayValue * withdrawalFactor);
    const finalBlue = Math.floor(45 * (1 - withdrawalFactor) + grayValue * withdrawalFactor);
    
    // Apply background color and filter
    document.body.style.background = `linear-gradient(135deg, rgb(${finalRed}, ${finalGreen}, ${finalBlue}), rgb(${finalRed - 20}, ${finalGreen - 20}, ${finalBlue - 20}))`;
    document.body.style.filter = `blur(${Math.min(2, state.withdrawalLevel * 0.5)}px) brightness(${Math.max(20, 100 - state.withdrawalLevel * 5)}%)`;
}

// Create drug cards
function createDrugCards() {
    drugsContainer.innerHTML = '';
    
    drugs.forEach(drug => {
        const drugCard = document.createElement('div');
        drugCard.className = 'drug-card';
        drugCard.dataset.id = drug.id;
        
        drugCard.innerHTML = `
            <div class="drug-icon">${drug.icon}</div>
            <div class="drug-name">${drug.name}</div>
            <div class="drug-price">$${drug.price}</div>
        `;
        
        drugCard.addEventListener('click', () => useDrug(drug.id));
        drugsContainer.appendChild(drugCard);
    });
    
    updateDrugCards();
}

// Update drug cards based on affordability
function updateDrugCards() {
    const drugCards = document.querySelectorAll('.drug-card');
    
    drugCards.forEach(card => {
        const drugId = card.dataset.id;
        const drug = drugs.find(d => d.id === drugId);
        
        if (state.money >= drug.price && !state.isUsingDrug) {
            card.classList.remove('disabled');
        } else {
            card.classList.add('disabled');
        }
    });
}

// Use a drug
function useDrug(drugId) {
    if (state.isUsingDrug) return;
    
    const drug = drugs.find(d => d.id === drugId);
    
    if (state.money < drug.price) return;
    
    state.money -= drug.price;
    state.substanceAbuseCount++;
    state.isUsingDrug = true;
    
    // Check if this is a different drug than last time
    if (state.lastUsedDrug && state.lastUsedDrug !== drugId) {
        // Increase withdrawal more for switching drugs
        state.withdrawalLevel += 2;
    } else {
        // Increase withdrawal normally
        state.withdrawalLevel += 1;
    }
    
    // Get current tolerance for this specific drug
    const currentTolerance = state.drugTolerance[drugId];
    
    // Apply drug effect with current tolerance
    applyDrugEffect(drugId, currentTolerance);
    
    // Update tolerance for NEXT use of this specific drug
    // Tolerance never goes back up - only decreases or stays at minimum
    if (state.drugTolerance[drugId] > 1) {
        state.drugTolerance[drugId] -= 1;
    }
    
    state.lastUsedDrug = drugId;
    
    updateDisplays();
    updateDrugCards();
    
    // Show rehab button after 5 abuses
    if (state.substanceAbuseCount >= 5) {
        rehabBtn.style.display = 'block';
    }
}

// Apply visual and audio effects for drug use
function applyDrugEffect(drugId, effectTimeSeconds) {
    const drug = drugs.find(d => d.id === drugId);
    const effectTime = effectTimeSeconds * 1000; // Convert to milliseconds
    
    // Remove blur during drug effect (ecstasy)
    document.body.style.filter = 'none';
    
    moneyBtn.src = 'Assets/ecstatic.png';

    // Change music to upbeat
    backgroundMusic.pause();
    upbeatMusic.currentTime = 0;
    upbeatMusic.play().catch(e => console.log('Upbeat music play failed:', e));
    
    // Show message
    message.textContent = `${drug.name} Effect`;
    message.style.opacity = 1;
    
    // Colorful flash effect
    let flashCount = 0;
    const maxFlashes = Math.floor(effectTime / 200); // Faster flashing (200ms intervals)
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']; // Red, Green, Blue, Yellow, Magenta, Cyan
    
    const flashInterval = setInterval(() => {
        if (flashCount >= maxFlashes) {
            clearInterval(flashInterval);
            endDrugEffect();
            return;
        }
        // Random colorful flashing
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        flashOverlay.style.backgroundColor = randomColor;
        flashOverlay.style.opacity = flashCount % 2 === 0 ? 0.8 : 0.3;
        flashCount++;
    }, 200);
}

// End drug effect
function endDrugEffect() {
    flashOverlay.style.opacity = 0;
    message.style.opacity = 0;
    
    moneyBtn.src = 'Assets/money.png';

    // Reset music
    upbeatMusic.pause();
    upbeatMusic.currentTime = 0;
    backgroundMusic.play().catch(e => console.log('Background music play failed:', e));
    
    // Restore withdrawal effects after drug effect ends
    updateDisplays(); // This will set the appropriate background and filter
    
    state.isUsingDrug = false;
    updateDrugCards();
}


function startRehab() {
    // Ensure relaxing music is playing during rehab
    upbeatMusic.pause();
    upbeatMusic.currentTime = 0;
    if (backgroundMusic.paused) {
        backgroundMusic.play();
    }

    // Clear blur and restore green background while in rehab
    document.body.style.background = `linear-gradient(135deg, #2d5a2d, #3a7a3a)`;
    document.body.style.filter = 'none';
    
    rehabText.textContent = rehabTypingText;
    typingArea.value = '';
    typingArea.placeholder = 'Type the text above exactly as shown...';
    rehabModal.style.display = 'flex';
    typingArea.focus();
}

function submitRehabAttempt() {
    if (typingArea.value.trim() === rehabTypingText) {
        // Successful rehab
        state.withdrawalLevel = 0;
        state.substanceAbuseCount = 0;
        state.lastUsedDrug = null;
        
        // Reset drug tolerances
        drugs.forEach(drug => {
            state.drugTolerance[drug.id] = drug.effectTime;
        });
        
        updateDisplays(); // This will restore the green background
        rehabBtn.style.display = 'none';
        rehabModal.style.display = 'none';
        
        // Show success message
        message.textContent = 'Congratulations! You have completed TROSA!';
        message.style.opacity = 1;
        
        setTimeout(() => {
            message.style.opacity = 0;
        }, 3000);
    } else {
        // Failed attempt - reset typing area
        typingArea.value = '';
        typingArea.placeholder = 'Try again! You made a mistake. Type the text exactly as shown.';
        typingArea.focus();
    }
}

function doCancelRehab() {
    // Restore withdrawal background when leaving rehab
    updateDisplays();
    rehabModal.style.display = 'none';
}

// Event listeners
function setupEventListeners() {
    moneyBtn.addEventListener('click', () => {
        state.money += 1;
        updateDisplays();
        updateDrugCards();
    });
    
    rehabBtn.addEventListener('click', startRehab);
    submitRehab.addEventListener('click', submitRehabAttempt);
    cancelRehab.addEventListener('click', doCancelRehab);
    
    // Prevent pasting and right-click context menu in typing area
    typingArea.addEventListener('paste', (e) => {
        e.preventDefault();
        showTemporaryMessage('Pasting is not allowed in rehab!');
    });
    
    typingArea.addEventListener('copy', (e) => {
        e.preventDefault();
        showTemporaryMessage('Copying is not allowed in rehab!');
    });
    
    typingArea.addEventListener('cut', (e) => {
        e.preventDefault();
        showTemporaryMessage('Cutting is not allowed in rehab!');
    });
    
    // Prevent right-click context menu
    typingArea.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Prevent drag and drop
    typingArea.addEventListener('drop', (e) => e.preventDefault());
    typingArea.addEventListener('dragstart', (e) => e.preventDefault());
    
    // Prevent global right-click context menu
    document.addEventListener('contextmenu', (e) => e.preventDefault());
}

// Show temporary message when user tries to cheat
function showTemporaryMessage(text) {
    const tempMessage = document.createElement('div');
    tempMessage.textContent = text;
    tempMessage.style.position = 'fixed';
    tempMessage.style.top = '50%';
    tempMessage.style.left = '50%';
    tempMessage.style.transform = 'translate(-50%, -50%)';
    tempMessage.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
    tempMessage.style.color = 'white';
    tempMessage.style.padding = '10px 20px';
    tempMessage.style.borderRadius = '5px';
    tempMessage.style.zIndex = '1000';
    tempMessage.style.fontSize = '18px';
    
    document.body.appendChild(tempMessage);
    
    setTimeout(() => {
        document.body.removeChild(tempMessage);
    }, 2000);
}

// Background music
function playBackgroundMusic() {
    backgroundMusic.volume = 0.5;
    upbeatMusic.volume = 0.7; // Slightly louder for upbeat
    
    // Try to play background music initially
    backgroundMusic.play().catch(error => {
        console.log('Autoplay prevented. User interaction required to play audio.');
    });
    
    // Enable audio on first user interaction
    document.addEventListener('click', () => {
        if (backgroundMusic.paused && !state.isUsingDrug) {
            backgroundMusic.play();
        }
    }, { once: true });
}

// Initialize the game
init();