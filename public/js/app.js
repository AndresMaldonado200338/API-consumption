document.getElementById('searchForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const query = document.getElementById('searchQuery').value;

    try {
        const animeResponse = await fetch(`/api/anime/${query}`);
        if (!animeResponse.ok) throw new Error('Network response was not ok');
        const animeData = await animeResponse.json();

        let resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = '';

        animeData.data.forEach(anime => {
            const animeCard = `
                <div class="card mt-3">
                    <img src="${anime.images.jpg.large_image_url}" class="card-img-top" alt="${anime.title}">
                    <div class="card-body">
                        <h5 class="card-title">${anime.title}</h5>
                        <button class="btn btn-info" onclick="showDetails(${anime.mal_id})" aria-label="View details for ${anime.title}">View Details</button>
                    </div>
                </div>`;
            resultsDiv.innerHTML += animeCard;
        });
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        document.getElementById('results').innerHTML = '<p>Failed to fetch anime data. Please try again later.</p>';
    }
});

async function showDetails(animeId) {
    const response = await fetch(`https://api.jikan.moe/v4/anime/${animeId}`);
    const data = await response.json();
    const anime = data.data;

    let detailsDiv = document.createElement('div');
    detailsDiv.classList.add('anime-details');
    detailsDiv.innerHTML = `
        <h2>${anime.title}</h2>
        <img src="${anime.images.jpg.large_image_url}" alt="${anime.title}" class="img-fluid">
        <p><strong>Synopsis:</strong> ${anime.synopsis}</p>
        <p><strong>Rating:</strong> ${anime.score}</p>

        <!-- Mostrar tráiler embebido -->
        <div class="trailer">
            <h4>Trailer:</h4>
            ${anime.trailer ? `<iframe width="560" height="315" src="${anime.trailer.embed_url}" 
                title="Anime Trailer" frameborder="0" allowfullscreen></iframe>` : 'Trailer not available'}
        </div>

        <h4>Characters:</h4>
        <div id="characterCarousel" class="carousel slide mt-3">
            <div class="carousel-inner" id="characterList"></div>
            <button class="carousel-control-prev" type="button" data-bs-target="#characterCarousel" data-bs-slide="prev">
                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Previous</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#characterCarousel" data-bs-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Next</span>
            </button>
        </div>
        
        <!-- Contenedor para mostrar las plataformas -->
        <div id="platformsList" class="mt-3">
            <h4>Available on:</h4>
            <p id="loadingPlatforms">Loading platforms...</p>
        </div>
    `;

    let resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    resultsDiv.appendChild(detailsDiv);

    const characterResponse = await fetch(`https://api.jikan.moe/v4/anime/${animeId}/characters`);
    const characterData = await characterResponse.json();

    const characterList = document.getElementById('characterList');
    characterList.innerHTML = '';

    const itemsPerSlide = 4; // Número de elementos por slide
    let currentSlide = `<div class="carousel-item active"><div class="row">`;

    characterData.data.forEach((character, index) => {
        const japaneseVoiceActors = character.voice_actors.filter(voiceActor => voiceActor.language === 'Japanese');

        const characterCard = `
            <div class="col-3">
                <div class="text-center">
                    <img src="${character.character.images.jpg.image_url}" alt="${character.character.name}" class="img-fluid mb-2" style="max-height: 150px;">
                    <p><strong>${character.character.name}</strong></p>
                    <p>Voiced by: ${japaneseVoiceActors.length > 0 ? japaneseVoiceActors[0].person.name : 'N/A'}</p>
                </div>
            </div>`;

        currentSlide += characterCard;

        if ((index + 1) % itemsPerSlide === 0) {
            currentSlide += `</div></div>`;
            characterList.innerHTML += currentSlide;
            currentSlide = `<div class="carousel-item"><div class="row">`;
        }
    });

    if (currentSlide.includes('<div class="row">')) {
        currentSlide += `</div></div>`;
        characterList.innerHTML += currentSlide;
    }

    try {
        const platformResponse = await fetch(`/api/platforms/${anime.title}`);
        const platformsData = await platformResponse.json();

        const platformsList = document.getElementById('platformsList');
        platformsList.innerHTML = '';

        if (platformsData.length > 0) {
            platformsData.forEach(platform => {
                const platformItem = `
                    <p><strong>${platform.name}</strong>: <a href="${platform.web_url}" target="_blank">Watch here</a></p>
                `;
                platformsList.innerHTML += platformItem;
            });
        } else {
            platformsList.innerHTML = '<p>No platforms found.</p>';
        }
    } catch (error) {
        console.error('Error fetching platforms:', error);
        document.getElementById('platformsList').innerHTML = '<p>Error loading platforms. Please try again later.</p>';
    }
}