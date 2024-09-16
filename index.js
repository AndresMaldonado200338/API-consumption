const express = require('express');
const axios = require('axios');
const path = require('path');
const stringSimilarity = require('string-similarity');

const app = express();
const port = 3000;

const RAPIDAPI_KEY = 'b67725d7d2msh377f8897c14d383p11c55ejsnc9403f2fe154';
const RAPIDAPI_HOST = 'watchmode.p.rapidapi.com';

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/anime/:query', async (req, res) => {
    const { query } = req.params;
    try {
        const response = await axios.get(`https://api.jikan.moe/v4/anime?q=${query}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching anime data' });
    }
});

app.get('/api/platforms/:title', async (req, res) => {
    const { title } = req.params;

    try {
        const animeResponse = await axios.get(`https://api.jikan.moe/v4/anime?q=${title}`);
        const animeData = animeResponse.data.data[0];
        const jikanTitles = animeData.titles.map(t => t.title);

        const searchResponse = await axios.get('https://watchmode.p.rapidapi.com/search/', {
            params: {
                search_field: 'name',
                search_value: title
            },
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': RAPIDAPI_HOST
            }
        });

        const watchmodeTitle = searchResponse.data.title_results[0];
        const watchmodeTitleName = watchmodeTitle.name;
        console.log('Watchmode title:', watchmodeTitleName);
        console.log('Jikan titles:', jikanTitles);

        const bestMatch = stringSimilarity.findBestMatch(watchmodeTitleName, jikanTitles);
        const bestMatchTitle = bestMatch.bestMatch.target;
        const rating = bestMatch.bestMatch.rating;
        console.log(`Best match: ${bestMatchTitle}, Rating: ${rating}`);

        const similarityThreshold = 0.7;

        if (rating >= similarityThreshold) {
            console.log(`Matching title found: ${bestMatchTitle}`);

            const imdb_id = watchmodeTitle.imdb_id;
            console.log('IMDb ID:', imdb_id);

            let tmdb_id = watchmodeTitle.tmdb_id;
            let tmdb_type = watchmodeTitle.tmdb_type;
            console.log('TMDb ID:', tmdb_id);
            console.log('TMDb Type:', tmdb_type);

            let idToUse = null;

            if (imdb_id) {
                idToUse = imdb_id;
            } else if (tmdb_id) {
                const prefix = tmdb_type === 'tv' || tmdb_type === 'tv_series' ? 'tv-' : 'movie-';
                idToUse = prefix + tmdb_id;
                console.log('ID to use:', idToUse);
            }

            if (idToUse) {
                const platformsResponse = await axios.get(`https://watchmode.p.rapidapi.com/title/${idToUse}/sources/`, {
                    headers: {
                        'x-rapidapi-key': RAPIDAPI_KEY,
                        'x-rapidapi-host': RAPIDAPI_HOST
                    },
                    params: {
                        source_type: idToUse
                    }
                });

                res.json(platformsResponse.data);
            } else {
                res.status(404).json({ error: 'No valid IMDb or TMDb ID found for this title' });
            }

        } else {
            res.status(404).json({ error: 'No sufficiently similar title found between Jikan and Watchmode' });
        }
    } catch (error) {
        console.error('Error fetching platforms:', error);
        res.status(500).json({ error: 'Error fetching platforms' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});