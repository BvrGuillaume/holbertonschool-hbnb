document.addEventListener('DOMContentLoaded', () => {
    // Vérification de l'authentification au chargement de la page
    checkAuthentication();

    const loginForm = document.getElementById('login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const email = loginForm.querySelector('input[type="email"]').value.trim();
            const password = loginForm.querySelector('input[type="password"]').value.trim();

            if (!email || !password) {
                alert("Veuillez remplir tous les champs.");
                return;
            }

            await loginUser(email, password);
        });
    }

    // Ajout d'un écouteur pour le filtre de prix
    const priceFilter = document.getElementById('price-filter');
    if (priceFilter) {
        priceFilter.addEventListener('change', (event) => {
            const selectedPrice = event.target.value;
            const places = document.querySelectorAll('.place');

            places.forEach(place => {
                const price = parseFloat(place.querySelector('p:nth-child(4)').textContent.replace('Price: $', ''));
                if (selectedPrice === 'All' || price <= parseFloat(selectedPrice)) {
                    place.style.display = 'block';
                } else {
                    place.style.display = 'none';
                }
            });
        });
    }

    const token = getCookie('token');
    const placeId = getPlaceIdFromURL();

    if (placeId) {
        if (token) {
            fetchPlaceDetails(token, placeId);
            document.getElementById('add-review').style.display = 'block';
        } else {
            document.getElementById('add-review').style.display = 'none';
        }
    } else {
        console.error('Aucun ID de lieu trouvé dans l\'URL.');
    }

    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const reviewText = document.getElementById('review-text').value.trim();
            if (!reviewText) {
                alert('Veuillez écrire un avis avant de soumettre.');
                return;
            }

            await submitReview(token, placeId, reviewText);
        });
    }
});

// Fonction pour vérifier l'authentification
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function checkAuthentication() {
    const token = getCookie('token');
    if (!token) {
        window.location.href = 'index.html';
    }
    return token;
}

// Extraire l'ID du lieu depuis l'URL
function getPlaceIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('place_id');
}

// Fonction pour récupérer les données des places
async function fetchPlaces(token) {
    try {
        const response = await fetch('http://localhost:5000/api/v1/places', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const places = await response.json();
            displayPlaces(places);
        } else {
            console.error('Erreur lors de la récupération des places:', response.statusText);
        }
    } catch (error) {
        console.error('Erreur réseau:', error);
    }
}

// Fonction pour afficher les places
function displayPlaces(places) {
    const placesList = document.getElementById('places-list');
    placesList.innerHTML = ''; // Effacer le contenu actuel

    places.forEach(place => {
        const placeDiv = document.createElement('div');
        placeDiv.className = 'place';

        placeDiv.innerHTML = `
            <h3>${place.name}</h3>
            <p>${place.description}</p>
            <p>Location: ${place.location}</p>
            <p>Price: $${place.price}</p>
        `;

        placesList.appendChild(placeDiv);
    });
}

// Fonction de connexion
async function loginUser(email, password) {
    try {
        const response = await fetch('http://localhost:5000/api/v1/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();

            
            const date = new Date();
            date.setTime(date.getTime() + (24 * 60 * 60 * 1000));
            document.cookie = `token=${data.access_token}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;

            
            window.location.href = 'index.html';
        } else {
            const errorData = await response.json();
            alert('Échec de la connexion : ' + (errorData.message || 'Identifiants invalides'));
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Erreur de connexion au serveur');
    }
}

async function fetchPlaceDetails(token, placeId) {
    try {
        const response = await fetch(`http://localhost:5000/api/v1/places/${placeId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const place = await response.json();
            displayPlaceDetails(place);
        } else {
            console.error('Erreur lors de la récupération des détails du lieu:', response.statusText);
        }
    } catch (error) {
        console.error('Erreur réseau:', error);
    }
}

function displayPlaceDetails(place) {
    const placeDetails = document.getElementById('place-details');
    placeDetails.innerHTML = '';

    const detailsHTML = `
        <h2>${place.name}</h2>
        <p>${place.description}</p>
        <p>Price: $${place.price}</p>
        <h3>Amenities</h3>
        <ul>
            ${place.amenities.map(amenity => `<li>${amenity}</li>`).join('')}
        </ul>
        <h3>Reviews</h3>
        <ul>
            ${place.reviews.map(review => `<li>${review.user}: ${review.comment}</li>`).join('')}
        </ul>
    `;

    placeDetails.innerHTML = detailsHTML;
}

// Faire une requête AJAX pour soumettre l'avis
async function submitReview(token, placeId, reviewText) {
    try {
        const response = await fetch(`http://localhost:5000/api/v1/places/${placeId}/reviews`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ comment: reviewText })
        });

        handleResponse(response); // Gérer la réponse de l'API
    } catch (error) {
        console.error('Erreur réseau:', error);
        alert('Erreur lors de la soumission de l\'avis.');
    }
}

// Gérer la réponse de l'API
function handleResponse(response) {
    if (response.ok) {
        alert('Avis soumis avec succès !');
        document.getElementById('review-form').reset();
    } else {
        alert('Échec de la soumission de l\'avis.');
    }
}
