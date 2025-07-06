let menuMusic;
let hasStartedMusic = false;

function playMenuMusic() {
    if (!menuMusic) {
        menuMusic = new Audio('assets/sounds/saboteur.mp3');
        menuMusic.loop = true;
    }
    menuMusic.play().catch(error => {
        console.error("Erreur lors de la lecture de la musique :", error);
    });
}

function stopMenuMusic() {
    if (menuMusic) {
        menuMusic.pause();
        menuMusic.currentTime = 0;
    }
}

window.onload = function() {
    const menuOptions = document.querySelectorAll('.menu-option');
    
    let hoverSound = null;

    document.body.addEventListener('click', () => {
        if (!hasStartedMusic) { 
            playMenuMusic();
            hasStartedMusic = true;
        }
        if (!hoverSound) {
            hoverSound = new Audio('assets/sounds/menu_hover.wav');
        }
    }, { once: true });

    menuOptions.forEach(option => {
        option.addEventListener('mouseenter', () => {
            if (hoverSound) {
                hoverSound.play().catch(error => {
                    console.error("Erreur lors de la lecture du son :", error);
                });
            }
        });

        option.addEventListener('click', () => {
            stopMenuMusic();
            if (option.id === 'newGame') {
                window.location.href = 'game.html';
            } else if (option.id === 'tutorial') {
                window.location.href = 'tutorial.html'; 
            } else if (option.id === 'scores') {
                window.location.href = 'scores.html';
            } else if (option.id === 'credits') {
                window.location.href = 'credits.html';
            } else if (option.id === 'exit') {
                alert('Merci d\'avoir joué !');
            }
        });
    });
};
