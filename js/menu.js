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

function showExitDialog() {
    // Créer un overlay semi-transparent
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    overlay.style.zIndex = "1000";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    document.body.appendChild(overlay);

    // Créer la boîte de dialogue
    const dialogBox = document.createElement("div");
    dialogBox.style.backgroundColor = "#000080";
    dialogBox.style.border = "3px solid #FF0000";
    dialogBox.style.boxShadow = "0 0 20px #FF0000";
    dialogBox.style.borderRadius = "10px";
    dialogBox.style.padding = "30px";
    dialogBox.style.textAlign = "center";
    dialogBox.style.maxWidth = "500px";
    dialogBox.style.width = "90%";
    dialogBox.style.fontFamily = "'Press Start 2P', cursive";
    dialogBox.style.color = "#00FF00";
    overlay.appendChild(dialogBox);

    // Titre
    const title = document.createElement("h2");
    title.textContent = "QUITTER ?";
    title.style.color = "#FFFF00";
    title.style.textShadow = "0 0 10px #FFFF00";
    title.style.marginBottom = "20px";
    title.style.fontSize = "24px";
    dialogBox.appendChild(title);

    // Message
    const message = document.createElement("p");
    message.textContent = "Merci d'avoir joué à Gregonoïd !";
    message.style.marginBottom = "30px";
    message.style.fontSize = "14px";
    dialogBox.appendChild(message);

    // Conteneur pour les boutons
    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "center";
    buttonContainer.style.gap = "20px";
    dialogBox.appendChild(buttonContainer);

    // Bouton Quitter
    const quitButton = document.createElement("button");
    quitButton.textContent = "QUITTER";
    quitButton.style.backgroundColor = "#000000";
    quitButton.style.border = "2px solid #FF0000";
    quitButton.style.color = "#FF0000";
    quitButton.style.boxShadow = "inset 0 0 10px #000000, 0 0 10px #FF0000";
    quitButton.style.textShadow = "0 0 5px #FF0000";
    quitButton.style.padding = "10px 20px";
    quitButton.style.fontFamily = "'Press Start 2P', cursive";
    quitButton.style.cursor = "pointer";
    quitButton.style.fontSize = "12px";
    buttonContainer.appendChild(quitButton);

    // Bouton Annuler
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "ANNULER";
    cancelButton.style.backgroundColor = "#000000";
    cancelButton.style.border = "2px solid #00FF00";
    cancelButton.style.color = "#00FF00";
    cancelButton.style.boxShadow = "inset 0 0 10px #000000, 0 0 10px #00FF00";
    cancelButton.style.textShadow = "0 0 5px #00FF00";
    cancelButton.style.padding = "10px 20px";
    cancelButton.style.fontFamily = "'Press Start 2P', cursive";
    cancelButton.style.cursor = "pointer";
    cancelButton.style.fontSize = "12px";
    buttonContainer.appendChild(cancelButton);

    // Sons
    const hoverSound = new Audio('assets/sounds/menu_hover.wav');
    const clickSound = new Audio('assets/sounds/blip.wav');

    // Effets hover
    quitButton.addEventListener("mouseenter", function () {
        this.style.backgroundColor = "#110000";
        hoverSound.currentTime = 0;
        hoverSound.play().catch((e) => console.error(e));
    });

    quitButton.addEventListener("mouseleave", function () {
        this.style.backgroundColor = "#000000";
    });

    cancelButton.addEventListener("mouseenter", function () {
        this.style.backgroundColor = "#001100";
        hoverSound.currentTime = 0;
        hoverSound.play().catch((e) => console.error(e));
    });

    cancelButton.addEventListener("mouseleave", function () {
        this.style.backgroundColor = "#000000";
    });

    // Actions des boutons
    quitButton.addEventListener("click", function () {
        clickSound.play();
        // Essayer de fermer l'onglet
        window.close();
        // Si ça ne marche pas (sécurité du navigateur), afficher un message
        setTimeout(() => {
            overlay.innerHTML = "";
            const farewell = document.createElement("div");
            farewell.style.color = "#FFFF00";
            farewell.style.fontSize = "20px";
            farewell.style.textAlign = "center";
            farewell.style.fontFamily = "'Press Start 2P', cursive";
            farewell.style.textShadow = "0 0 10px #FFFF00";
            farewell.innerHTML = "Merci d'avoir joué !<br><br>Vous pouvez fermer cette fenêtre.";
            overlay.appendChild(farewell);
        }, 100);
    });

    cancelButton.addEventListener("click", function () {
        clickSound.play();
        document.body.removeChild(overlay);
    });
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
                showExitDialog();
            }
        });
    });
};